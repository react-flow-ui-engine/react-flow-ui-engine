import { canAccess } from './permissions';
import { runValidators } from './validation';
import type {
  FlowContext,
  FlowDefinition,
  FlowEngineEvent,
  FlowEngineOptions,
  FlowEngineState,
  FlowEvent,
  FlowStepId,
  FlowTransitionResult,
} from './types';

type Listener<TContext extends FlowContext> = (state: FlowEngineState<TContext>) => void;

const now = () => Date.now();

const resolve = <TContext extends FlowContext>(
  value: FlowStepId | ((ctx: TContext) => FlowStepId) | undefined,
  ctx: TContext,
) => (typeof value === 'function' ? value(ctx) : value);

function normalizeActionResult<TContext extends FlowContext>(
  result: FlowTransitionResult<TContext>,
): { goTo?: string; set?: Partial<TContext>; errors?: string[]; cancel?: boolean } {
  if (!result) return {};
  if (typeof result === 'string') return { goTo: result };
  if ('goTo' in result || 'set' in result || 'errors' in result || 'cancel' in result) return result;
  return { set: result as Partial<TContext> };
}

export function createFlowEngine<TContext extends FlowContext>(
  flow: FlowDefinition<TContext>,
  options: FlowEngineOptions<TContext> = {},
) {
  let state: FlowEngineState<TContext> = {
    flowId: flow.id,
    currentStepId: flow.initial,
    context: { ...flow.context },
    history: [],
    status: 'idle',
    errors: [],
  };

  const listeners = new Set<Listener<TContext>>();

  const event = (
    type: FlowEngineEvent<TContext>['type'],
    payload: Record<string, unknown> = {},
  ) => {
    options.onEvent?.({
      type,
      flowId: flow.id,
      timestamp: now(),
      payload: { ...payload, state },
    });
  };

  const notify = () => {
    listeners.forEach((listener) => listener(state));
    event('FLOW_STATE_CHANGED');
  };

  const patchState = (patch: Partial<FlowEngineState<TContext>>) => {
    state = { ...state, ...patch };
    notify();
  };

  const currentStep = () => flow.steps[state.currentStepId];

  async function goTo(stepId: FlowStepId, pushHistory = true) {
    const from = state.currentStepId;
    const source = currentStep();
    const target = flow.steps[stepId];

    if (!target) throw new Error(`Unknown step '${stepId}'.`);
    if (target.visibleIf && !target.visibleIf(state.context)) {
      throw new Error(`Step '${stepId}' is not visible.`);
    }

    if (!canAccess(target.permissions, state.context, options.user)) {
      event('FLOW_PERMISSION_BLOCKED', { stepId });
      const fallback = target.permissions?.fallbackStep ?? options.unauthorizedStep;
      if (fallback && flow.steps[fallback]) return goTo(fallback, pushHistory);
      patchState({ status: 'blocked', errors: [`Unauthorized access to '${stepId}'.`] });
      return;
    }

    const errors = await runValidators(target.validate, state.context);
    if (errors.length) {
      event('FLOW_VALIDATION_FAILED', { stepId, errors });
      patchState({ status: 'blocked', errors });
      return;
    }

    patchState({ status: 'transitioning', errors: [] });
    await source.beforeLeave?.(state.context);
    await target.beforeEnter?.(state.context);

    state = {
      ...state,
      currentStepId: stepId,
      history: pushHistory ? [...state.history, from] : state.history.slice(0, -1),
      status: 'idle',
      errors: [],
      pendingEvent: undefined,
    };

    options.onStepChange?.({ flowId: flow.id, from, to: stepId, context: state.context });
    event('FLOW_TRANSITION_END', { from, to: stepId });
    notify();
  }

  async function next(patch?: Partial<TContext>) {
    if (patch) state = { ...state, context: { ...state.context, ...patch } };
    const target = resolve(currentStep().next, state.context);
    if (!target) throw new Error(`Step '${state.currentStepId}' does not define next.`);
    await goTo(target);
  }

  async function back() {
    const explicit = resolve(currentStep().back, state.context);
    const target = explicit ?? state.history[state.history.length - 1];
    if (target) await goTo(target, false);
  }

  async function send<TEvent extends FlowEvent>(flowEvent: TEvent) {
    event('FLOW_EVENT', { event: flowEvent });
    patchState({ status: 'transitioning', pendingEvent: flowEvent, errors: [] });

    try {
      const transitions = currentStep().on?.[flowEvent.type] ?? [];
      const transition = transitions.find((candidate) => {
        const guardOk = candidate.when ? candidate.when(state.context, flowEvent) : true;
        const permissionOk = canAccess(candidate.permissions, state.context, options.user);
        return guardOk && permissionOk;
      });

      if (!transition) {
        patchState({ status: 'blocked', errors: [`No allowed transition for '${flowEvent.type}'.`] });
        return;
      }

      const validationErrors = await runValidators(transition.validate, state.context, flowEvent);
      if (validationErrors.length) {
        event('FLOW_VALIDATION_FAILED', { errors: validationErrors, event: flowEvent });
        patchState({ status: 'blocked', errors: validationErrors });
        return;
      }

      if (transition.set) {
        const setPatch =
          typeof transition.set === 'function'
            ? await transition.set(state.context, flowEvent)
            : transition.set;
        state = { ...state, context: { ...state.context, ...setPatch } };
      }

      const actionResult = normalizeActionResult(await transition.action?.(state.context, flowEvent));

      if (actionResult.errors?.length || actionResult.cancel) {
        patchState({ status: 'blocked', errors: actionResult.errors ?? ['Transition cancelled'] });
        return;
      }

      if (actionResult.set) {
        state = { ...state, context: { ...state.context, ...actionResult.set } };
      }

      const goToResult =
        actionResult.goTo ??
        (transition.goTo
          ? typeof transition.goTo === 'function'
            ? await transition.goTo(state.context, flowEvent)
            : transition.goTo
          : undefined);

      if (goToResult) await goTo(goToResult);
      else patchState({ status: 'idle', pendingEvent: undefined });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      event('FLOW_ERROR', { error: message });
      patchState({ status: 'error', errors: [message] });
    }
  }

  function setContext(patch: Partial<TContext>) {
    patchState({ context: { ...state.context, ...patch } });
  }

  function reset() {
    patchState({
      currentStepId: flow.initial,
      context: { ...flow.context },
      history: [],
      status: 'idle',
      errors: [],
      pendingEvent: undefined,
    });
  }

  function subscribe(listener: Listener<TContext>) {
    listeners.add(listener);
    listener(state);
    return () => listeners.delete(listener);
  }

  function getState() {
    return state;
  }

  function getFlow() {
    return flow;
  }

  event('FLOW_INIT');

  return { getState, getFlow, subscribe, send, goTo, next, back, setContext, reset };
}

export type FlowEngine<TContext extends FlowContext = FlowContext> = ReturnType<
  typeof createFlowEngine<TContext>
>;

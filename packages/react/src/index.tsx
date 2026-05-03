import React, { createContext, useContext, useMemo, useSyncExternalStore } from 'react';
import {
  createFlowEngine,
  resolveVisibleBlocks,
  resolveVisibleContent,
  type FlowContent,
  type FlowContentBlock,
  type FlowContext,
  type FlowDefinition,
  type FlowEngine,
  type FlowEngineOptions,
  type FlowEngineState,
} from '@react-flow-ui-engine/core';

export * from '@react-flow-ui-engine/core';

export type FlowReactController<TContext extends FlowContext = FlowContext> = {
  state: FlowEngineState<TContext>;
  context: TContext;
  currentStepId: string;
  currentStep: FlowDefinition<TContext>['steps'][string];
  /** Current step content after same-screen content blocks have been filtered by `visibleIf`. */
  content?: FlowContent<TContext>;
  /** Visible same-screen content blocks for the active step. */
  visibleContentBlocks: FlowContentBlock<TContext>[];
  canGoBack: boolean;
  send: FlowEngine<TContext>['send'];
  goTo: FlowEngine<TContext>['goTo'];
  next: FlowEngine<TContext>['next'];
  back: FlowEngine<TContext>['back'];
  setContext: FlowEngine<TContext>['setContext'];
  reset: FlowEngine<TContext>['reset'];
  getState: FlowEngine<TContext>['getState'];
  getFlow: FlowEngine<TContext>['getFlow'];
};

export type FlowPageProps<TContext extends FlowContext = FlowContext> = {
  flow: FlowReactController<TContext>;
  content?: FlowContent<TContext>;
};

const FlowReactContext = createContext<FlowEngine<any> | null>(null);

export function FlowProvider<TContext extends FlowContext>({
  flow,
  engine,
  options,
  children,
}: {
  flow?: FlowDefinition<TContext>;
  engine?: FlowEngine<TContext>;
  options?: FlowEngineOptions<TContext>;
  children: React.ReactNode;
}) {
  const createdEngine = useMemo(() => {
    if (engine) return engine;
    if (!flow) throw new Error('FlowProvider requires either flow or engine.');
    return createFlowEngine(flow, options);
  }, [engine, flow, options]);

  return <FlowReactContext.Provider value={createdEngine}>{children}</FlowReactContext.Provider>;
}

export function useFlow<TContext extends FlowContext = FlowContext>(): FlowReactController<TContext> {
  const engine = useContext(FlowReactContext) as FlowEngine<TContext> | null;
  if (!engine) throw new Error('useFlow must be used inside <FlowProvider>.');

  const state = useSyncExternalStore(engine.subscribe, engine.getState, engine.getState);
  const definition = engine.getFlow();
  const currentStep = definition.steps[state.currentStepId];
  const content = resolveVisibleContent(currentStep?.content, state.context);
  const visibleContentBlocks = resolveVisibleBlocks(currentStep?.content?.blocks, state.context);

  return {
    state,
    context: state.context,
    currentStepId: state.currentStepId,
    currentStep,
    content,
    visibleContentBlocks,
    canGoBack: state.history.length > 0 || Boolean(currentStep?.back),
    send: engine.send,
    goTo: engine.goTo,
    next: engine.next,
    back: engine.back,
    setContext: engine.setContext,
    reset: engine.reset,
    getState: engine.getState,
    getFlow: engine.getFlow,
  };
}



export type FlowContentBlockComponentProps<TContext extends FlowContext = FlowContext> = {
  block: FlowContentBlock<TContext>;
  flow: FlowReactController<TContext>;
};

export type FlowContentBlocksProps<TContext extends FlowContext = FlowContext> = {
  blocks?: FlowContentBlock<TContext>[];
  renderBlock?: (
    block: FlowContentBlock<TContext>,
    flow: FlowReactController<TContext>,
  ) => React.ReactNode;
};

export function FlowContentBlocks<TContext extends FlowContext = FlowContext>({
  blocks,
  renderBlock,
}: FlowContentBlocksProps<TContext>) {
  const flow = useFlow<TContext>();
  const visibleBlocks = blocks ? resolveVisibleBlocks(blocks, flow.context) : flow.visibleContentBlocks;

  return (
    <>
      {visibleBlocks.map((block, index) => {
        const key = block.id ?? `${block.type}-${index}`;

        if (block.component) {
          const Component = block.component as React.ComponentType<
            FlowContentBlockComponentProps<TContext> & Record<string, unknown>
          >;
          return <Component key={key} block={block} flow={flow} {...(block.props ?? {})} />;
        }

        if (renderBlock) {
          return <React.Fragment key={key}>{renderBlock(block, flow)}</React.Fragment>;
        }

        return null;
      })}
    </>
  );
}

export function FlowRenderer<TContext extends FlowContext = FlowContext>() {
  const flow = useFlow<TContext>();
  const step = flow.currentStep;

  if (!step) throw new Error(`Step '${flow.currentStepId}' does not exist.`);
  if (step.parallel) return <ParallelFlowsRenderer parentFlow={flow} regions={step.parallel} />;
  if (step.flow) return <NestedFlowRenderer parentFlow={flow} childFlow={step.flow} />;
  if (!step.component) throw new Error(`Step '${flow.currentStepId}' has no component.`);

  const Component = step.component as React.ComponentType<FlowPageProps<TContext>>;
  return <Component flow={flow} content={flow.content} />;
}

export function NestedFlowRenderer<TParentContext extends FlowContext>({
  parentFlow,
  childFlow,
}: {
  parentFlow: FlowReactController<TParentContext>;
  childFlow: FlowDefinition<any>;
}) {
  const childEngine = useMemo(() => {
    let created: FlowEngine<any>;
    created = createFlowEngine(childFlow, {
      onStepChange: ({ to, context }) => {
        const childState = created.getState();
        const matcher = parentFlow.currentStep.completionMatcher;
        const complete = matcher
          ? matcher({ stepId: to, childContext: context, childState })
          : to === 'complete';

        if (!complete) return;

        const patch = parentFlow.currentStep.onChildComplete?.(context, parentFlow.context);
        if (patch) parentFlow.setContext(patch);
        void parentFlow.next(patch ?? undefined);
      },
    });
    return created;
  }, [childFlow, parentFlow]);

  return (
    <FlowProvider engine={childEngine}>
      <FlowRenderer />
    </FlowProvider>
  );
}

export function ParallelFlowsRenderer<TParentContext extends FlowContext>({
  parentFlow,
  regions,
}: {
  parentFlow: FlowReactController<TParentContext>;
  regions: Record<string, any>;
}) {
  const [completed, setCompleted] = React.useState<Record<string, boolean>>({});
  const entries = Object.entries(regions);

  return (
    <div data-flow-parallel="true">
      {entries.map(([regionId, region]) => (
        <ParallelRegion
          key={regionId}
          regionId={regionId}
          region={region}
          entries={entries}
          completed={completed}
          setCompleted={setCompleted}
          parentFlow={parentFlow}
        />
      ))}
    </div>
  );
}

function ParallelRegion<TParentContext extends FlowContext>({
  regionId,
  region,
  entries,
  completed,
  setCompleted,
  parentFlow,
}: {
  regionId: string;
  region: any;
  entries: [string, any][];
  completed: Record<string, boolean>;
  setCompleted: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  parentFlow: FlowReactController<TParentContext>;
}) {
  const childEngine = useMemo(() => {
    let created: FlowEngine<any>;
    created = createFlowEngine(region.flow, {
      onStepChange: ({ to, context }) => {
        const childState = created.getState();
        const complete = region.completionMatcher
          ? region.completionMatcher({ stepId: to, childContext: context, childState })
          : to === 'complete';

        if (!complete) return;

        const patch = region.onComplete?.(context, parentFlow.context);
        if (patch) parentFlow.setContext(patch);

        setCompleted((prev) => {
          const nextCompleted = { ...prev, [regionId]: true };
          const allRequiredComplete = entries.every(
            ([id, item]) => item.required === false || nextCompleted[id],
          );
          if (allRequiredComplete) void parentFlow.next();
          return nextCompleted;
        });
      },
    });
    return created;
  }, [region, parentFlow, regionId, entries, setCompleted]);

  return (
    <section data-flow-region={regionId} data-flow-region-completed={Boolean(completed[regionId])}>
      <FlowProvider engine={childEngine}>
        <FlowRenderer />
      </FlowProvider>
    </section>
  );
}

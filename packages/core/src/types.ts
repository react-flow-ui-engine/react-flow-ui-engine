export type FlowStepId = string;
export type FlowEvent = { type: string; [key: string]: unknown };
export type FlowContext = Record<string, unknown>;
export type FlowContentPredicate<TContext extends FlowContext = FlowContext> = (ctx: TContext) => boolean;

export type FlowContentBlock<TContext extends FlowContext = FlowContext> = {
  id?: string;
  type: string;
  /**
   * Optional framework-specific component. The core package keeps this as
   * unknown so React, React Native, or another renderer can decide how to
   * render it.
   */
  component?: unknown;
  props?: Record<string, unknown>;
  content?: Record<string, unknown>;
  visibleIf?: FlowContentPredicate<TContext>;
};

export type FlowContent<TContext extends FlowContext = FlowContext> = Record<string, unknown> & {
  /**
   * Optional same-screen content blocks. FlowRenderer filters these by `visibleIf`
   * before passing content to the active step component.
   */
  blocks?: FlowContentBlock<TContext>[];
};

export type FlowUser = {
  id?: string;
  roles?: string[];
  permissions?: string[];
  [key: string]: unknown;
};

export type FlowPermissionRule<TContext extends FlowContext = FlowContext> = {
  roles?: string[];
  permissions?: string[];
  requireAllRoles?: boolean;
  requireAllPermissions?: boolean;
  when?: (ctx: TContext, user?: FlowUser) => boolean;
  fallbackStep?: FlowStepId;
};

export type FlowValidationResult =
  | boolean
  | string
  | string[]
  | { valid: boolean; errors?: string[] };

export type FlowValidator<
  TContext extends FlowContext = FlowContext,
  TEvent extends FlowEvent = FlowEvent,
> = (
  ctx: TContext,
  event?: TEvent,
) => FlowValidationResult | Promise<FlowValidationResult>;

export type FlowTransitionResult<TContext extends FlowContext = FlowContext> =
  | void
  | FlowStepId
  | Partial<TContext>
  | { goTo?: FlowStepId; set?: Partial<TContext>; errors?: string[]; cancel?: boolean };

export type FlowTransition<
  TContext extends FlowContext = FlowContext,
  TEvent extends FlowEvent = FlowEvent,
> = {
  when?: (ctx: TContext, event: TEvent) => boolean;
  permissions?: FlowPermissionRule<TContext>;
  validate?: FlowValidator<TContext, TEvent> | FlowValidator<TContext, TEvent>[];
  set?:
    | Partial<TContext>
    | ((ctx: TContext, event: TEvent) => Partial<TContext> | Promise<Partial<TContext>>);
  goTo?: FlowStepId | ((ctx: TContext, event: TEvent) => FlowStepId | Promise<FlowStepId>);
  action?: (
    ctx: TContext,
    event: TEvent,
  ) => FlowTransitionResult<TContext> | Promise<FlowTransitionResult<TContext>>;
};

export type ChildCompletionMatcher<TChildContext extends FlowContext = FlowContext> = (args: {
  stepId: FlowStepId;
  childContext: TChildContext;
  childState: FlowEngineState<TChildContext>;
}) => boolean;

export type ParallelFlowRegion<TParentContext extends FlowContext = FlowContext> = {
  flow: FlowDefinition<any>;
  required?: boolean;
  completionMatcher?: ChildCompletionMatcher<any>;
  onComplete?: (childContext: any, parentContext: TParentContext) => Partial<TParentContext>;
};

export type FlowStep<TContext extends FlowContext = FlowContext> = {
  component?: unknown;
  content?: FlowContent<TContext>;
  flow?: FlowDefinition<any>;
  parallel?: Record<string, ParallelFlowRegion<TContext>>;
  next?: FlowStepId | ((ctx: TContext) => FlowStepId);
  back?: FlowStepId | ((ctx: TContext) => FlowStepId);
  visibleIf?: (ctx: TContext) => boolean;
  permissions?: FlowPermissionRule<TContext>;
  validate?: FlowValidator<TContext> | FlowValidator<TContext>[];
  on?: Record<string, FlowTransition<TContext, any>[]>;
  beforeEnter?: (ctx: TContext) => void | Promise<void>;
  beforeLeave?: (ctx: TContext) => void | Promise<void>;
  completionMatcher?: ChildCompletionMatcher<TContext>;
  onChildComplete?: (childContext: any, parentContext: TContext) => Partial<TContext>;
};

export type FlowDefinition<TContext extends FlowContext = FlowContext> = {
  id: string;
  initial: FlowStepId;
  context: TContext;
  steps: Record<FlowStepId, FlowStep<TContext>>;
};

export type FlowEngineStatus = 'idle' | 'transitioning' | 'blocked' | 'error';

export type FlowEngineState<TContext extends FlowContext = FlowContext> = {
  flowId: string;
  currentStepId: FlowStepId;
  context: TContext;
  history: FlowStepId[];
  status: FlowEngineStatus;
  errors: string[];
  pendingEvent?: FlowEvent;
};

export type FlowEngineEvent<TContext extends FlowContext = FlowContext> = {
  type:
    | 'FLOW_INIT'
    | 'FLOW_STATE_CHANGED'
    | 'FLOW_EVENT'
    | 'FLOW_TRANSITION_END'
    | 'FLOW_VALIDATION_FAILED'
    | 'FLOW_PERMISSION_BLOCKED'
    | 'FLOW_ERROR';
  flowId: string;
  timestamp: number;
  payload: Record<string, unknown> & { state?: FlowEngineState<TContext> };
};

export type FlowEngineOptions<TContext extends FlowContext = FlowContext> = {
  user?: FlowUser;
  unauthorizedStep?: FlowStepId;
  onStepChange?: (data: {
    flowId: string;
    from: FlowStepId;
    to: FlowStepId;
    context: TContext;
  }) => void;
  onEvent?: (event: FlowEngineEvent<TContext>) => void;
};

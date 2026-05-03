import type { FlowContext, FlowDefinition } from './types';

export function defineFlow<TContext extends FlowContext>(flow: FlowDefinition<TContext>): FlowDefinition<TContext> {
  if (!flow.id) throw new Error('Flow must have an id.');
  if (!flow.initial) throw new Error('Flow must have an initial step.');
  if (!flow.steps[flow.initial]) throw new Error(`Initial step '${flow.initial}' does not exist.`);
  for (const [id, step] of Object.entries(flow.steps)) {
    if (!step.component && !step.flow && !step.parallel) {
      throw new Error(`Step '${id}' must define component, nested flow, or parallel flows.`);
    }
    for (const block of step.content?.blocks ?? []) {
      if (!block.type) throw new Error(`Content block in step '${id}' must define type.`);
    }
  }
  return flow;
}

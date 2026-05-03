import type { FlowContent, FlowContentBlock, FlowContext } from './types';

export function resolveVisibleBlocks<TContext extends FlowContext>(
  blocks: FlowContentBlock<TContext>[] | undefined,
  context: TContext,
): FlowContentBlock<TContext>[] {
  if (!blocks?.length) return [];
  return blocks.filter((block) => (block.visibleIf ? block.visibleIf(context) : true));
}

export function resolveVisibleContent<TContext extends FlowContext>(
  content: FlowContent<TContext> | undefined,
  context: TContext,
): FlowContent<TContext> | undefined {
  if (!content) return undefined;
  if (!Array.isArray(content.blocks)) return content;
  return {
    ...content,
    blocks: resolveVisibleBlocks(content.blocks, context),
  };
}

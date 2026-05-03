import type { FlowContext, FlowEvent, FlowValidationResult, FlowValidator } from './types';

export function required<T extends Record<string, unknown>>(field: keyof T, message?: string): FlowValidator<T> {
  return (ctx) => {
    const value = ctx[field];
    const valid = value !== undefined && value !== null && value !== '';
    return valid || (message ?? `${String(field)} is required`);
  };
}

export function minLength<T extends Record<string, unknown>>(field: keyof T, length: number, message?: string): FlowValidator<T> {
  return (ctx) => {
    const value = String(ctx[field] ?? '');
    return value.length >= length || (message ?? `${String(field)} must be at least ${length} characters`);
  };
}

export function matches<T extends Record<string, unknown>>(field: keyof T, pattern: RegExp, message?: string): FlowValidator<T> {
  return (ctx) => pattern.test(String(ctx[field] ?? '')) || (message ?? `${String(field)} is invalid`);
}

export async function runValidators<TContext extends FlowContext, TEvent extends FlowEvent = FlowEvent>(
  validators: FlowValidator<TContext, TEvent> | FlowValidator<TContext, TEvent>[] | undefined,
  ctx: TContext,
  event?: TEvent,
): Promise<string[]> {
  if (!validators) return [];
  const list = Array.isArray(validators) ? validators : [validators];
  const errors: string[] = [];

  for (const validator of list) {
    const result = await validator(ctx, event);
    if (result === true || result === undefined) continue;
    if (result === false) errors.push('Validation failed');
    else if (typeof result === 'string') errors.push(result);
    else if (Array.isArray(result)) errors.push(...result);
    else if (!result.valid) errors.push(...(result.errors ?? ['Validation failed']));
  }
  return errors;
}

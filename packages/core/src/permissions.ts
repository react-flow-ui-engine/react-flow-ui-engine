import type { FlowContext, FlowPermissionRule, FlowUser } from './types';

const any = (required: string[] = [], owned: string[] = []) => required.some((x) => owned.includes(x));
const all = (required: string[] = [], owned: string[] = []) => required.every((x) => owned.includes(x));

export function canAccess<TContext extends FlowContext>(rule: FlowPermissionRule<TContext> | undefined, ctx: TContext, user?: FlowUser) {
  if (!rule) return true;
  const roles = user?.roles ?? [];
  const permissions = user?.permissions ?? [];
  if (rule.roles?.length) {
    const ok = rule.requireAllRoles ? all(rule.roles, roles) : any(rule.roles, roles);
    if (!ok) return false;
  }
  if (rule.permissions?.length) {
    const ok = rule.requireAllPermissions ? all(rule.permissions, permissions) : any(rule.permissions, permissions);
    if (!ok) return false;
  }
  return rule.when ? rule.when(ctx, user) : true;
}

export type SidebarCreateAction = 'create-candidate' | 'create-employee';

export function getSidebarCreateAction(state: unknown): SidebarCreateAction | null {
  if (state === null || typeof state !== 'object' || !('sidebarCreateAction' in state)) {
    return null;
  }

  const action = state.sidebarCreateAction;
  return action === 'create-candidate' || action === 'create-employee' ? action : null;
}

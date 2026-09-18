import { useEffect, useMemo, type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineWorkspace, useOnlineStatus } from './hooks';
import type { OfflineAccount } from './model';

/** Keeps pending captures moving while the authenticated app remains open. */
export function DataUpdateSyncAgent({ children }: { children: ReactNode }) {
  const { profile, user } = useAuth();
  const online = useOnlineStatus();
  const account = useMemo<OfflineAccount | null>(() => profile && user
    && (profile.role === 'admin' || profile.role === 'reclutador')
    ? { id: user.id, role: profile.role, username: profile.username }
    : null, [profile, user]);
  const offline = useOfflineWorkspace(account?.id ?? '', online, false);
  useEffect(() => {
    if (account && online) void offline.sync(true);
  }, [account, online, offline.sync]);
  return <>{children}</>;
}

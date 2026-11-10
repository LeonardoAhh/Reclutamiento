import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { countLeaveNotifications, LEAVE_REQUESTS_CHANGED_EVENT } from './requests';

const SEEN_KEY_PREFIX = 'leave-notifications-seen:';
const seenInMemory = new Map<string, string>();

function seenKey(profileId: string) {
  return `${SEEN_KEY_PREFIX}${profileId}`;
}

function readSeenAt(profileId: string) {
  const memoryValue = seenInMemory.get(profileId);
  try {
    const storedValue = window.localStorage.getItem(seenKey(profileId)) ?? undefined;
    return storedValue && (!memoryValue || storedValue > memoryValue) ? storedValue : memoryValue;
  } catch {
    return memoryValue;
  }
}

export function useLeaveNotificationCount() {
  const { profile, profileLoading } = useAuth();
  const [result, setResult] = useState<{ profileId: string; role: string; count: number | null } | null>(null);
  const [revision, setRevision] = useState(0);
  const pendingRequest = useRef<AbortController | null>(null);
  const profileId = profile?.id;
  const role = profile?.role;

  useEffect(() => {
    if (profileLoading || !profileId || !role) return;
    const controller = new AbortController();
    pendingRequest.current = controller;
    void countLeaveNotifications(
      { id: profileId, role },
      role === 'admin' ? undefined : readSeenAt(profileId),
      controller.signal,
    ).then(
      (nextCount) => {
        if (!controller.signal.aborted) setResult({ profileId, role, count: nextCount });
      },
      () => {
        if (!controller.signal.aborted) setResult({ profileId, role, count: null });
      },
    );
    return () => {
      controller.abort();
      if (pendingRequest.current === controller) pendingRequest.current = null;
    };
  }, [profileId, profileLoading, revision, role]);

  useEffect(() => {
    if (!profileId) return;
    const refresh = () => setRevision((value) => value + 1);
    const onStorage = (event: StorageEvent) => {
      if (event.key === seenKey(profileId)) refresh();
    };
    window.addEventListener(LEAVE_REQUESTS_CHANGED_EVENT, refresh);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(LEAVE_REQUESTS_CHANGED_EVENT, refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, [profileId]);

  const markDecisionsViewed = useCallback(
    (latestReviewedAt?: string) => {
      if (!profileId || !role || role === 'admin') return;
      const viewedAt = latestReviewedAt ?? new Date().toISOString();
      const previous = readSeenAt(profileId);
      if (!previous || viewedAt > previous) {
        seenInMemory.set(profileId, viewedAt);
        try {
          window.localStorage.setItem(seenKey(profileId), viewedAt);
        } catch {
          // El contador se reinicia en esta sesión aunque el navegador bloquee el almacenamiento.
        }
      }
      pendingRequest.current?.abort();
      setResult({ profileId, role, count: 0 });
    },
    [profileId, role],
  );

  const count =
    !profileLoading && result && result.profileId === profileId && result.role === role ? result.count : null;
  return { count, markDecisionsViewed };
}

export interface PresenceUser {
  user_id: string;
  username: string;
  role: string;
  online_at: string;
}

export const APP_PRESENCE_EVENT = 'app_presence_update';

let onlineUserIds = new Set<string>();

type PresenceSubscriber = (userIds: Set<string>) => void;

function isPresenceUser(value: unknown): value is PresenceUser {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.user_id === 'string' && candidate.user_id.length > 0;
}

export function extractOnlineUserIds(state: unknown) {
  const ids = new Set<string>();
  if (!state || typeof state !== 'object') return ids;

  for (const presences of Object.values(state as Record<string, unknown>)) {
    if (!Array.isArray(presences)) continue;
    for (const presence of presences) {
      if (isPresenceUser(presence)) ids.add(presence.user_id);
    }
  }

  return ids;
}

export function publishOnlineUserIds(userIds: Set<string>) {
  onlineUserIds = new Set(userIds);
  window.dispatchEvent(new CustomEvent(APP_PRESENCE_EVENT, {
    detail: new Set(onlineUserIds),
  }));
}

export function getOnlineUserIds() {
  return new Set(onlineUserIds);
}

export function subscribeOnlineUserIds(subscriber: PresenceSubscriber) {
  subscriber(getOnlineUserIds());

  const handlePresence = (event: Event) => {
    const detail = (event as CustomEvent<unknown>).detail;
    if (!(detail instanceof Set)) return;
    subscriber(new Set(Array.from(detail).filter((id): id is string => typeof id === 'string')));
  };

  window.addEventListener(APP_PRESENCE_EVENT, handlePresence);
  return () => window.removeEventListener(APP_PRESENCE_EVENT, handlePresence);
}

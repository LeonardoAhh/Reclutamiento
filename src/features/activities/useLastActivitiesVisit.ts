import { useCallback, useEffect, useState } from 'react';
import type { Activity } from '@/lib/types';

const LAST_ACTIVITIES_VISIT_KEY = 'last_activities_visit';

export function useLastActivitiesVisit() {
  const [lastVisit] = useState<string | null>(() => localStorage.getItem(LAST_ACTIVITIES_VISIT_KEY));

  useEffect(() => {
    localStorage.setItem(LAST_ACTIVITIES_VISIT_KEY, new Date().toISOString());
  }, []);

  return useCallback(
    (activity: Activity) => {
      if (!lastVisit || !activity.created_at) return false;
      return new Date(activity.created_at) > new Date(lastVisit);
    },
    [lastVisit],
  );
}

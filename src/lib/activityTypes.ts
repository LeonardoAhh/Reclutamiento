import type { Activity, ActivityStatus } from '@/lib/types';

export type ActivityStatusFilter = ActivityStatus | 'todas';

export interface ActivityWithAssignee extends Activity {
  asignado_a_profile?: {
    display_name?: string | null;
    username?: string | null;
  } | null;
}

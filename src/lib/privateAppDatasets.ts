import { supabase } from './supabase';

export type PrivateDatasetId =
  'routes_current' | 'routes_previous' | 'routes_info' | 'salary_union' | 'salary_non_union';

export async function loadPrivateAppDatasets(
  ids: readonly PrivateDatasetId[],
  signal: AbortSignal,
): Promise<Map<PrivateDatasetId, unknown>> {
  const { data, error } = await supabase
    .from('private_app_datasets')
    .select('id,payload')
    .in('id', [...ids])
    .abortSignal(signal);

  if (error) throw error;
  const datasets = new Map<PrivateDatasetId, unknown>();
  for (const row of data ?? []) {
    if (ids.includes(row.id as PrivateDatasetId)) {
      datasets.set(row.id as PrivateDatasetId, row.payload);
    }
  }
  return datasets;
}

import type { DataUpdateCampaign, DataUpdateCampaignDetail, DataUpdateEditableData, DataUpdateIdentity, DataUpdateIncident, DataUpdateRecord, IdentityReviewStatus } from '../types';

export interface OfflineAccount {
  id: string;
  role: 'admin' | 'reclutador';
  username: string;
}

export type Command =
  | { kind: 'save'; data: DataUpdateEditableData; step: number }
  | { kind: 'review'; status: 'confirmado' | 'incidencia'; incidents: Array<{ fieldName: string; note: string }> }
  | { kind: 'photo'; path: string; previousPath: string | null; step: number }
  | { kind: 'complete' }
  | { kind: 'locker'; area: DataUpdateRecord['lockerArea']; locker: string };

export interface PendingOperation {
  id: string;
  recordId: string;
  command: Command;
  expectedVersion?: number;
  error?: string;
}

export interface LocalForm {
  data: DataUpdateEditableData;
  step: number;
  review: IdentityReviewStatus;
  incidentFields: Array<keyof DataUpdateIdentity>;
  incidentNote: string;
  childrenCountConfirmed: boolean;
}

export interface OfflineWorkspace {
  schema: 1;
  owner: string;
  campaigns: DataUpdateCampaign[];
  details: Record<string, DataUpdateCampaignDetail>;
  incidents: Record<string, DataUpdateIncident[]>;
  queue: PendingOperation[];
  forms: Record<string, LocalForm>;
}

export function emptyWorkspace(owner: string): OfflineWorkspace {
  return { schema: 1, owner, campaigns: [], details: {}, incidents: {}, queue: [], forms: {} };
}

export function findRecord(workspace: OfflineWorkspace, id: string): DataUpdateRecord {
  const record = Object.values(workspace.details).flatMap(detail => detail.records).find(row => row.id === id);
  if (!record) throw new Error('Prepara esta campaña con conexión antes de capturar.');
  return record;
}

export function projectRecord(workspace: OfflineWorkspace, id: string): DataUpdateRecord {
  let record = structuredClone(findRecord(workspace, id));
  for (const operation of workspace.queue.filter(item => item.recordId === id)) {
    const command = operation.command;
    if (command.kind === 'save') record = { ...record, data: command.data, currentStep: command.step, status: 'en_proceso' };
    if (command.kind === 'review') record.identityReview = command.status;
    if (command.kind === 'photo') record.photoPath = command.path;
    if (command.kind === 'locker') record = { ...record, lockerArea: command.area, data: { ...record.data, locker: command.locker } };
    // A local completion request is not a server-confirmed completion.
    if (command.kind === 'complete' && record.status !== 'completado') record.status = 'en_proceso';
  }
  return record;
}

export function acceptOperation(workspace: OfflineWorkspace, operationId: string, saved: DataUpdateRecord) {
  const operation = workspace.queue.find(item => item.id === operationId);
  if (!operation) return;
  const detail = workspace.details[saved.campaignId];
  if (!detail) throw new Error('La campaña local ya no está disponible.');
  detail.records = detail.records.map(row => row.id === saved.id
    ? { ...saved, assignedName: row.assignedName, campaignName: row.campaignName } : row);
  if (operation.command.kind === 'review') {
    workspace.incidents[saved.id] = operation.command.incidents.map((item, index) => ({
      ...item, id: `${operation.id}:${index}`, recordId: saved.id,
      fieldName: item.fieldName as DataUpdateIncident['fieldName'],
      reportedBy: workspace.owner, createdAt: saved.updatedAt,
    }));
  }
  workspace.queue = workspace.queue.filter(item => item.id !== operationId);
  if (operation.command.kind === 'complete') delete workspace.forms[saved.id];
}

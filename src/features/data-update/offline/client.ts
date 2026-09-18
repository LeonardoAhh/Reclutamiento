import * as api from '../api';
import { getDataUpdatePhotoExtension, validateDataUpdatePhoto } from '../validation';
import type { DataUpdateRecord } from '../types';
import { findRecord, projectRecord, type Command, type LocalForm, type OfflineAccount } from './model';
import { changeWorkspace, deleteOfflinePhoto, readWorkspace, readOfflinePhoto, saveOfflinePhoto, setOfflineAccount } from './storage';

const photoPreparations = new Map<string, Promise<void>>();

function prepareOfflinePhotos(owner: string, campaignId: string, records: DataUpdateRecord[]) {
  const key = `${owner}:${campaignId}`;
  if (photoPreparations.has(key)) return;
  const preparation = (async () => {
    try { await navigator.storage?.persist?.(); } catch { /* Storage persistence is best effort. */ }
    for (const record of records) {
      if (!record.photoPath || await readOfflinePhoto(owner, record.photoPath)) continue;
      try {
        await saveOfflinePhoto(owner, record.photoPath, await api.downloadDataUpdatePhoto(record.photoPath));
      } catch { /* A photo can be fetched on demand without blocking the campaign. */ }
    }
  })().finally(() => photoPreparations.delete(key));
  photoPreparations.set(key, preparation);
}

export function createOfflineClient(account: OfflineAccount) {
  const owner = account.id;

  async function enqueue(recordId: string, command: Command) {
    return changeWorkspace(owner, workspace => {
      const record = projectRecord(workspace, recordId);
      if (command.kind !== 'locker' && account.role !== 'admin' && record.assignedTo !== owner) {
        throw new Error('No tienes permiso para realizar esta acción.');
      }
      if (command.kind !== 'locker' && record.status === 'completado') throw new Error('Este registro ya está completado.');
      if (workspace.queue.some(item => item.recordId === recordId && item.command.kind === 'complete')) {
        throw new Error('Este registro está pendiente de sincronizar su finalización.');
      }
      const last = workspace.queue[workspace.queue.length - 1];
      // Coalesce only unattempted adjacent snapshots, never an uncertain network request.
      if (last?.recordId === recordId && last.command.kind === command.kind && last.expectedVersion === undefined
        && (command.kind === 'save' || command.kind === 'review')) {
        last.command = command;
      } else workspace.queue.push({ id: crypto.randomUUID(), recordId, command });
      return projectRecord(workspace, recordId);
    });
  }

  return {
    owner,
    async campaigns(online: boolean) {
      if (!online) return (await readWorkspace(owner)).campaigns;
      const campaigns = await api.listDataUpdateCampaigns();
      await changeWorkspace(owner, workspace => { workspace.campaigns = campaigns; });
      return campaigns;
    },
    async detail(campaignId: string, online: boolean) {
      if (online) {
        const detail = await api.getDataUpdateCampaignDetail(campaignId);
        const incidents = await api.listCampaignDataUpdateIncidents(detail.records.map(record => record.id));
        await changeWorkspace(owner, workspace => {
          const previous = workspace.details[campaignId];
          const pendingIds = new Set(workspace.queue.map(item => item.recordId));
          // Keep the version against which offline work was created, including deleted rows.
          const records = detail.records.map(record => pendingIds.has(record.id)
            ? previous?.records.find(row => row.id === record.id) ?? record : record);
          for (const record of previous?.records ?? []) {
            if (pendingIds.has(record.id) && !records.some(row => row.id === record.id)) records.push(record);
          }
          workspace.details[campaignId] = { ...detail, records };
          for (const record of detail.records) {
            if (!pendingIds.has(record.id)) workspace.incidents[record.id] = incidents.filter(row => row.recordId === record.id);
          }
        });
        await setOfflineAccount(account);
        prepareOfflinePhotos(owner, campaignId, detail.records);
      }
      const workspace = await readWorkspace(owner);
      const detail = workspace.details[campaignId];
      if (!detail) throw new Error('Abre esta campaña con conexión para prepararla en este dispositivo.');
      return { ...detail, records: detail.records.map(record => projectRecord(workspace, record.id)) };
    },
    async incidents(recordId: string) {
      const workspace = await readWorkspace(owner);
      const reviews = workspace.queue.filter(item => item.recordId === recordId && item.command.kind === 'review');
      const pending = reviews[reviews.length - 1];
      if (pending?.command.kind !== 'review') return workspace.incidents[recordId] ?? [];
      return pending.command.incidents.map((item, index) => ({
        ...item, id: `${pending.id}:${index}`, recordId,
        fieldName: item.fieldName as keyof DataUpdateRecord['identity'],
        reportedBy: owner, createdAt: '',
      }));
    },
    async form(recordId: string) { return (await readWorkspace(owner)).forms[recordId]; },
    async saveForm(recordId: string, form: LocalForm) {
      await changeWorkspace(owner, workspace => {
        findRecord(workspace, recordId);
        workspace.forms[recordId] = form;
      });
    },
    save: (input: Parameters<typeof api.saveDataUpdateRecord>[0]) => enqueue(input.recordId, { kind: 'save', data: input.data, step: input.step }),
    review: (input: Parameters<typeof api.reviewDataUpdateIdentity>[0]) => enqueue(input.recordId, { kind: 'review', status: input.status, incidents: input.incidents }),
    complete: (recordId: string) => enqueue(recordId, { kind: 'complete' }),
    locker: (recordId: string, area: DataUpdateRecord['lockerArea'], locker: string) => enqueue(recordId, { kind: 'locker', area, locker }),
    async photo(record: DataUpdateRecord, file: File, step: number) {
      const error = validateDataUpdatePhoto(file);
      if (error) throw new Error(error);
      const path = `${record.campaignId}/${record.id}/${crypto.randomUUID()}.${getDataUpdatePhotoExtension(file)}`;
      await saveOfflinePhoto(owner, path, file);
      await enqueue(record.id, { kind: 'photo', path, previousPath: record.photoPath, step });
      return path;
    },
    async photoBlob(path: string, online: boolean) {
      const local = await readOfflinePhoto(owner, path);
      if (local) return local;
      if (!online) throw new Error('La fotografía no está descargada en este dispositivo.');
      const blob = await api.downloadDataUpdatePhoto(path);
      await saveOfflinePhoto(owner, path, blob);
      return blob;
    },
    async discard(recordId: string) {
      const paths = await changeWorkspace(owner, workspace => {
        const discarded = workspace.queue.filter(item => item.recordId === recordId);
        workspace.queue = workspace.queue.filter(item => item.recordId !== recordId);
        delete workspace.forms[recordId];
        return discarded.flatMap(item => item.command.kind === 'photo' ? [item.command.path] : []);
      });
      // A lost acknowledgement may mean the server already references this path.
      // Discarding local work must therefore never delete the remote object.
      await Promise.all(paths.map(path => deleteOfflinePhoto(owner, path).catch(() => undefined)));
    },
  };
}

export type OfflineClient = ReturnType<typeof createOfflineClient>;

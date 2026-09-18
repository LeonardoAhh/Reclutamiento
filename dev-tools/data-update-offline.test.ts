import assert from 'node:assert/strict';
import { test } from 'node:test';
import { acceptOperation, emptyWorkspace, projectRecord } from '../src/features/data-update/offline/model';
import type { DataUpdateCampaignDetail, DataUpdateRecord } from '../src/features/data-update/types';

function record(): DataUpdateRecord {
  return {
    id: 'record-1', campaignId: 'campaign-1', identity: {
      employeeNumber: '1', name: 'Persona', area: 'Calidad', section: '', position: '', shift: '1',
      hireDate: '', birthDate: '', curp: '', rfc: '', socialSecurityNumber: '',
    },
    originalData: {}, data: {
      route: '', stop: '', location: '', birthState: '', civilStatus: '', email: '',
      receivesPayrollReceipts: '', mobilePhone: '', emergencyContact: '', emergencyRelationship: '',
      emergencyPhone: '', street: '', fullAddress: '', municipality: '', educationLevel: '',
      bloodType: '', allergies: '', locker: '', shirtSize: '', shoeSize: '', childrenBirthDates: [],
    },
    lockerArea: '', assignedTo: 'user-1', status: 'pendiente', identityReview: 'pendiente',
    currentStep: 0, photoPath: null, version: 3, startedAt: null, completedAt: null, updatedAt: '',
  };
}

function detail(row: DataUpdateRecord): DataUpdateCampaignDetail {
  return {
    campaign: { id: 'campaign-1', name: 'Campaña', year: 2026, status: 'activa', createdBy: 'user-1', createdAt: '' },
    records: [row], participantIds: ['user-1'], transportOptions: [], civilStatuses: [],
  };
}

test('offline projection preserves server confirmation semantics and queue order', () => {
  const workspace = emptyWorkspace('user-1');
  workspace.details['campaign-1'] = detail(record());
  const data = { ...record().data, email: 'persona@example.com' };
  workspace.queue.push(
    { id: 'save', recordId: 'record-1', command: { kind: 'save', data, step: 2 } },
    { id: 'review', recordId: 'record-1', command: { kind: 'review', status: 'confirmado', incidents: [] } },
    { id: 'photo', recordId: 'record-1', command: { kind: 'photo', path: 'campaign-1/record-1/photo.jpg', previousPath: null, step: 6 } },
    { id: 'complete', recordId: 'record-1', command: { kind: 'complete' } },
  );

  const projected = projectRecord(workspace, 'record-1');
  assert.equal(projected.data.email, 'persona@example.com');
  assert.equal(projected.currentStep, 2);
  assert.equal(projected.identityReview, 'confirmado');
  assert.equal(projected.photoPath, 'campaign-1/record-1/photo.jpg');
  assert.equal(projected.status, 'en_proceso', 'local completion cannot impersonate server confirmation');

  const saved = { ...projected, version: 4, updatedAt: '2026-09-18T00:00:00Z' };
  acceptOperation(workspace, 'save', saved);
  assert.equal(workspace.queue[0]?.id, 'review');
  assert.equal(workspace.details['campaign-1'].records[0].version, 4);
});

test('accepted completion removes the local form only after server response', () => {
  const workspace = emptyWorkspace('user-1');
  const row = record();
  workspace.details['campaign-1'] = detail(row);
  workspace.forms[row.id] = {
    data: row.data, step: 7, review: 'confirmado', incidentFields: [], incidentNote: '', childrenCountConfirmed: true,
  };
  workspace.queue.push({ id: 'complete', recordId: row.id, command: { kind: 'complete' } });
  assert.ok(workspace.forms[row.id]);
  acceptOperation(workspace, 'complete', { ...row, status: 'completado', version: 4 });
  assert.equal(workspace.forms[row.id], undefined);
});

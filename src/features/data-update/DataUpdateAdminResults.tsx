import { useState } from 'react';
import { PencilLine, RotateCcw, Trash2 } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { DataUpdateRecordActions } from './DataUpdateRecordActions';
import { DataUpdateStatus } from './DataUpdateStatus';
import { useDataUpdateText } from './translations';
import type { DataUpdateProfileOption, DataUpdateRecord } from './types';

interface DataUpdateAdminResultsProps {
  records: DataUpdateRecord[];
  profiles: DataUpdateProfileOption[];
  busy: boolean;
  onOpenRecord: (record: DataUpdateRecord) => void;
  onReopen: (recordId: string) => void;
  onRequestDelete: (record: DataUpdateRecord) => void;
  onReassign: (recordId: string, profileId: string) => void;
}

interface DataUpdateAdminActionItemsProps {
  record: DataUpdateRecord;
  onOpenRecord: (record: DataUpdateRecord) => void;
  onReopen: (recordId: string) => void;
  onRequestDelete: (record: DataUpdateRecord) => void;
}

function DataUpdateAdminActionItems({
  record,
  onOpenRecord,
  onReopen,
  onRequestDelete,
}: DataUpdateAdminActionItemsProps) {
  const t = useDataUpdateText();

  return (
    <>
      {record.status === 'completado' ? (
        <button
          data-cuelume-tap=""
          type="button"
          className="data-update-admin-card__action"
          onClick={() => onReopen(record.id)}
        >
          <RotateCcw aria-hidden="true" />
          <span>{t('Reabrir')}</span>
        </button>
      ) : (
        <button
          data-cuelume-tap=""
          type="button"
          className="data-update-admin-card__action"
          onClick={() => onOpenRecord(record)}
        >
          <PencilLine aria-hidden="true" />
          <span>{t('Actualizar')}</span>
        </button>
      )}
      <hr className="data-update-admin-card__separator" />
      <button
        data-cuelume-tap=""
        type="button"
        className="data-update-admin-card__action data-update-admin-card__action--danger"
        onClick={() => onRequestDelete(record)}
        aria-label={`${t('Eliminar')} a ${record.identity.name} ${t('de la campaña')}`}
      >
        <Trash2 aria-hidden="true" />
        <span>{t('Eliminar')}</span>
      </button>
    </>
  );
}

export function DataUpdateAdminResults({
  records,
  profiles,
  busy,
  onOpenRecord,
  onReopen,
  onRequestDelete,
  onReassign,
}: DataUpdateAdminResultsProps) {
  const t = useDataUpdateText();
  const [openActionsRecordId, setOpenActionsRecordId] = useState<string | null>(null);
  const profileOptionsFor = (record: DataUpdateRecord) =>
    profiles
      .filter((profile) => profile.active || profile.id === record.assignedTo)
      .map((profile) => ({
        value: profile.id,
        label: `${profile.label}${profile.active ? '' : ` (${t('inactivo')})`}`,
      }));

  return (
    <>
      <div className="data-update-record-grid data-update-cards">
        {records.map((record) => (
          <article key={record.id} className="card data-update-record-card data-update-admin-card">
            <div className="data-update-admin-card__header">
              <div className="data-update-admin-card__identity">
                <div className="data-update-admin-card__meta">
                  <span className="type-body-md text-muted">
                    <span className="sr-only">{t('Número de empleado: ')}</span>
                    {record.identity.employeeNumber}
                  </span>
                  {record.identity.area && (
                    <span className="data-update-admin-card__meta-item type-body-md text-muted">
                      <span aria-hidden="true">●</span>
                      <span>
                        <span className="sr-only">{t('Área: ')}</span>
                        {record.identity.area}
                      </span>
                    </span>
                  )}
                  {record.identity.shift && (
                    <span className="data-update-admin-card__meta-item type-body-md text-muted">
                      <span aria-hidden="true">●</span>
                      <span>
                        <span className="sr-only">{t('Turno: ')}</span>
                        {record.identity.shift}
                      </span>
                    </span>
                  )}
                </div>
                <div className="data-update-admin-card__name-row">
                  <h3 title={record.identity.name}>{record.identity.name}</h3>
                  <DataUpdateStatus status={record.status} />
                </div>
              </div>
              <DataUpdateRecordActions
                aria-label={`${t('Acciones de')} ${record.identity.name}`}
                disabled={busy}
                open={openActionsRecordId === record.id}
                onOpenChange={(open) => setOpenActionsRecordId(open ? record.id : null)}
              >
                <DataUpdateAdminActionItems
                  record={record}
                  onOpenRecord={onOpenRecord}
                  onReopen={onReopen}
                  onRequestDelete={onRequestDelete}
                />
              </DataUpdateRecordActions>
            </div>
            <div className="form-group">
              <label htmlFor={`assigned-${record.id}-mobile`}>{t('Responsable')}</label>
              <CustomSelect
                id={`assigned-${record.id}-mobile`}
                value={record.assignedTo}
                options={profileOptionsFor(record)}
                onChange={(profileId) => onReassign(record.id, profileId)}
                showPlaceholderOption={false}
                disabled={busy}
              />
            </div>
          </article>
        ))}
      </div>
      <div className="data-update-table-wrap">
        <table className="data-table data-update-desktop-table data-update-admin-table">
          <caption className="sr-only">{t('Administración')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('Número')}</th>
              <th scope="col">{t('Colaborador')}</th>
              <th scope="col">{t('Turno')}</th>
              <th scope="col">{t('Estado del registro', 'Status')}</th>
              <th scope="col">{t('Responsable')}</th>
              <th scope="col">{t('Acciones')}</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>{record.identity.employeeNumber}</td>
                <th scope="row">
                  <span className="data-update-admin-table__name">{record.identity.name}</span>
                </th>
                <td>{record.identity.shift || '—'}</td>
                <td>
                  <DataUpdateStatus status={record.status} showLabel />
                </td>
                <td>
                  <CustomSelect
                    id={`assigned-${record.id}-table`}
                    aria-label={`${t('Responsable de')} ${record.identity.name}`}
                    value={record.assignedTo}
                    options={profileOptionsFor(record)}
                    onChange={(profileId) => onReassign(record.id, profileId)}
                    showPlaceholderOption={false}
                    disabled={busy}
                  />
                </td>
                <td>
                  <DataUpdateRecordActions aria-label={`${t('Acciones de')} ${record.identity.name}`} disabled={busy}>
                    <DataUpdateAdminActionItems
                      record={record}
                      onOpenRecord={onOpenRecord}
                      onReopen={onReopen}
                      onRequestDelete={onRequestDelete}
                    />
                  </DataUpdateRecordActions>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

import { PencilLine } from 'lucide-react';
import { DataUpdateRecordActions } from './DataUpdateRecordActions';
import { useDataUpdateText } from './translations';
import type { DataUpdateRecord } from './types';

interface DataUpdateLockerResultsProps {
  records: DataUpdateRecord[];
  canEdit: boolean;
  onEdit: (record: DataUpdateRecord) => void;
}

export function DataUpdateLockerResults({ records, canEdit, onEdit }: DataUpdateLockerResultsProps) {
  const t = useDataUpdateText();

  return (
    <>
      <div className="data-update-record-grid data-update-cards">
        {records.map((record) => (
          <article key={record.id} className="card data-update-record-card data-update-locker-card">
            <div className="data-update-admin-card__header">
              <div className="data-update-admin-card__identity">
                <span className="type-body-md text-muted">{record.identity.employeeNumber}</span>
                <h3>{record.identity.name}</h3>
              </div>
              {canEdit && (
                <DataUpdateRecordActions aria-label={`${t('Acciones de')} ${record.identity.name}`}>
                  <button
                    data-cuelume-tap=""
                    type="button"
                    className="data-update-admin-card__action"
                    onClick={() => onEdit(record)}
                  >
                    <PencilLine aria-hidden="true" />
                    <span>{t('Editar')}</span>
                  </button>
                </DataUpdateRecordActions>
              )}
            </div>
            <dl className="data-update-locker-card__details">
              <div>
                <dt>{t('Turno')}</dt>
                <dd>{record.identity.shift || '—'}</dd>
              </div>
              <div>
                <dt>{t('Área de locker')}</dt>
                <dd>{record.lockerArea ? t(record.lockerArea) : t('Sin asignar')}</dd>
              </div>
              <div>
                <dt>{t('Locker')}</dt>
                <dd>{record.data.locker.trim() || t('Sin asignar')}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
      <div className="data-update-table-wrap">
        <table className="data-table data-update-desktop-table data-update-locker-table">
          <caption className="sr-only">{t('Locker')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('Número')}</th>
              <th scope="col">{t('Colaborador')}</th>
              <th scope="col">{t('Turno')}</th>
              <th scope="col">{t('Área de locker')}</th>
              <th scope="col">{t('Locker')}</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>{record.identity.employeeNumber}</td>
                <th scope="row">{record.identity.name}</th>
                <td>{record.identity.shift || '—'}</td>
                <td>
                  {canEdit ? (
                    <button
                      data-cuelume-tap=""
                      type="button"
                      className="data-update-locker-table__department-trigger"
                      aria-label={`${t('Editar locker de', 'Edit locker for')} ${record.identity.name}`}
                      onClick={() => onEdit(record)}
                    >
                      <span>{record.lockerArea ? t(record.lockerArea) : t('Sin asignar')}</span>
                      <PencilLine aria-hidden="true" />
                    </button>
                  ) : (
                    record.lockerArea ? t(record.lockerArea) : t('Sin asignar')
                  )}
                </td>
                <td>{record.data.locker.trim() || t('Sin asignar')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

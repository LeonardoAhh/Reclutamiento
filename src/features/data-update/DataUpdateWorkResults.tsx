import { DataUpdateStatus } from './DataUpdateStatus';
import { useDataUpdateText } from './translations';
import type { DataUpdateRecord } from './types';

export interface DataUpdateWorkGroup {
  key: string;
  area: string;
  isCompleted: boolean;
  records: DataUpdateRecord[];
}

interface DataUpdateWorkResultsProps {
  groups: DataUpdateWorkGroup[];
  online: boolean;
  busy: boolean;
  onOpenRecord: (record: DataUpdateRecord) => void;
}

export function DataUpdateWorkResults({ groups, online, busy, onOpenRecord }: DataUpdateWorkResultsProps) {
  const t = useDataUpdateText();

  return (
    <>
      <div className="data-update-record-grid data-update-cards">
        {groups.flatMap((group) =>
          group.records.map((record, index) => {
            const groupLabelId = `data-update-work-group-${encodeURIComponent(group.key)}-label`;
            return (
              <article
                key={record.id}
                className="card data-update-record-card"
                aria-describedby={index === 0 ? groupLabelId : undefined}
              >
                {index === 0 && (
                  <span id={groupLabelId} className="sr-only">
                    {group.isCompleted ? t('Completados') : t('Área')}:{' '}
                    {group.area === 'Sin área' ? t('Sin área') : group.area}
                  </span>
                )}
                <div>
                  <div className="data-update-work-card__name-row">
                    <span className="data-update-work-card__identity type-body-md text-muted">
                      <span>{record.identity.employeeNumber}</span>
                      {record.identity.shift && (
                        <span>
                          {t('Turno: ')}
                          {record.identity.shift}
                        </span>
                      )}
                    </span>
                    <DataUpdateStatus status={record.status} />
                  </div>
                  <h3>{record.identity.name}</h3>
                </div>
                <button
                  type="button"
                  className={`data-update-work-card__action${record.status === 'completado' ? ' btn-secondary' : ' btn-primary'}`}
                  data-cuelume-open=""
                  onClick={() => onOpenRecord(record)}
                  disabled={!online || busy || record.status === 'completado'}
                >
                  {t(
                    record.status === 'pendiente'
                      ? 'Comenzar'
                      : record.status === 'en_proceso'
                        ? 'Continuar'
                        : 'Completado',
                  )}
                </button>
              </article>
            );
          }),
        )}
      </div>
      <div className="data-update-table-wrap">
        <table className="data-table data-update-desktop-table data-update-work-table">
          <caption className="sr-only">{t('Mi trabajo')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('Número')}</th>
              <th scope="col">{t('Colaborador')}</th>
              <th scope="col">{t('Turno')}</th>
              <th scope="col">{t('Estado del registro', 'Status')}</th>
            </tr>
          </thead>
          {groups
            .filter((group) => group.records.length > 0)
            .map((group) => (
              <tbody
                key={group.key}
                aria-label={`${group.isCompleted ? t('Completados') : t('Área')}: ${group.area === 'Sin área' ? t('Sin área') : group.area}`}
              >
                {group.records.map((record) => (
                  <tr key={record.id}>
                    <td>{record.identity.employeeNumber}</td>
                    <th scope="row">{record.identity.name}</th>
                    <td>{record.identity.shift || '—'}</td>
                    <td>
                      <DataUpdateStatus status={record.status} showLabel />
                    </td>
                  </tr>
                ))}
              </tbody>
            ))}
        </table>
      </div>
    </>
  );
}

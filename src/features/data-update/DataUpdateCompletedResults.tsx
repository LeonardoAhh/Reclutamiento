import { Download, MessageCircle } from 'lucide-react';
import { splitCandidateName } from '@/lib/names';
import { DataUpdateRecordActions } from './DataUpdateRecordActions';
import { useDataUpdateText } from './translations';
import { DATA_UPDATE_PHONE_COUNTRY_CODE } from './constants';
import type { DataUpdateRecord } from './types';

function downloadContact(record: DataUpdateRecord, phone: string) {
  const fullName = record.identity.name.trim();
  const nameParts = fullName.split(/\s+/);
  // El separador compartido agrupa partículas iniciales; este apellido compuesto lleva la partícula en medio.
  const compoundSurnameIndex = nameParts.findIndex(
    (part, index) =>
      index < 2 &&
      part.toUpperCase() === 'MONTES' &&
      nameParts[index + 1]?.toUpperCase() === 'DE' &&
      nameParts[index + 2]?.toUpperCase() === 'OCA',
  );
  const givenNames = compoundSurnameIndex >= 0 ? nameParts.slice(4).join(' ') : splitCandidateName(fullName).nombres;
  const name = [record.identity.employeeNumber.trim(), givenNames || fullName]
    .filter(Boolean)
    .join(' ')
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
  const contact = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:;${name};;;`,
    `FN:${name}`,
    `TEL;TYPE=CELL:+${DATA_UPDATE_PHONE_COUNTRY_CODE}${phone}`,
    'END:VCARD',
    '',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([contact], { type: 'text/vcard;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `contacto-${record.identity.employeeNumber.replace(/[^a-zA-Z0-9_-]/g, '') || record.id}.vcf`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

interface DataUpdateCompletedResultsProps {
  records: DataUpdateRecord[];
}

export function DataUpdateCompletedResults({ records }: DataUpdateCompletedResultsProps) {
  const t = useDataUpdateText();

  return (
    <>
      <div className="data-update-record-grid data-update-cards">
        {records.map((record) => {
          const phone = record.data.mobilePhone.trim();
          const hasPhone = /^\d{10}$/.test(phone);
          return (
            <article key={record.id} className="card data-update-record-card data-update-completed-card">
              <div>
                <span className="type-body-md text-muted">{record.identity.employeeNumber}</span>
                <h3>{record.identity.name}</h3>
              </div>
              <dl className="data-update-completed-card__details">
                <div>
                  <dt>{t('Departamento')}</dt>
                  <dd>{record.identity.area || t('Sin departamento')}</dd>
                </div>
                <div>
                  <dt>{t('Turno')}</dt>
                  <dd>{record.identity.shift || t('Sin turno')}</dd>
                </div>
              </dl>
              <div className="data-update-completed-card__actions">
                {hasPhone ? (
                  <>
                    <a
                      className="btn-secondary data-update-completed-card__icon-action"
                      href={`https://wa.me/${DATA_UPDATE_PHONE_COUNTRY_CODE}${phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t(`Abrir WhatsApp de ${record.identity.name} en una pestaña nueva`)}
                      title={t('Abrir WhatsApp')}
                    >
                      <MessageCircle aria-hidden="true" />
                    </a>
                    <button
                      type="button"
                      className="btn-secondary data-update-completed-card__icon-action"
                      onClick={() => downloadContact(record, phone)}
                      aria-label={t(`Descargar contacto de ${record.identity.name}`)}
                      title={t('Descargar contacto')}
                    >
                      <Download aria-hidden="true" />
                    </button>
                  </>
                ) : (
                  <span className="text-muted">{t('Sin teléfono válido')}</span>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <div className="data-update-table-wrap">
        <table className="data-table data-update-desktop-table data-update-completed-table">
          <caption className="sr-only">{t('Completados')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('Número')}</th>
              <th scope="col">{t('Colaborador')}</th>
              <th scope="col">{t('Departamento')}</th>
              <th scope="col">{t('Turno')}</th>
              <th scope="col">{t('Acciones')}</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => {
              const phone = record.data.mobilePhone.trim();
              const hasPhone = /^\d{10}$/.test(phone);
              return (
                <tr key={record.id}>
                  <td>{record.identity.employeeNumber}</td>
                  <th scope="row">{record.identity.name}</th>
                  <td>{record.identity.area || t('Sin departamento')}</td>
                  <td>{record.identity.shift || t('Sin turno')}</td>
                  <td>
                    <DataUpdateRecordActions aria-label={`${t('Acciones de')} ${record.identity.name}`}>
                      {hasPhone ? (
                        <>
                          <a
                            className="data-update-admin-card__action"
                            href={`https://wa.me/${DATA_UPDATE_PHONE_COUNTRY_CODE}${phone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MessageCircle aria-hidden="true" />
                            <span>{t('Abrir WhatsApp')}</span>
                          </a>
                          <button
                            type="button"
                            className="data-update-admin-card__action"
                            onClick={() => downloadContact(record, phone)}
                          >
                            <Download aria-hidden="true" />
                            <span>{t('Descargar contacto')}</span>
                          </button>
                        </>
                      ) : (
                        <p className="data-update-completed-table__no-phone">{t('Sin teléfono válido')}</p>
                      )}
                    </DataUpdateRecordActions>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

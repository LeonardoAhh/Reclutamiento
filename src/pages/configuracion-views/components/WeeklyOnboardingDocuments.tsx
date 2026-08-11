import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BadgeCheck, FileSignature, Printer } from 'lucide-react';
import { ButtonUtility } from '@/components/ui/ButtonUtility';
import { Checkbox } from '@/components/ui/Checkbox';
import { Modal } from '@/components/ui/Modal';
import { ONBOARDING_DOCUMENT_CONFIG } from '@/lib/constants';
import {
  formatReadableDate,
  localDateToIso,
  TZ_MX,
} from '@/lib/dates';
import type { Employee } from '@/lib/types';

type PrintFormat = 'credential' | 'contracts';

function getEmployeeKey(employee: Employee) {
  return employee.id || employee.num_empleado;
}

interface WeeklyOnboardingDocumentsProps {
  employees: Employee[];
  weekLabel: string;
  printDate: string;
}

interface DocumentTableRowProps {
  employee: Employee | null;
  rowKey: string;
}

function chunkEmployees(employees: Employee[], size: number) {
  const chunks: Employee[][] = [];
  for (let index = 0; index < employees.length; index += size) {
    chunks.push(employees.slice(index, index + size));
  }
  return chunks;
}

function withBlankRows(employees: Employee[], minimumRows: number) {
  const rows: Array<Employee | null> = [...employees];
  while (rows.length < minimumRows) rows.push(null);
  return rows;
}

function formatDocumentDate(isoDate: string) {
  const timestamp = localDateToIso(isoDate);
  if (!timestamp) return formatReadableDate(isoDate);
  return new Date(timestamp).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TZ_MX,
  });
}

function CompanyHeader({ printDate }: { printDate: string }) {
  return (
    <header className="weekly-doc__company-header">
      <img
        className="weekly-doc__logo"
        src={ONBOARDING_DOCUMENT_CONFIG.logoPath}
        alt="Viñoplastic"
      />
      <div className="weekly-doc__company-copy">
        <strong>{ONBOARDING_DOCUMENT_CONFIG.companyName}</strong>
        <span>
          {ONBOARDING_DOCUMENT_CONFIG.location} a {formatDocumentDate(printDate)}.
        </span>
      </div>
    </header>
  );
}

function DocumentFooter({ controlled = false }: { controlled?: boolean }) {
  if (controlled) {
    return (
      <footer className="weekly-doc__controlled-footer">
        <span>{ONBOARDING_DOCUMENT_CONFIG.credential.formCode}</span>
        <span>{ONBOARDING_DOCUMENT_CONFIG.credential.revision}</span>
      </footer>
    );
  }

  return (
    <footer className="weekly-doc__address-footer">
      {ONBOARDING_DOCUMENT_CONFIG.addressFooter}
    </footer>
  );
}

function CredentialTableRow({ employee, rowKey }: DocumentTableRowProps) {
  return (
    <tr key={rowKey}>
      <td>{employee ? formatReadableDate(employee.fecha_ingreso) : ''}</td>
      <td>{employee?.num_empleado ?? ''}</td>
      <td>{employee?.nombre ?? ''}</td>
      <td>{employee?.puesto ?? ''}</td>
      <td aria-label={employee ? `Firma de ${employee.nombre}` : undefined} />
    </tr>
  );
}

function CredentialTable({ employees, minimumRows }: { employees: Employee[]; minimumRows: number }) {
  return (
    <table className="weekly-doc__table weekly-doc__table--credential">
      <thead>
        <tr>
          <th scope="col">Fecha de ingreso</th>
          <th scope="col">No. de emp.</th>
          <th scope="col">Nombre</th>
          <th scope="col">Puesto</th>
          <th scope="col">Firma de recibido</th>
        </tr>
      </thead>
      <tbody>
        {withBlankRows(employees, minimumRows).map((employee, index) => (
          <CredentialTableRow
            key={employee?.id || employee?.num_empleado || `credential-blank-${index}`}
            employee={employee}
            rowKey={employee?.id || employee?.num_empleado || `credential-blank-${index}`}
          />
        ))}
      </tbody>
    </table>
  );
}

function CredentialDocument({ employees, printDate }: { employees: Employee[]; printDate: string }) {
  const config = ONBOARDING_DOCUMENT_CONFIG.credential;
  const firstPageEmployees = employees.slice(0, config.firstPageCapacity);
  const continuationPages = chunkEmployees(
    employees.slice(config.firstPageCapacity),
    config.continuationPageCapacity,
  );

  return (
    <div className="weekly-doc weekly-doc--credential">
      <section className="weekly-doc__page weekly-doc__page--credential-main">
        <h1 className="weekly-doc__title">{config.title}</h1>
        <p className="weekly-doc__date-line">
          {ONBOARDING_DOCUMENT_CONFIG.location} a {formatDocumentDate(printDate)}.
        </p>
        <div className="weekly-doc__body-copy">
          <p>{config.intro}</p>
          {config.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <h2 className="weekly-doc__acknowledgement">{config.acknowledgement}</h2>
        <CredentialTable
          employees={firstPageEmployees}
          minimumRows={config.firstPageCapacity}
        />
        <DocumentFooter controlled />
      </section>

      {continuationPages.map((pageEmployees, pageIndex) => (
        <section
          key={`credential-continuation-${pageIndex}`}
          className="weekly-doc__page weekly-doc__page--credential-continuation"
        >
          <h1 className="weekly-doc__title">{config.title}</h1>
          <CredentialTable
            employees={pageEmployees}
            minimumRows={config.continuationPageCapacity}
          />
          <DocumentFooter controlled />
        </section>
      ))}
    </div>
  );
}

function ContractTable({
  employees,
  printDate,
}: {
  employees: Employee[];
  printDate: string;
}) {
  const minimumRows = ONBOARDING_DOCUMENT_CONFIG.contract.collectivePageCapacity;
  return (
    <table className="weekly-doc__table weekly-doc__table--contract">
      <thead>
        <tr>
          <th scope="col">No. Empleado</th>
          <th scope="col">Nombre completo</th>
          <th scope="col">Fecha de entrega</th>
          <th scope="col">Firma</th>
        </tr>
      </thead>
      <tbody>
        {withBlankRows(employees, minimumRows).map((employee, index) => (
          <tr key={employee?.id || employee?.num_empleado || `contract-blank-${index}`}>
            <td>{employee?.num_empleado ?? ''}</td>
            <td>{employee?.nombre ?? ''}</td>
            <td>{employee ? formatDocumentDate(printDate) : ''}</td>
            <td aria-label={employee ? `Firma de ${employee.nombre}` : undefined} />
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ContractDocument({
  employees,
  weekLabel,
  printDate,
}: WeeklyOnboardingDocumentsProps) {
  const config = ONBOARDING_DOCUMENT_CONFIG.contract;
  const collectivePages = chunkEmployees(employees, config.collectivePageCapacity);

  return (
    <div className="weekly-doc weekly-doc--contracts">
      {collectivePages.map((pageEmployees, pageIndex) => (
        <section
          key={`contract-collective-${pageIndex}`}
          className="weekly-doc__page weekly-doc__page--contract-collective"
        >
          <CompanyHeader printDate={printDate} />
          <p className="weekly-doc__contract-statement">
            {config.collectiveStatement}{' '}
            <strong>{weekLabel}</strong>.
          </p>
          <ContractTable employees={pageEmployees} printDate={printDate} />
          <DocumentFooter />
        </section>
      ))}
    </div>
  );
}

function DocumentPreviewCard({
  format,
  title,
  description,
  employees,
  weekLabel,
  onReview,
}: {
  format: PrintFormat;
  title: string;
  description: string;
  employees: Employee[];
  weekLabel: string;
  onReview: (format: PrintFormat) => void;
}) {
  const Icon = format === 'credential' ? BadgeCheck : FileSignature;
  const previewEmployees = employees.slice(0, 3);

  return (
    <article className="weekly-format-card">
      <header className="weekly-format-card__header">
        <span className="weekly-format-card__icon" aria-hidden="true">
          <Icon />
        </span>
        <div>
          <h3 className="weekly-format-card__title">{title}</h3>
          <p className="weekly-format-card__description">{description}</p>
        </div>
      </header>

      <div className="weekly-format-card__preview" aria-hidden="true">
        <span className="weekly-format-card__preview-title">{title}</span>
        <span className="weekly-format-card__preview-rule" />
        {previewEmployees.length > 0 ? (
          previewEmployees.map((employee) => (
            <span key={employee.id || employee.num_empleado}>
              {employee.num_empleado} · {employee.nombre}
            </span>
          ))
        ) : (
          <span>Sin ingresos en esta semana</span>
        )}
      </div>

      <footer className="weekly-format-card__footer">
        <div className="weekly-format-card__meta">
          <span>{weekLabel}</span>
          <strong>
            {employees.length} {employees.length === 1 ? 'empleado' : 'empleados'}
          </strong>
        </div>
        <ButtonUtility
          type="button"
          icon={<Printer aria-hidden="true" />}
          onClick={() => onReview(format)}
          disabled={employees.length === 0}
        >
          Revisar e imprimir
        </ButtonUtility>
      </footer>
    </article>
  );
}

interface DocumentReviewModalProps {
  isOpen: boolean;
  format: PrintFormat | null;
  employees: Employee[];
  selectedKeys: Set<string>;
  weekLabel: string;
  printDate: string;
  onClose: () => void;
  onToggleEmployee: (employeeKey: string) => void;
  onToggleAll: () => void;
  onPrint: () => void;
}

function DocumentReviewModal({
  isOpen,
  format,
  employees,
  selectedKeys,
  weekLabel,
  printDate,
  onClose,
  onToggleEmployee,
  onToggleAll,
  onPrint,
}: DocumentReviewModalProps) {
  if (!format) return null;

  const selectedEmployees = employees.filter((employee) =>
    selectedKeys.has(getEmployeeKey(employee)),
  );
  const allSelected =
    employees.length > 0 && selectedEmployees.length === employees.length;
  const PreviewIcon = format === 'credential' ? BadgeCheck : FileSignature;
  const title =
    format === 'credential' ? 'Entrega de credencial' : 'Entrega de contratos';

  const footerActions = (
    <>
      <ButtonUtility type="button" onClick={onClose}>
        Cancelar
      </ButtonUtility>
      <button
        type="button"
        className="btn-primary"
        onClick={onPrint}
        disabled={selectedEmployees.length === 0}
      >
        <Printer aria-hidden="true" />
        Imprimir {selectedEmployees.length}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={<PreviewIcon aria-hidden="true" />}
      className="weekly-review-modal"
      footerActions={footerActions}
      size="xl"
      fullscreenMobile
    >
      <div className="modal-body weekly-review-modal__body">
        <aside className="weekly-review-modal__selector" aria-label="Empleados incluidos">
          <header className="weekly-review-modal__selector-header">
            <div>
              <h3>Empleados incluidos</h3>
              <p aria-live="polite">
                {selectedEmployees.length} de {employees.length} seleccionados
              </p>
            </div>
            <label className="weekly-review-modal__select-all">
              <Checkbox
                checked={allSelected}
                onChange={onToggleAll}
                aria-label={allSelected ? 'Excluir a todos' : 'Incluir a todos'}
              />
              <span>{allSelected ? 'Quitar todos' : 'Seleccionar todos'}</span>
            </label>
          </header>

          <ul className="weekly-review-modal__employee-list">
            {employees.map((employee) => {
              const employeeKey = getEmployeeKey(employee);
              const isSelected = selectedKeys.has(employeeKey);
              return (
                <li key={employeeKey}>
                  <label className="weekly-review-modal__employee">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => onToggleEmployee(employeeKey)}
                      aria-label={`${isSelected ? 'Excluir' : 'Incluir'} a ${employee.nombre}`}
                    />
                    <span className="weekly-review-modal__employee-copy">
                      <strong>{employee.nombre}</strong>
                      <span>#{employee.num_empleado} · {employee.puesto}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="weekly-review-modal__preview" aria-label="Vista previa completa">
          <div className="weekly-doc-preview">
            {format === 'credential' ? (
              <CredentialDocument
                employees={selectedEmployees}
                printDate={printDate}
              />
            ) : (
              <ContractDocument
                employees={selectedEmployees}
                weekLabel={weekLabel}
                printDate={printDate}
              />
            )}
          </div>
        </section>
      </div>
    </Modal>
  );
}

export function WeeklyOnboardingDocuments({
  employees,
  weekLabel,
  printDate,
}: WeeklyOnboardingDocumentsProps) {
  const [reviewFormat, setReviewFormat] = useState<PrintFormat | null>(null);
  const [activePrint, setActivePrint] = useState<PrintFormat | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
    () => new Set(employees.map(getEmployeeKey)),
  );

  useEffect(() => {
    setSelectedKeys(new Set(employees.map(getEmployeeKey)));
    setReviewFormat(null);
  }, [employees, weekLabel]);

  useEffect(() => {
    if (!activePrint) return;

    const handleAfterPrint = () => setActivePrint(null);
    window.addEventListener('afterprint', handleAfterPrint, { once: true });
    const frame = window.requestAnimationFrame(() => window.print());

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [activePrint]);

  const selectedEmployees = employees.filter((employee) =>
    selectedKeys.has(getEmployeeKey(employee)),
  );

  const handleToggleEmployee = (employeeKey: string) => {
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (next.has(employeeKey)) next.delete(employeeKey);
      else next.add(employeeKey);
      return next;
    });
  };

  const handleToggleAll = () => {
    setSelectedKeys((current) =>
      current.size === employees.length
        ? new Set<string>()
        : new Set(employees.map(getEmployeeKey)),
    );
  };

  const handlePrintReviewed = () => {
    if (!reviewFormat || selectedEmployees.length === 0) return;
    setActivePrint(reviewFormat);
  };

  const printRoot = activePrint
    ? createPortal(
        <div className="recordatorios-print-root" aria-hidden="true">
          {activePrint === 'credential' ? (
            <CredentialDocument
              employees={selectedEmployees}
              printDate={printDate}
            />
          ) : (
            <ContractDocument
              employees={selectedEmployees}
              weekLabel={weekLabel}
              printDate={printDate}
            />
          )}
        </div>,
        document.body,
      )
    : null;

  return (
    <section className="weekly-formats" aria-labelledby="weekly-formats-title">
      <header className="weekly-formats__heading">
        <div>
          <h2 id="weekly-formats-title" className="weekly-formats__title">
            Formatos de ingreso
          </h2>
          <p className="weekly-formats__subtitle">
            Documentos tamaño carta listos para firma e impresión en blanco y negro.
          </p>
        </div>
        <span className="weekly-formats__week">{weekLabel}</span>
      </header>

      <div className="weekly-formats__grid">
        <DocumentPreviewCard
          format="credential"
          title="Entrega de credencial"
          description="Responsiva colectiva para los ingresos de la semana."
          employees={employees}
          weekLabel={weekLabel}
          onReview={setReviewFormat}
        />
        <DocumentPreviewCard
          format="contracts"
          title="Entrega de contratos"
          description="Constancia colectiva para firma de recibido."
          employees={employees}
          weekLabel={weekLabel}
          onReview={setReviewFormat}
        />
      </div>

      {employees.length === 0 && (
        <p className="weekly-formats__empty" role="status">
          No hay ingresos registrados en la semana seleccionada.
        </p>
      )}

      <DocumentReviewModal
        isOpen={reviewFormat !== null}
        format={reviewFormat}
        employees={employees}
        selectedKeys={selectedKeys}
        weekLabel={weekLabel}
        printDate={printDate}
        onClose={() => setReviewFormat(null)}
        onToggleEmployee={handleToggleEmployee}
        onToggleAll={handleToggleAll}
        onPrint={handlePrintReviewed}
      />

      {printRoot}
    </section>
  );
}

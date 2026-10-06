import { useEffect, useState, useMemo } from 'react';
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
import { useLanguage } from '@/contexts/LanguageContext';
import { getConfiguracionCopy } from '../configuracion-translations';

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

function CredentialHeader() {
  return (
    <header className="weekly-doc__credential-header">
      <h3 className="weekly-doc__title">
        {ONBOARDING_DOCUMENT_CONFIG.credential.title}
      </h3>
    </header>
  );
}

function CompanyHeader({ printDate }: { printDate: string }) {
  return (
    <header className="weekly-doc__company-header">
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

function CredentialTableRow({ employee }: DocumentTableRowProps) {
  return (
    <tr>
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
        <CredentialHeader />
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
          <CredentialHeader />
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

function ContractTable({ employees }: { employees: Employee[] }) {
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
            <td />
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
          <ContractTable employees={pageEmployees} />
          <DocumentFooter />
        </section>
      ))}
    </div>
  );
}

function DocumentFormatCard({
  format,
  title,
  description,
  employees,
  onReview,
  language,
}: {
  format: PrintFormat;
  title: string;
  description: string;
  employees: Employee[];
  onReview: (format: PrintFormat) => void;
  language: 'es' | 'en';
}) {
  const copy = getConfiguracionCopy(language).formats;
  const Icon = format === 'credential' ? BadgeCheck : FileSignature;

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

      <footer className="weekly-format-card__footer">
        <div className="weekly-format-card__meta">
          <strong>
            {employees.length} {employees.length === 1 ? copy.employee : copy.employees}
          </strong>
        </div>
        <ButtonUtility
          type="button"
          icon={<Printer aria-hidden="true" />}
          onClick={() => onReview(format)}
          disabled={employees.length === 0}
          aria-describedby={
            employees.length === 0 ? 'weekly-formats-empty' : undefined
          }
        >
          {copy.review}
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
  onClose: () => void;
  onToggleEmployee: (employeeKey: string) => void;
  onToggleAll: () => void;
  onPrint: () => void;
  language: 'es' | 'en';
}

function DocumentReviewModal({
  isOpen,
  format,
  employees,
  selectedKeys,
  onClose,
  onToggleEmployee,
  onToggleAll,
  onPrint,
  language,
}: DocumentReviewModalProps) {
  const copy = getConfiguracionCopy(language).formats;
  if (!format) return null;

  const selectedEmployees = employees.filter((employee) =>
    selectedKeys.has(getEmployeeKey(employee)),
  );
  const allSelected =
    employees.length > 0 && selectedEmployees.length === employees.length;
  const title =
    format === 'credential' ? copy.credentialDelivery : copy.contractDelivery;

  const footerActions = (
    <>
      <button type="button" className="btn-secondary" onClick={onClose}>
        {copy.cancel}
      </button>
      <button
        type="button"
        className="btn-primary"
        onClick={onPrint}
        disabled={selectedEmployees.length === 0}
      >
        <Printer size="var(--icon-size-sm)" aria-hidden="true" />
        {copy.print} {selectedEmployees.length}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      className="weekly-review-modal"
      footerActions={footerActions}
      size="sm"
    >
      <div className="modal-body weekly-review-modal__body">
        <section
          className="weekly-review-modal__selector"
          aria-labelledby="weekly-review-employees-title"
        >
          <header className="weekly-review-modal__selector-header">
            <div>
              <h3 id="weekly-review-employees-title">{copy.includedEmployees}</h3>
              <p aria-live="polite">
                {selectedEmployees.length} {copy.of} {employees.length}{' '}
                {selectedEmployees.length === 1 ? copy.selectedOne : copy.selected}
              </p>
            </div>
            <label className="weekly-review-modal__select-all">
              <Checkbox
                checked={allSelected}
                onChange={onToggleAll}
                aria-label={allSelected ? copy.excludeAll : copy.includeAll}
              />
              <span>{allSelected ? copy.removeAll : copy.selectAll}</span>
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
                      aria-label={`${isSelected ? copy.exclude : copy.include} ${language === 'en' ? '' : 'a '}${employee.nombre}`}
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
        </section>
      </div>
    </Modal>
  );
}

export function WeeklyOnboardingDocuments({
  employees: rawEmployees,
  weekLabel,
  printDate,
}: WeeklyOnboardingDocumentsProps) {
  const { language } = useLanguage();
  const copy = getConfiguracionCopy(language).formats;
  const employees = useMemo(() => {
    return [...rawEmployees].sort((a, b) => {
      const numA = String(a.num_empleado || '');
      const numB = String(b.num_empleado || '');
      return numA.localeCompare(numB, undefined, { numeric: true });
    });
  }, [rawEmployees]);

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
            {copy.onboardingFormats}
          </h2>
        </div>
      </header>

      <div className="weekly-formats__grid">
        <DocumentFormatCard
          format="credential"
          title={copy.credentialDelivery}
          description={copy.credentialDescription}
          employees={employees}
          onReview={setReviewFormat}
          language={language}
        />
        <DocumentFormatCard
          format="contracts"
          title={copy.contractDelivery}
          description={copy.contractsDescription}
          employees={employees}
          onReview={setReviewFormat}
          language={language}
        />
      </div>

      {employees.length === 0 && (
        <p
          id="weekly-formats-empty"
          className="weekly-formats__empty"
          role="status"
        >
          {copy.noHiresThisWeek}
        </p>
      )}

      <DocumentReviewModal
        isOpen={reviewFormat !== null}
        format={reviewFormat}
        employees={employees}
        selectedKeys={selectedKeys}
        onClose={() => setReviewFormat(null)}
        onToggleEmployee={handleToggleEmployee}
        onToggleAll={handleToggleAll}
        onPrint={handlePrintReviewed}
        language={language}
      />

      {printRoot}
    </section>
  );
}

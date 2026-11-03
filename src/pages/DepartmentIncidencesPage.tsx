import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { PageHeading } from '@/components/layout/PageHeading';
import { useReportLocale } from '@/components/reporte-diario/useReportLocale';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { useReporteDiario, type ReporteDiarioRecord } from '@/hooks/useReporteDiario';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { DepartmentCardImage } from './DepartmentCardImage';
import { DepartmentEmployeeSearch } from './DepartmentEmployeeSearch';
import { DepartmentEmployeesTable } from './DepartmentEmployeesTable';
import { DepartmentEmployeeProfile } from './DepartmentEmployeeProfile';
import { summarizeDepartmentIncidences } from './department-incidences';
import './DepartmentIncidencesPage.css';

export function DepartmentIncidencesPage() {
  const { copy } = useReportLocale();
  const { fetchSummaries, fetchByMesList, error } = useReporteDiario();
  const { employees, loading: employeesLoading, error: employeesError } = useSupabaseData();
  const [reports, setReports] = useState<ReporteDiarioRecord[] | null>(null);
  const [revision, setRevision] = useState(0);
  const activeEmployeeNumbers = useMemo(
    () => new Set(employees.map((employee) => employee.num_empleado.trim())),
    [employees],
  );
  const data = useMemo(
    () => summarizeDepartmentIncidences(reports ?? [], activeEmployeeNumbers),
    [reports, activeEmployeeNumbers],
  );
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedEmployeeNumber, setSelectedEmployeeNumber] = useState<string | null>(null);
  const departmentListRef = useRef<HTMLUListElement>(null);
  const detailHeadingRef = useRef<HTMLHeadingElement>(null);
  const profileHeadingRef = useRef<HTMLHeadingElement>(null);
  const employeeTableRef = useRef<HTMLTableElement>(null);
  const pendingFocusRef = useRef<'detail' | 'card' | 'profile' | 'employee' | null>(null);
  const returnDepartmentRef = useRef<string | null>(null);
  const returnEmployeeRef = useRef<string | null>(null);
  const currentDepartment = data.departments.find((department) => department.name === selectedDepartment);
  const currentEmployees = selectedDepartment ? (data.employeesByDepartment.get(selectedDepartment) ?? []) : [];
  const currentEmployee = currentEmployees.find((employee) => employee.number === selectedEmployeeNumber);
  const allEmployees = useMemo(() => [...data.employeesByDepartment.values()].flat(), [data.employeesByDepartment]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setReports(null);
      setSelectedDepartment(null);
      setSelectedEmployeeNumber(null);
      pendingFocusRef.current = null;
      const summaries = await fetchSummaries();
      if (!active) return;
      const data = summaries.length > 0 ? await fetchByMesList(summaries.map((item) => item.mes)) : [];
      if (active) setReports(data);
    };
    void load();
    return () => {
      active = false;
    };
  }, [fetchSummaries, fetchByMesList, revision]);

  useEffect(() => {
    if (pendingFocusRef.current === 'detail' && selectedDepartment) {
      detailHeadingRef.current?.focus();
      pendingFocusRef.current = null;
    } else if (pendingFocusRef.current === 'card' && !selectedDepartment) {
      const cards = departmentListRef.current?.querySelectorAll<HTMLButtonElement>('button[data-department]');
      Array.from(cards ?? [])
        .find((card) => card.dataset.department === returnDepartmentRef.current)
        ?.focus();
      pendingFocusRef.current = null;
    } else if (pendingFocusRef.current === 'profile' && currentEmployee) {
      profileHeadingRef.current?.focus();
      pendingFocusRef.current = null;
    } else if (pendingFocusRef.current === 'employee' && !selectedEmployeeNumber) {
      const buttons = employeeTableRef.current?.querySelectorAll<HTMLButtonElement>('button[data-employee]');
      Array.from(buttons ?? [])
        .find((button) => button.dataset.employee === returnEmployeeRef.current)
        ?.focus();
      pendingFocusRef.current = null;
    }
  }, [selectedDepartment, selectedEmployeeNumber, currentEmployee]);

  const selectDepartment = (name: string) => {
    pendingFocusRef.current = 'detail';
    setSelectedEmployeeNumber(null);
    setSelectedDepartment(name);
  };

  const returnToDepartments = () => {
    returnDepartmentRef.current = selectedDepartment;
    pendingFocusRef.current = 'card';
    setSelectedEmployeeNumber(null);
    setSelectedDepartment(null);
  };

  const selectEmployee = (number: string, department = selectedDepartment) => {
    pendingFocusRef.current = 'profile';
    if (department) setSelectedDepartment(department);
    setSelectedEmployeeNumber(number);
  };
  const returnToEmployees = () => {
    returnEmployeeRef.current = selectedEmployeeNumber;
    pendingFocusRef.current = 'employee';
    setSelectedEmployeeNumber(null);
  };

  return (
    <main className="department-incidences-page container" aria-labelledby="department-incidences-title">
      <PageHeading id="department-incidences-title" className="app-page-title">
        {copy('Incidencias', 'Incidents')}
      </PageHeading>
      <DepartmentEmployeeSearch
        employees={allEmployees}
        disabled={reports === null || employeesLoading || Boolean(error) || Boolean(employeesError)}
        onSelect={(employee) => selectEmployee(employee.number, employee.department)}
      />

      {reports === null ? (
        <LoadingSkeleton
          label={copy('Cargando incidencias…', 'Loading incidents…')}
          className="department-incidences-page__loading"
        >
          <span className="loading-skeleton__bone department-incidences-page__loading-card" />
          <span className="loading-skeleton__bone department-incidences-page__loading-card" />
        </LoadingSkeleton>
      ) : error ? (
        <div className="department-incidences-page__message">
          <p className="form-error-text" role="alert">
            {copy('No se pudieron cargar las incidencias.', 'Could not load incidents.')}
          </p>
          <button type="button" className="btn-secondary" onClick={() => setRevision((value) => value + 1)}>
            {copy('Reintentar', 'Retry')}
          </button>
        </div>
      ) : data.departments.length === 0 ? (
        <output className="department-incidences-page__message">
          {copy('No hay departamentos en los reportes cargados.', 'No departments in the uploaded reports.')}
        </output>
      ) : (
        <div className="department-incidences-page__layout">
          {currentDepartment ? (
            <>
              {!currentEmployee && (
                <section
                  id="department-incidences-detail"
                  className="department-incidences-page__detail"
                  aria-labelledby="department-incidences-detail-title"
                >
                  <div className="department-incidences-page__detail-heading">
                    <button
                      type="button"
                      className="btn-ghost department-incidences-page__back"
                      onClick={returnToDepartments}
                    >
                      <ArrowLeft size="var(--icon-size-sm)" aria-hidden="true" />
                      {copy('Volver', 'Back')}
                    </button>
                    <h2
                      ref={detailHeadingRef}
                      tabIndex={-1}
                      id="department-incidences-detail-title"
                      className="department-incidences-page__section-title"
                    >
                      {currentDepartment.name}
                    </h2>
                  </div>
                  {employeesLoading ? (
                    <LoadingSkeleton
                      label={copy('Cargando empleados…', 'Loading employees…')}
                      className="department-incidences-page__detail-loading"
                    >
                      <span className="loading-skeleton__bone department-incidences-page__loading-card" />
                    </LoadingSkeleton>
                  ) : employeesError ? (
                    <p className="department-incidences-page__detail-empty" role="alert">
                      {copy('No se pudo validar la plantilla activa.', 'Could not verify the active workforce.')}
                    </p>
                  ) : currentEmployees.length === 0 ? (
                    <output className="department-incidences-page__detail-empty">
                      {copy(
                        'No hay empleados actuales en este departamento.',
                        'No current employees in this department.',
                      )}
                    </output>
                  ) : (
                    <DepartmentEmployeesTable
                      employees={currentEmployees}
                      departmentName={currentDepartment.name}
                      tableRef={employeeTableRef}
                      onSelectEmployee={selectEmployee}
                    />
                  )}
                </section>
              )}
              {currentEmployee && (
                <DepartmentEmployeeProfile
                  employee={currentEmployee}
                  headingRef={profileHeadingRef}
                  onBack={returnToEmployees}
                />
              )}
            </>
          ) : (
            <section
              className="department-incidences-page__departments"
              aria-labelledby="department-incidences-departments"
            >
              <h2 id="department-incidences-departments" className="department-incidences-page__section-title">
                {copy('Departamentos', 'Departments')}
              </h2>
              <ul ref={departmentListRef} className="department-incidences-page__grid">
                {data.departments.map((department) => (
                  <li key={department.name}>
                    <button
                      type="button"
                      className="department-incidences-page__card"
                      data-department={department.name}
                      onClick={() => selectDepartment(department.name)}
                    >
                      <DepartmentCardImage department={department.name} />
                      <span className="department-incidences-page__card-title">{department.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </main>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { formatReadableDate } from '@/lib/dates';
import {
  profileHiringKey,
  type EligibleProfileEmployee,
  type ProfileCycle,
  type ProfileEvaluation,
} from './types';

interface ProfileSummaryProps {
  cycle: ProfileCycle;
  employees: EligibleProfileEmployee[];
  evaluations: ProfileEvaluation[];
}

export function ProfileSummary({ cycle, employees, evaluations }: ProfileSummaryProps) {
  const [search, setSearch] = useState('');
  const [recruiter, setRecruiter] = useState('');
  const cycleEvaluations = evaluations.filter((evaluation) => evaluation.cycle_id === cycle.id);
  const submitted = cycleEvaluations.filter((evaluation) => evaluation.status === 'submitted');
  const evaluationByHiring = new Map(
    cycleEvaluations.map((evaluation) => [
      profileHiringKey(evaluation.employee_num, evaluation.employee_entry_date),
      evaluation,
    ]),
  );
  const averageBps = submitted.length > 0
    ? Math.round(submitted.reduce((total, evaluation) => total + evaluation.score_bps, 0) / submitted.length)
    : 0;

  const recruiters = useMemo(
    () => [...new Set(employees.map((employee) => employee.recruiter || 'Sin asignar'))].sort((a, b) => a.localeCompare(b, 'es-MX')),
    [employees],
  );

  const recruiterRows = useMemo(() => recruiters.map((name) => {
    const hires = employees.filter((employee) => (employee.recruiter || 'Sin asignar') === name);
    const submittedForRecruiter = hires
      .map((employee) => evaluationByHiring.get(employee.key))
      .filter((evaluation): evaluation is ProfileEvaluation => evaluation?.status === 'submitted');
    const score = submittedForRecruiter.length > 0
      ? Math.round(submittedForRecruiter.reduce((total, evaluation) => total + evaluation.score_bps, 0) / submittedForRecruiter.length)
      : null;
    return { name, hires: hires.length, evaluated: submittedForRecruiter.length, score };
  }), [employees, recruiters, cycleEvaluations]);

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleUpperCase('es-MX');
    return employees.filter((employee) => {
      const matchesRecruiter = !recruiter || (employee.recruiter || 'Sin asignar') === recruiter;
      const matchesSearch = !normalizedSearch || [employee.num, employee.name, employee.position]
        .some((value) => value.toLocaleUpperCase('es-MX').includes(normalizedSearch));
      return matchesRecruiter && matchesSearch;
    });
  }, [employees, recruiter, search]);

  const employeePagination = usePagination(filteredEmployees, 12);

  useEffect(() => {
    employeePagination.goToPage(1);
  }, [search, recruiter, employeePagination.goToPage]);

  return (
    <div className="profile-general__summary-layout">
      <section className="profile-general__metrics" aria-label="Resumen del ciclo">
        <article className="card profile-general__metric"><span>Ingresos del ciclo</span><strong>{employees.length}</strong></article>
        <article className="card profile-general__metric"><span>Evaluaciones enviadas</span><strong>{submitted.length}</strong></article>
        <article className="card profile-general__metric"><span>Pendientes</span><strong>{Math.max(0, employees.length - submitted.length)}</strong></article>
        <article className="card profile-general__metric"><span>Cumplimiento promedio</span><strong>{submitted.length ? `${(averageBps / 100).toFixed(2)}%` : '—'}</strong></article>
      </section>

      <section className="card profile-general__panel" aria-labelledby="profile-recruiter-summary-title">
        <header className="profile-general__section-header">
          <div>
            <h2 id="profile-recruiter-summary-title">Resultado por reclutador</h2>
            <p>Promedio simple de sus contrataciones enviadas; cada ingreso tiene el mismo peso.</p>
          </div>
        </header>
        <div className="profile-general__recruiter-grid">
          {recruiterRows.map((row) => (
            <article key={row.name} className="profile-general__recruiter-card">
              <h3>{row.name}</h3>
              <dl>
                <div><dt>Ingresos</dt><dd>{row.hires}</dd></div>
                <div><dt>Evaluados</dt><dd>{row.evaluated}</dd></div>
                <div><dt>Promedio</dt><dd>{row.score === null ? '—' : `${(row.score / 100).toFixed(2)}%`}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="card profile-general__panel" aria-labelledby="profile-employee-summary-title">
        <header className="profile-general__section-header">
          <div>
            <h2 id="profile-employee-summary-title">Detalle por empleado</h2>
            <p>Consulta el resultado y la versión histórica aplicada a cada ingreso.</p>
          </div>
        </header>
        <div className="profile-general__summary-filters" aria-label="Filtros del detalle">
          <div className="form-group">
            <label htmlFor="profile-summary-search">Buscar</label>
            <input id="profile-summary-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Número, nombre o puesto" />
          </div>
          <div className="form-group">
            <label htmlFor="profile-summary-recruiter">Reclutador</label>
            <CustomSelect
              id="profile-summary-recruiter"
              value={recruiter}
              onChange={setRecruiter}
              options={recruiters.map((value) => ({ value, label: value }))}
              placeholder="Todos"
            />
          </div>
        </div>

        {filteredEmployees.length === 0 ? (
          <div className="profile-general__empty" role="status">
            <h3>Sin coincidencias</h3>
            <p>Cambia la búsqueda o limpia el filtro de reclutador.</p>
            <button type="button" className="btn-secondary" onClick={() => { setSearch(''); setRecruiter(''); }}>Limpiar filtros</button>
          </div>
        ) : (
          <div className="profile-general__details-list profile-general__details-list--employees">
            {employeePagination.pageItems.map((employee) => {
              const evaluation = evaluationByHiring.get(employee.key);
              const evaluationLabel = evaluation?.status === 'submitted'
                ? `${(evaluation.score_bps / 100).toFixed(2)}%`
                : evaluation?.status === 'draft'
                  ? 'Borrador'
                  : 'Pendiente';
              return (
                <details key={employee.key} className="profile-general__details profile-general__employee-detail">
                  <summary>
                    <span className="profile-general__employee-identity">
                      <span className="profile-general__employee-number">{employee.num}</span>
                      <span className="profile-general__employee-name">{employee.name}</span>
                    </span>
                    <span className="profile-general__summary-meta">
                      <span className="profile-general__employee-position">{employee.position}</span>
                      <span className="profile-general__employee-state">{employee.source === 'baja' ? 'Baja' : 'Activo'}</span>
                      <span className={`profile-general__evaluation-state profile-general__evaluation-state--${evaluation?.status ?? 'pending'}`}>
                        {evaluationLabel}
                      </span>
                    </span>
                  </summary>
                  <dl className="profile-general__detail-data">
                    <div><dt>Ingreso</dt><dd>{formatReadableDate(employee.entryDate)}</dd></div>
                    <div><dt>Reclutador</dt><dd>{employee.recruiter || 'Sin asignar'}</dd></div>
                    <div><dt>Área y sección</dt><dd>{employee.area} · {employee.section}</dd></div>
                    {employee.source === 'baja' && <div><dt>Baja</dt><dd>{formatReadableDate(employee.exitDate)} · {employee.exitReason || 'Sin motivo registrado'}</dd></div>}
                  </dl>
                  {evaluation ? (
                    <>
                      <ol className="profile-general__result-items">
                        {evaluation.items.map((item) => (
                          <li key={item.id}>
                            <span>{item.description_snapshot}</span>
                            <span>{item.complies ? 'Cumple' : 'No cumple'} · {(item.weight_bps_snapshot / 100).toFixed(2)}%</span>
                          </li>
                        ))}
                      </ol>
                      {evaluation.comments && <p className="profile-general__result-comments"><strong>Comentarios:</strong> {evaluation.comments}</p>}
                    </>
                  ) : (
                    <p className="profile-general__pending-copy">Esta contratación todavía no tiene evaluación.</p>
                  )}
                </details>
              );
            })}
            <Pagination
              currentPage={employeePagination.currentPage}
              totalPages={employeePagination.totalPages}
              onPageChange={employeePagination.goToPage}
              onPrev={employeePagination.prevPage}
              onNext={employeePagination.nextPage}
              canGoPrev={employeePagination.canGoPrev}
              canGoNext={employeePagination.canGoNext}
              ariaLabel="Paginación del detalle por empleado"
            />
          </div>
        )}
      </section>
    </div>
  );
}

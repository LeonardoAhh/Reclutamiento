import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { INCIDENCIA_LABELS } from "./constants";

export interface TopEmployee {
  numero_empleado: string;
  nombre: string;
  departamento: string;
  area: string;
  total: number;
  byCode: Record<string, number>;
  byMes: Record<string, number>;
}

export interface AnalisisAsistenciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  topIncidenceEmployees: TopEmployee[];
  getDrillDownDays: (
    empKey: string,
    mes: string,
  ) => { day: string; dayLabel: string; code: string; label: string }[];
  formatMes: (mes: string) => string;
}

export function AnalisisAsistenciaModal({
  isOpen,
  onClose,
  topIncidenceEmployees,
  getDrillDownDays,
  formatMes,
}: AnalisisAsistenciaModalProps) {
  const [selectedTopEmpKey, setSelectedTopEmpKey] = useState<string | null>(null);
  const [drillDownMonth, setDrillDownMonth] = useState<{
    empKey: string;
    mes: string;
  } | null>(null);
  const reduceMotion = useReducedMotion();

  const enterFromRight = reduceMotion ? false : { opacity: 0, x: 24 };
  const exitToRight = reduceMotion ? undefined : { opacity: 0, x: 24 };
  const enterFromLeft = reduceMotion ? false : { opacity: 0, x: -24 };
  const exitToLeft = reduceMotion ? undefined : { opacity: 0, x: -24 };

  const handleClose = () => {
    setSelectedTopEmpKey(null);
    setDrillDownMonth(null);
    onClose();
  };

  if (topIncidenceEmployees.length === 0) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Análisis de asistencia"
      onBack={drillDownMonth ? () => setDrillDownMonth(null) : undefined}
      size="sm"
    >
      <div className="top-emp-modal">
        <AnimatePresence mode="wait" initial={false}>
          {drillDownMonth ? (
            (() => {
              const emp = topIncidenceEmployees.find(
                (e) => e.numero_empleado === drillDownMonth.empKey,
              );
              const days = getDrillDownDays(
                drillDownMonth.empKey,
                drillDownMonth.mes,
              );
              return (
                <motion.div
                  key="drill"
                  initial={enterFromRight}
                  animate={{ opacity: 1, x: 0 }}
                  exit={exitToRight}
                  transition={{
                    duration: reduceMotion ? 0 : 0.18,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                >
                  <div className="top-emp-drill-header">
                    <div className="top-emp-drill-header__info">
                      <span className="top-emp-drill-header__name">
                        {emp?.nombre}
                      </span>
                      <span className="top-emp-drill-header__month">
                        {formatMes(drillDownMonth.mes)}
                      </span>
                    </div>
                  </div>

                  {days.length === 0 ? (
                    <p className="top-emp-drill-empty">
                      Sin incidencias registradas este mes.
                    </p>
                  ) : (
                    <ol
                      className="top-emp-drill-days"
                      aria-label={`Días con incidencia en ${formatMes(drillDownMonth.mes)}`}
                    >
                      {days.map(({ day, dayLabel, code, label }) => (
                        <li key={day} className="top-emp-drill-day">
                          <span
                            className="top-emp-drill-day__num"
                            aria-label={dayLabel}
                          >
                            {dayLabel}
                          </span>
                          <span
                            className="top-emp-modal__code-badge"
                            aria-hidden="true"
                          >
                            {code}
                          </span>
                          <span className="top-emp-drill-day__label">
                            {label}
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
                </motion.div>
              );
            })()
          ) : (
            <motion.div
              key="list"
              initial={enterFromLeft}
              animate={{ opacity: 1, x: 0 }}
              exit={exitToLeft}
              transition={{
                duration: reduceMotion ? 0 : 0.18,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              <ol
                className="top-emp-list"
                aria-label="Top 10 empleados con más incidencias"
              >
                {topIncidenceEmployees.map((emp, idx) => {
                  const isOpenItem = selectedTopEmpKey === emp.numero_empleado;
                  const detailId = `top-emp-detail-${emp.numero_empleado}`;
                  const maxTotal = topIncidenceEmployees[0].total;
                  const barPct = Math.round((emp.total / maxTotal) * 100);

                  return (
                    <li
                      key={emp.numero_empleado}
                      className={`top-emp-item${isOpenItem ? " top-emp-item--open" : ""}`}
                    >
                      <button
                        type="button"
                        className="top-emp-row"
                        aria-expanded={isOpenItem}
                        aria-controls={detailId}
                        onClick={() => {
                          setDrillDownMonth(null);
                          setSelectedTopEmpKey(
                            isOpenItem ? null : emp.numero_empleado,
                          );
                        }}
                        data-testid={`top-emp-row-${idx + 1}`}
                      >
                        <span
                          className={`top-emp-rank${idx === 0 ? " top-emp-rank--first" : ""}`}
                          aria-label={`Posición ${idx + 1}`}
                        >
                          {idx + 1}
                        </span>
                        <span className="top-emp-row__info">
                          <span className="top-emp-row__name">
                            {emp.nombre}
                          </span>
                          <span className="top-emp-row__meta">
                            #{emp.numero_empleado}
                            <span aria-hidden="true"> · </span>
                            {emp.area}
                          </span>
                        </span>
                        <span
                          className="top-emp-row__right"
                          aria-hidden="true"
                        >
                          <span className="top-emp-row__bar-wrap">
                            <span
                              className="top-emp-row__bar"
                              style={{ width: `${barPct}%` }}
                            />
                          </span>
                          <span
                            className="top-emp-row__total"
                            aria-label={`${emp.total} incidencias`}
                          >
                            {emp.total}
                          </span>
                        </span>
                      </button>

                      {isOpenItem && (
                        <div id={detailId} className="top-emp-detail">
                          <section
                            aria-labelledby={`type-heading-${emp.numero_empleado}`}
                          >
                            <h4
                              id={`type-heading-${emp.numero_empleado}`}
                              className="top-emp-modal__section-title"
                            >
                              Por tipo
                            </h4>
                            <div className="top-emp-modal__codes" role="list">
                              {Object.entries(emp.byCode)
                                .sort(([, a], [, b]) => b - a)
                                .map(([code, count]) => (
                                  <div
                                    key={code}
                                    className="top-emp-modal__code-item"
                                    role="listitem"
                                    aria-label={`${INCIDENCIA_LABELS[code] ?? code}: ${count}`}
                                  >
                                    <span className="top-emp-modal__code-badge">
                                      {code}
                                    </span>
                                    <span className="top-emp-modal__code-label">
                                      {INCIDENCIA_LABELS[code] ?? code}
                                    </span>
                                    <span className="top-emp-modal__code-count">
                                      {count}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </section>

                          <section
                            aria-labelledby={`month-heading-${emp.numero_empleado}`}
                          >
                            <h4
                              id={`month-heading-${emp.numero_empleado}`}
                              className="top-emp-modal__section-title"
                            >
                              Por mes
                            </h4>
                            <div className="top-emp-modal__months" role="list">
                              {Object.entries(emp.byMes)
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([mes, count]) => {
                                  const pct = Math.round(
                                    (count / emp.total) * 100,
                                  );
                                  return (
                                    <button
                                      key={mes}
                                      type="button"
                                      className="top-emp-modal__month-row top-emp-modal__month-row--btn"
                                      onClick={() =>
                                        setDrillDownMonth({
                                          empKey: emp.numero_empleado,
                                          mes,
                                        })
                                      }
                                      aria-label={`Ver días de ${formatMes(mes)}: ${count} incidencias`}
                                      data-testid={`month-drill-${emp.numero_empleado}-${mes}`}
                                    >
                                      <span className="top-emp-modal__month-name">
                                        {formatMes(mes)}
                                      </span>
                                      <div
                                        className="top-emp-modal__month-bar-wrap"
                                        aria-hidden="true"
                                      >
                                        <div
                                          className="top-emp-modal__month-bar"
                                          style={{
                                            width: `${pct}%`,
                                          }}
                                        />
                                      </div>
                                      <span className="top-emp-modal__month-count">
                                        {count}
                                      </span>
                                      <ChevronRight
                                        size={13}
                                        className="top-emp-month-chevron"
                                        aria-hidden="true"
                                      />
                                    </button>
                                  );
                                })}
                            </div>
                          </section>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}

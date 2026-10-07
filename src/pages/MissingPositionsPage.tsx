import { useEffect, useMemo, useRef } from 'react';
import { CircleAlertIcon, Star } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import type { PositionCoverage } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { workforceText } from '@/pages/workforce-translations';
import { useDismissedPositions } from '@/hooks/useDismissedPositions';
import './MissingPositionsPage.css';

interface MissingPositionsPageProps {
  onBack: () => void;
  coverage: PositionCoverage[];
}

interface MissingRow {
  pos: PositionCoverage;
  netPlantilla: number;
  netBackup: number;
  netStarlite: number;
  netTotal: number;
  proximos: number;
  proxPlantilla: number;
  proxBackup: number;
  proxExcedente: number;
}

/**
 * Descuenta los próximos ingresos (empleados ya dados de alta con fecha de
 * ingreso futura) de las vacantes: primero cubren la plantilla autorizada y
 * el remanente el buffer de backup. Así el reporte refleja YA cuánto bajará la
 * necesidad sin esperar a la fecha de ingreso.
 */
function netVacancies(pos: PositionCoverage): MissingRow {
  // Las vacantes netas ya vienen calculadas desde utils.ts (considerando proximos ingresos)
  const netPlantilla = pos.vacantes_plantilla;
  const netBackup = pos.vacantes_backup;
  const netStarlite = pos.vacantes_starlite;

  const netTotal = netPlantilla + netBackup + netStarlite;
  const proximos = pos.proximos_ingresos;

  // Para el desglose visual de a dónde se fueron los "próximos ingresos":
  // Calculamos cómo estaban las vacantes ANTES de los próximos ingresos,
  // y vemos la diferencia con las vacantes actuales.

  const urgentes = pos.urgentes ?? 0;
  const backup = pos.backup ?? 0;

  // Vacantes previas de Starlite
  const vacantesStarlitePrev = Math.max(0, urgentes - pos.starlite_empleados);
  const proxStarlite = vacantesStarlitePrev - netStarlite;
  const starliteSpilloverPrev = Math.max(0, pos.starlite_empleados - urgentes);

  const disponiblesPrev = pos.plantilla_real - pos.starlite_empleados + starliteSpilloverPrev;

  const vacantesPlantillaPrev = Math.max(0, pos.plantilla_autorizada - disponiblesPrev);
  const vacantesBackupPrev = Math.max(0, backup - Math.max(0, disponiblesPrev - pos.plantilla_autorizada));

  const proxPlantilla = vacantesPlantillaPrev - netPlantilla;
  const proxBackup = vacantesBackupPrev - netBackup;
  const proxExcedente = proximos - proxStarlite - proxPlantilla - proxBackup;

  return {
    pos,
    netPlantilla,
    netBackup,
    netStarlite,
    netTotal,
    proximos,
    proxPlantilla,
    proxBackup,
    proxExcedente
  };
}

export function MissingPositionsPage({
  onBack,
  coverage,
}: MissingPositionsPageProps) {
  const { language } = useLanguage();
  const t = (text: string) => workforceText(language, text);
  const { dismissedKeys, toggleDismiss } = useDismissedPositions();
  const titleRef = useRef<HTMLButtonElement>(null);

  // 1. Memoizamos la lista filtrada y ordenada para evitar recalcular en cada render
  const missingPositions = useMemo(() => {
    return coverage
      .map(netVacancies)
      .filter((r) => r.netTotal > 0)
      .sort((a, b) =>
        a.pos.area.localeCompare(b.pos.area) ||
        (a.pos.seccion || '').localeCompare(b.pos.seccion || '') ||
        a.pos.puesto.localeCompare(b.pos.puesto)
      );
  }, [coverage]);

  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <main className="missing-positions-page container" aria-labelledby="missing-positions-title">
      <header className="page-header">
        <div className="page-header__content">
          <h1 id="missing-positions-title" className="app-page-title">
            <button
              ref={titleRef}
              type="button"
              className="missing-positions-page__back-link"
              onClick={onBack}
              aria-label={`${t('Volver al resumen')}: ${t('Vacantes Pendientes')}`}
            >
              <CircleAlertIcon size={20} aria-hidden="true" />
              {t("Vacantes Pendientes")}
            </button>
          </h1>
        </div>
      </header>
      <div className="missing-positions-page__body">
        {missingPositions.length === 0 ? (
          <p className="missing-positions-page__empty">
            {t('Excelente, no hay puestos con falta de cobertura.')}
          </p>
        ) : (
          <section className="missing-positions-page__section">
            <div
              className="missing-positions-page__table-container"
              tabIndex={0}
              role="region"
              aria-label={t("Tabla de puestos faltantes")}
            >
              <table className="missing-positions-page__table">
                <colgroup>
                  <col className="missing-positions-page__position-column" />
                  <col className="missing-positions-page__metric-column" />
                  <col className="missing-positions-page__metric-column" />
                  <col className="missing-positions-page__metric-column" />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">{t('Puesto')}</th>
                    <th
                      scope="col"
                      className="missing-positions-page__num-col"
                    >
                      <Tooltip content={t("En plantilla")}>
                        <span>{t('Plantilla')}</span>
                      </Tooltip>
                    </th>
                    <th
                      scope="col"
                      className="missing-positions-page__num-col"
                    >
                      <Tooltip content={t("En backup")}>
                        <span>{t('Backup')}</span>
                      </Tooltip>
                    </th>
                    <th
                      scope="col"
                      className="missing-positions-page__num-col missing-positions-page__starlite-col"
                    >
                      <Tooltip content={t("Starlite")}>
                        <div className="missing-positions-page__starlite-label">
                          <Star size={12} className="missing-positions-page__starlite-icon" aria-hidden="true" />
                          Starlite
                        </div>
                      </Tooltip>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {missingPositions.map((r) => {
                    const pos = r.pos;

                    const faltanPlantilla = r.netPlantilla;
                    const faltanBackup = r.netBackup;

                    const rowKey = `${pos.area}-${pos.seccion || 'none'}-${pos.puesto}`;
                    const isDismissed = dismissedKeys.has(rowKey);

                    return (
                      <tr
                        key={rowKey}
                        className={isDismissed ? 'is-dismissed' : ''}
                        onClick={() => toggleDismiss(rowKey)}
                        title={isDismissed ? t('Click para incluir de nuevo en el conteo') : t('Click para excluir del conteo')}
                        aria-pressed={isDismissed}
                      >
                        <td>
                          <div className="missing-positions-page__puesto">
                            <span className="missing-positions-page__puesto-name">
                              {pos.puesto}
                            </span>
                            <span className="missing-positions-page__puesto-section">
                              {pos.seccion || pos.area}
                            </span>
                          </div>
                          {r.proximos > 0 && (
                            <div className="missing-positions-page__prox-details">
                              <Tooltip content={t("Cubiertas (ingreso futuro)")}>
                                <span className="missing-positions-page__puesto-note">
                                  −{r.proximos} {t(r.proximos === 1 ? 'PRÓXIMO INGRESO' : 'PRÓXIMOS INGRESOS')}
                                </span>
                              </Tooltip>
                              {(() => {
                                const starliteDisp = pos.starlite_proximos;
                                const regularDisp = Math.max(0, r.proximos - starliteDisp);

                                const plantillaDisp = Math.min(r.proxPlantilla, regularDisp);
                                const backupDisp = Math.min(r.proxBackup, regularDisp - plantillaDisp);
                                const excedenteDisp = Math.min(r.proxExcedente, regularDisp - plantillaDisp - backupDisp);

                                return (
                                  <span className="missing-positions-page__prox-breakdown">
                                    (
                                    {[
                                      starliteDisp > 0 ? `★ ${starliteDisp} Starlite` : null,
                                      plantillaDisp > 0 ? `${plantillaDisp} ${t('Plantilla')}` : null,
                                      backupDisp > 0 ? `${backupDisp} ${t('Backup')}` : null,
                                      excedenteDisp > 0 ? `${excedenteDisp} ${t('Excedente')}` : null,
                                    ].filter(Boolean).join(', ')}
                                    )
                                  </span>
                                );
                              })()}
                            </div>
                          )}
                        </td>
                        <td data-label={t('Plantilla')} className="missing-positions-page__num-col">
                          {faltanPlantilla > 0 ? (
                            <span className="missing-positions-page__count-badge missing-positions-page__count-badge--error">
                              {faltanPlantilla}
                            </span>
                          ) : (
                            <span className="missing-positions-page__count-empty" aria-label={t("Sin faltantes en plantilla")}>—</span>
                          )}
                        </td>
                        <td data-label={t('Backup')} className="missing-positions-page__num-col">
                          {faltanBackup > 0 ? (
                            <span className="missing-positions-page__count-badge missing-positions-page__count-badge--warning">
                              {faltanBackup}
                            </span>
                          ) : (
                            <span className="missing-positions-page__count-empty" aria-label={t("Sin faltantes en backup")}>—</span>
                          )}
                        </td>
                        <td data-label={t('Starlite')} className="missing-positions-page__num-col">
                          {r.netStarlite > 0 ? (
                            <span className="missing-positions-page__count-badge missing-positions-page__count-badge--starlite">
                              {r.netStarlite}
                            </span>
                          ) : (
                            <span className="missing-positions-page__count-empty" aria-label={t("Sin faltantes en starlite")}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

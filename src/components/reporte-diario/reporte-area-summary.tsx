import { useMemo, useState } from 'react';
import type { AreaDetailRow, AreaStaffSummary } from './types';
import { useReportLocale } from './useReportLocale';
import { PLANTILLA_AUTORIZADA } from '@/lib/constants';
import { Modal } from '@/components/ui/Modal';
import { SectionSummaryCard } from '@/components/ui/SectionSummaryCard';
import { useIsMobile } from '@/hooks/useIsMobile';
import { ReporteAreaDetailList } from './ReporteAreaDetailList';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ReporteAreaSummaryProps {
  areas: AreaStaffSummary[];
  selectedArea: string | null;
  onSelectArea: (area: string | null) => void;
  detailRows: AreaDetailRow[];
}

interface AreaGroup {
  area: string;
  sections: AreaStaffSummary[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_THRESHOLDS = { critical: 15, warning: 5 } as const;
const TREND_THRESHOLD = 10;

type StatusTone = 'muted' | 'error' | 'warning' | 'primary';

function getStatusTone(pct: number, hasIncidents: boolean): StatusTone {
  if (!hasIncidents) return 'muted';
  if (pct > STATUS_THRESHOLDS.critical) return 'error';
  if (pct > STATUS_THRESHOLDS.warning) return 'warning';
  return 'primary';
}

// ─── AreaCard Helper (Legacy data parsing for SectionSummaryCard) ────────────

function getAreaCardProps(area: AreaStaffSummary, en: boolean) {
  const active = area.operadores_autorizados > 0 ? area.operadores_contratados : area.personal_activo;
  const incidence = area.operadores_autorizados > 0 ? area.operadores_incidencia : area.personal_incidencia;
  const pct = active > 0 ? (incidence / active) * 100 : 0;

  const isDescanso = area.is_descanso;
  const isCriticalTrend = pct > TREND_THRESHOLD;
  const isClickable = incidence > 0;
  const statusTone = getStatusTone(pct, incidence > 0);
  const asistenciaValue = isDescanso ? (en ? 'Rest day' : 'Descanso') : Math.max(active - incidence, 0);

  const autorizado = area.operadores_autorizados > 0 ? area.operadores_autorizados : area.personal_autorizado;
  const contratados = area.operadores_autorizados > 0 ? area.operadores_contratados : area.personal_activo;

  // Solo mostramos el porcentaje de tendencia en áreas de Producción (Op. de Máquina)
  // EXCEPTO para Starlite, ya que no aplica la misma regla visual de tendencia.
  const isStarlite = area.area.includes('(STARLITE)');
  const showTrend = area.operadores_autorizados > 0 && !isStarlite;

  let displayName = area.area;
  if (displayName.includes('(STARLITE)')) {
    displayName = 'STARLITE';
  }

  return {
    name: displayName,
    autorizado,
    contratados,
    asistencia: asistenciaValue,
    incidence,
    pct: showTrend ? pct : 0,
    showTrend,
    isDescanso,
    isCriticalTrend: showTrend ? isCriticalTrend : false,
    isClickable,
    statusTone,
  };
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ReporteAreaSummary({ areas, selectedArea, onSelectArea, detailRows }: ReporteAreaSummaryProps) {
  const { en, copy } = useReportLocale();
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const isMobile = useIsMobile();

  // Mapa seccion → área padre derivado de PLANTILLA_AUTORIZADA
  const sectionAreaMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const pos of PLANTILLA_AUTORIZADA) {
      map.set(pos.seccion, pos.area);
    }
    return map;
  }, []);

  // Agrupa las secciones por su área padre y ordena internamente.
  // Los grupos con 1 sola sección se fusionan en "OTRAS ÁREAS" para
  // evitar filas de grid con espacios vacíos.
  const { mainGroups, otrasAreas } = useMemo(() => {
    const groups = new Map<string, AreaStaffSummary[]>();
    for (const sec of areas) {
      // Removemos sufijos como (STARLITE) para encontrar el área padre correcta en el mapa
      const normalizedSecArea = sec.area.replace(/\s*\([^)]*\)\s*$/i, '').trim();
      const parent = sectionAreaMap.get(normalizedSecArea) ?? sec.area;

      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent)!.push(sec);
    }

    const sorted = Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
      .map(([area, sections]) => ({
        area,
        sections: sections.sort((a, b) => a.area.localeCompare(b.area, 'es', { sensitivity: 'base' })),
      }));

    const main: AreaGroup[] = [];
    const singles: AreaStaffSummary[] = [];

    for (const g of sorted) {
      if (g.sections.length > 1) main.push(g);
      else singles.push(...g.sections);
    }

    return {
      mainGroups: main,
      otrasAreas: singles.sort((a, b) => a.area.localeCompare(b.area, 'es', { sensitivity: 'base' })),
    };
  }, [areas, sectionAreaMap]);

  const handleSelectArea = (area: string) => {
    if (selectedArea === area) {
      onSelectArea(null);
    } else {
      onSelectArea(area);
      setIsDetailOpen(true);
    }
  };

  if (areas.length === 0) return null;

  return (
    <section className="ras" aria-labelledby="ras-heading">
      {/* Grid agrupado por área */}
      <div className="ras__groups" role="list" aria-label={copy('Secciones de la plantilla', 'Workforce sections')}>
        {/* Grupos con varias secciones */}
        {mainGroups.map(({ area, sections }) => (
          <div key={area} className="ras__group" role="listitem">
            <h3 className="ras__group-label">
              <span>{area}</span>
              <span className="ras__group-count" aria-label={`${sections.length} ${copy('secciones', 'sections')}`}>
                {sections.length}
              </span>
            </h3>
            <div className="ras__grid" role="group" aria-label={`${copy('Secciones de', 'Sections of')} ${area}`}>
              {sections.map((sec) => (
                <SectionSummaryCard
                  key={sec.area}
                  {...getAreaCardProps(sec, en)}
                  isSelected={selectedArea === sec.area}
                  onClick={() => handleSelectArea(sec.area)}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Grupos de 1 sección → fusionados en "Otras Áreas" */}
        {otrasAreas.length > 0 && (
          <div className="ras__group" role="listitem">
            <h3 className="ras__group-label">
              <span>{copy('Otras Áreas', 'Other areas')}</span>
              <span className="ras__group-count" aria-label={`${otrasAreas.length} ${copy('secciones', 'sections')}`}>
                {otrasAreas.length}
              </span>
            </h3>
            <div
              className="ras__grid"
              role="group"
              aria-label={copy('Otras áreas de la plantilla', 'Other workforce areas')}
            >
              {otrasAreas.map((sec) => (
                <SectionSummaryCard
                  key={sec.area}
                  {...getAreaCardProps(sec, en)}
                  isSelected={selectedArea === sec.area}
                  onClick={() => handleSelectArea(sec.area)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal
        className="report-dialog report-area-detail-sheet"
        isOpen={isDetailOpen && selectedArea !== null}
        onClose={() => {
          setIsDetailOpen(false);
          onSelectArea(null);
        }}
        title={selectedArea || copy('Detalle de sección', 'Section details')}
        size="md"
        presentation={isMobile ? 'modal' : 'sheet'}
      >
        <ReporteAreaDetailList rows={detailRows} />
      </Modal>
    </section>
  );
}

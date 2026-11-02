import type { Language } from '@/contexts/LanguageContext';
import { formatReadableDate } from '@/lib/dates';
import type { PositionCoverage } from '@/lib/types';
import { toNaturalCase } from '@/lib/utils';
import { buildWhatsAppReportFromBlocks, formatWhatsAppLabel } from '@/lib/whatsappReport';
import { workforceText } from '@/pages/workforce-translations';

interface PendingVacancy {
  area: string;
  seccion: string;
  puesto: string;
  turno: string;
  general: number;
  starlite: number;
}

function extractTurno(seccion: string): string {
  const match = seccion.match(
    /\b(?:1ER|1RA|2DO|2DA|3ER|3RA|4TO|4TA|[1-9]O|[1-9]A|NOCTURNO|DIURNO|MATUTINO|VESPERTINO)\.?\s*TURNO\b/i,
  );
  return match ? match[0].toUpperCase().replace(/\s+/g, ' ').trim() : '';
}

function pendingVacancies(positions: PositionCoverage[]): PendingVacancy[] {
  return positions
    .map((position) => ({
      area: position.area,
      seccion: position.seccion,
      puesto: position.puesto,
      turno: extractTurno(position.seccion),
      general: Math.max(
        0,
        position.vacantes_plantilla +
          position.vacantes_backup -
          (position.proximos_ingresos - position.starlite_proximos),
      ),
      starlite: Math.max(0, position.urgentes - position.starlite_empleados - position.starlite_proximos),
    }))
    .filter((position) => position.general > 0 || position.starlite > 0)
    .sort(
      (left, right) =>
        left.area.localeCompare(right.area, 'es') ||
        left.seccion.localeCompare(right.seccion, 'es') ||
        left.puesto.localeCompare(right.puesto, 'es'),
    );
}

function projectBlocks(rows: PendingVacancy[], project: 'general' | 'starlite', language: Language): string[] {
  const byArea = new Map<string, string[]>();

  for (const row of rows) {
    const count = row[project];
    if (count === 0) continue;

    let puesto = formatWhatsAppLabel(row.puesto, language);
    if (project === 'starlite' && puesto.toLocaleLowerCase('es-MX').includes('operador de máquina')) {
      puesto = language === 'en' ? 'Starlite machine operator' : 'Operador de Starlite';
    }
    const turno = row.turno ? formatWhatsAppLabel(row.turno, language) : '';
    const label = [puesto, turno].filter(Boolean).join(' · ');
    const unit = workforceText(language, count === 1 ? 'vacante' : 'vacantes');
    const lines = byArea.get(row.area) ?? [];
    lines.push(`• ${label}: ${count} ${unit}`);
    byArea.set(row.area, lines);
  }

  const projectTitle = project === 'general' ? workforceText(language, 'General') : 'Starlite';
  return Array.from(byArea, ([area, lines]) => `*${projectTitle} · ${toNaturalCase(area)}*\n${lines.join('\n')}`);
}

/** Usa el mismo conteo del reporte anterior, sin asignaciones ni exclusiones manuales. */
export function buildWorkforceVacancyReport(positions: PositionCoverage[], language: Language): string {
  const rows = pendingVacancies(positions);
  const total = rows.reduce((sum, row) => sum + row.general + row.starlite, 0);
  const blocks = [...projectBlocks(rows, 'general', language), ...projectBlocks(rows, 'starlite', language)];
  const t = (text: string) => workforceText(language, text);

  return buildWhatsAppReportFromBlocks({
    title: t('Vacantes pendientes'),
    date: `${t('Corte')}: ${formatReadableDate(new Date().toISOString(), language === 'en' ? 'en-US' : 'es-MX')}`,
    total,
    totalLabel: t(total === 1 ? 'vacante' : 'vacantes'),
    blocks,
    emptyMessage: t('Sin vacantes pendientes.'),
  });
}

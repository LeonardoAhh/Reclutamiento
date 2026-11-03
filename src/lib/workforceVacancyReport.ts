import { formatReadableDate } from '@/lib/dates';
import type { PositionCoverage } from '@/lib/types';
import { normalizePuesto } from '@/lib/utils';
import { formatWhatsAppLabel } from '@/lib/whatsappReport';

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

interface VacancyGroupPresentation {
  title: string;
  role: string;
}

const POSITION_PRESENTATION_KEYS: Record<string, { title: string; role: string }> = {
  'OPERADOR DE ACABADOS GP-12': { title: 'Acabados GP-12', role: 'Operador' },
  'TECNICO DE TAMPOGRAFIA': { title: 'Tampografía', role: 'Técnico de Tampografía' },
  'OPERADOR DE MAQUINA': { title: 'Operador de Máquina', role: '' },
  'MONTADOR DE MOLDES': { title: 'Montador de Moldes', role: '' },
};

function positionPresentation(position: string, project: 'general' | 'starlite'): VacancyGroupPresentation {
  if (project === 'starlite') {
    return {
      title: 'Starlite',
      role: normalizePuesto(position) === 'OPERADOR DE MAQUINA' ? 'Operador' : formatWhatsAppLabel(position),
    };
  }

  const presentation = POSITION_PRESENTATION_KEYS[normalizePuesto(position)];
  if (!presentation) {
    return { title: formatWhatsAppLabel(position), role: '' };
  }

  return presentation;
}

function projectBlocks(rows: PendingVacancy[], project: 'general' | 'starlite'): string[] {
  const groupedLines = new Map<string, Map<string, number>>();

  for (const row of rows) {
    const count = row[project];
    if (count === 0) continue;

    const presentation = positionPresentation(row.puesto, project);
    const turno = row.turno ? formatWhatsAppLabel(row.turno) : '';
    const label = [presentation.role, turno].filter(Boolean).join(' · ');
    const lines = groupedLines.get(presentation.title) ?? new Map<string, number>();
    lines.set(label, (lines.get(label) ?? 0) + count);
    groupedLines.set(presentation.title, lines);
  }

  return Array.from(groupedLines, ([title, lines]) => {
    const items = Array.from(lines, ([label, count]) => {
      const unit = count === 1 ? 'vacante' : 'vacantes';
      return `• ${label ? `${label}: ` : ''}*${count} ${unit}*`;
    });
    return `*${title}*\n${items.join('\n')}`;
  });
}

/** Usa el mismo conteo del reporte anterior, sin asignaciones ni exclusiones manuales. */
export function buildWorkforceVacancyReport(positions: PositionCoverage[]): string {
  const rows = pendingVacancies(positions);
  const total = rows.reduce((sum, row) => sum + row.general + row.starlite, 0);
  const blocks = [...projectBlocks(rows, 'general'), ...projectBlocks(rows, 'starlite')];
  const totalLabel = total === 1 ? 'vacante' : 'vacantes';
  const updatedAt = formatReadableDate(new Date().toISOString(), 'es-MX', 'long');
  const header = ['*Vacantes abiertas*', `*Actualización: ${updatedAt}*`, `*Total: ${total} ${totalLabel}*`];

  return blocks.length > 0
    ? [...header, '', blocks.join('\n\n')].join('\n')
    : [...header, '', 'Sin vacantes pendientes.'].join('\n');
}

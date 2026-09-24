export const BAJA_REASON_CATALOG = {
  Renuncia: [
    'Mejorar Ingresos',
    'Mala relación con compañeros',
    'Dificultad de adaptación',
    'Falta de desarrollo profesional',
    'Mayor tiempo para estudiar',
    'Presiones de trabajo',
    'Temas familiares',
    'Problemas de Salud',
    'Mala relacion con el jefe inmediato',
    'Desacuerdo con alguna política de la empresa',
    'Falta de capacitación y motivación',
    'Matrimonio',
    'Cambio de actividad',
    'Otro',
    'Motivos Personales',
  ],
  'Bajas involuntarias': [
    'Bajo desempeño',
    'Termino de contrato',
    'Ausentismo',
  ],
} as const;

export function toBajaSentenceCase(value: string): string {
  const normalized = value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-MX');
  return normalized
    .replace(/(^|[.!?]\s+)(\p{L})/gu, (_, prefix: string, letter: string) =>
      prefix + letter.toLocaleUpperCase('es-MX'))
    .replace(/\bcsf\b/giu, 'CSF');
}

function normalizeCatalogLabel(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('es');
}

export function indicatorBajaType(type: string | null | undefined): string {
  const value = type?.trim() || 'Sin tipo de baja';
  return normalizeCatalogLabel(value) === 'rescision de contrato'
    ? 'Bajas involuntarias'
    : value;
}

export function findBajaType(type: string): string | null {
  const normalizedType = normalizeCatalogLabel(type);
  const catalogTypeInput = normalizedType === 'baja involuntaria' ? 'bajas involuntarias' : normalizedType;

  return Object.keys(BAJA_REASON_CATALOG).find(
    (catalogType) => normalizeCatalogLabel(catalogType) === catalogTypeInput,
  ) ?? null;
}

export function findBajaReason(type: string, reason: string): { type: string; reason: string } | null {
  const canonicalType = findBajaType(type);
  if (!canonicalType) return null;
  const normalizedReason = normalizeCatalogLabel(reason);

  for (const [catalogType, reasons] of Object.entries(BAJA_REASON_CATALOG)) {
    if (catalogType !== canonicalType) continue;
    const catalogReason = reasons.find((item) => normalizeCatalogLabel(item) === normalizedReason);
    return catalogReason ? { type: catalogType, reason: catalogReason } : null;
  }

  return null;
}

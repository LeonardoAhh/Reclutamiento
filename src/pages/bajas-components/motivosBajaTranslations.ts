import type { Language } from '@/contexts/LanguageContext';

const translations = {
  es: {
    title: 'Motivos de baja',
    register: 'Registrar',
    loadError: 'No se pudieron cargar los registros del indicador:',
    retry: 'Reintentar',
    monthlyDepartures: 'Bajas por mes',
    indicatorFilters: 'Filtros del indicador',
    year: 'Año',
    allYears: 'Todos los años',
    month: 'Mes',
    allMonths: 'Todos los meses',
    exitType: 'Tipo de baja',
    allTypes: 'Todos los tipos',
    noFilteredDepartures: 'No hay bajas para los filtros seleccionados.',
    distributionByType: 'Distribución por tipo',
    departure: 'baja',
    departures: 'bajas',
    noDeparturesForPeriod: 'No hay bajas para el periodo seleccionado.',
    reasons: 'Motivos de baja',
    noReasonsForFilters: 'No hay motivos para los filtros seleccionados.',
    chartLabel: 'Bajas por mes:',
    chartTrend: 'La línea discontinua muestra la tendencia lineal del periodo.',
    chartNeedsMonths: 'Se necesitan al menos dos meses para mostrar una tendencia.',
    trend: 'Tendencia',
    monthlySeries: 'Bajas mensuales',
    captureTitle: 'Registrar baja',
    cancel: 'Cancelar',
    save: 'Guardar',
    saving: 'Guardando…',
    employeeNumber: 'No. empleado',
    invalidEmployee: 'Escribe un número de empleado de hasta 4 dígitos.',
    date: 'Fecha de baja',
    datePlaceholder: 'DD/MM/AAAA',
    invalidDate: 'Escribe una fecha válida en formato DD/MM/AAAA.',
    type: 'Tipo de baja',
    selectType: 'Seleccionar tipo',
    reason: 'Motivo de baja',
    selectReason: 'Seleccionar motivo',
    detail: 'Detalle de la baja',
    invalidRecord: 'Los datos de la baja no son válidos.',
    requiredFields: 'Captura número de empleado, fecha, tipo y motivo de baja.',
    employeeDigits: 'El número de empleado debe tener hasta 4 dígitos.',
    validDate: 'Captura una fecha de baja válida.',
    validType: 'Selecciona un tipo de baja válido.',
    matchingReason: 'Selecciona un motivo de baja que corresponda al tipo indicado.',
    duplicateEmployee: 'Este número de empleado ya está en el indicador. No se modificó su registro.',
    added: 'Motivo agregado al indicador',
    employeeColumn: 'Número de empleado',
    typeColumn: 'Tipo de baja',
    reasonColumn: 'Motivo de baja',
    detailColumn: 'Detalle de la baja',
    unclassified: 'Sin clasificar',
    noDetail: 'Sin detalle registrado.',
    pagination: 'Paginación de bajas por motivo',
  },
  en: {
    title: 'Reasons for leaving',
    register: 'Add record',
    loadError: 'Could not load indicator records:',
    retry: 'Retry',
    monthlyDepartures: 'Departures by month',
    indicatorFilters: 'Indicator filters',
    year: 'Year',
    allYears: 'All years',
    month: 'Month',
    allMonths: 'All months',
    exitType: 'Departure type',
    allTypes: 'All types',
    noFilteredDepartures: 'No departures match the selected filters.',
    distributionByType: 'Distribution by type',
    departure: 'departure',
    departures: 'departures',
    noDeparturesForPeriod: 'There are no departures for the selected period.',
    reasons: 'Reasons for leaving',
    noReasonsForFilters: 'There are no reasons for the selected filters.',
    chartLabel: 'Departures by month:',
    chartTrend: 'The dashed line shows the linear trend for the period.',
    chartNeedsMonths: 'At least two months are needed to show a trend.',
    trend: 'Trend',
    monthlySeries: 'Monthly departures',
    captureTitle: 'Register departure',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving…',
    employeeNumber: 'Employee no.',
    invalidEmployee: 'Enter an employee number of up to 4 digits.',
    date: 'Departure date',
    datePlaceholder: 'DD/MM/YYYY',
    invalidDate: 'Enter a valid date in DD/MM/YYYY format.',
    type: 'Departure type',
    selectType: 'Select type',
    reason: 'Reason for leaving',
    selectReason: 'Select reason',
    detail: 'Departure details',
    invalidRecord: 'The departure data is invalid.',
    requiredFields: 'Enter the employee number, date, type, and reason.',
    employeeDigits: 'The employee number must have up to 4 digits.',
    validDate: 'Enter a valid departure date.',
    validType: 'Select a valid departure type.',
    matchingReason: 'Select a reason that matches the chosen type.',
    duplicateEmployee: 'This employee number is already in the indicator. The record was not changed.',
    added: 'Reason added to the indicator',
    employeeColumn: 'Employee number',
    typeColumn: 'Departure type',
    reasonColumn: 'Reason for leaving',
    detailColumn: 'Departure details',
    unclassified: 'Unclassified',
    noDetail: 'No details recorded.',
    pagination: 'Departure reason pagination',
  },
} as const;

const catalogLabels: Readonly<Record<string, string>> = {
  Renuncia: 'Resignation',
  'Bajas involuntarias': 'Involuntary separation',
  'Mejorar Ingresos': 'Better income',
  'Mala relación con compañeros': 'Poor relationship with coworkers',
  'Dificultad de adaptación': 'Difficulty adapting',
  'Falta de desarrollo profesional': 'Lack of professional development',
  'Mayor tiempo para estudiar': 'More time to study',
  'Presiones de trabajo': 'Work pressure',
  'Temas familiares': 'Family matters',
  'Problemas de Salud': 'Health issues',
  'Mala relacion con el jefe inmediato': 'Poor relationship with direct supervisor',
  'Desacuerdo con alguna política de la empresa': 'Disagreement with a company policy',
  'Falta de capacitación y motivación': 'Lack of training and motivation',
  Matrimonio: 'Marriage',
  'Cambio de actividad': 'Change of occupation',
  Otro: 'Other',
  'Motivos Personales': 'Personal reasons',
  'Bajo desempeño': 'Poor performance',
  'Termino de contrato': 'End of contract',
  Ausentismo: 'Absenteeism',
};

const validationMessages: Readonly<Record<string, keyof typeof translations.en>> = {
  'Los datos de la baja no son válidos.': 'invalidRecord',
  'Captura número de empleado, fecha, tipo y motivo de baja.': 'requiredFields',
  'El número de empleado debe tener hasta 4 dígitos.': 'employeeDigits',
  'Captura una fecha de baja válida.': 'validDate',
  'Selecciona un tipo de baja válido.': 'validType',
  'Selecciona un motivo de baja que corresponda al tipo indicado.': 'matchingReason',
};

export function getMotivosBajaCopy(language: Language) {
  return translations[language];
}

function normalizeCatalogLabel(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('es');
}

export function translateBajaCatalogLabel(value: string, language: Language): string {
  if (language === 'es') return value;
  const normalizedValue = normalizeCatalogLabel(value);
  const match = Object.entries(catalogLabels).find(
    ([label]) => normalizeCatalogLabel(label) === normalizedValue,
  );
  return match?.[1] ?? value;
}

export function translateBajaValidationMessage(message: string, language: Language): string {
  const key = validationMessages[message];
  return key ? translations[language][key] : message;
}

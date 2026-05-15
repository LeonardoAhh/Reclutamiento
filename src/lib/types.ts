/**
 * Employee data types for the Reclutamiento system
 */

export interface Employee {
  id?: string;
  num_empleado: string;
  nombre: string;
  area: string;
  seccion: string;
  puesto: string;
  categoria: string;
  turno: string;
  fecha_ingreso: string;
  /** True si el empleado está actualmente en incapacidad médica. */
  en_incapacidad?: boolean;
  /** Fecha estimada de regreso (ISO `YYYY-MM-DD`) o null si indefinida. */
  incapacidad_hasta?: string | null;
}

/**
 * Empleado dado de baja. Vive en su propia tabla `bajas` para no perder el
 * histórico cuando el empleado deja de existir en `empleados`.
 */
export interface Baja {
  id?: string;
  num_empleado: string;
  nombre: string;
  area: string;
  seccion: string;
  puesto: string;
  /** `YYYY-MM-DD` */
  fecha_ingreso: string;
  /** `YYYY-MM-DD` */
  fecha_baja: string;
  tipo_baja: string;
  motivo_baja: string;
  /**
   * Marca explícita del usuario indicando que la vacante se cubrió (ej. por
   * promoción interna o transferencia). Si está en `true`, la baja cuenta
   * como cubierta en el reporte sin importar si hubo un hire externo.
   */
  cubierta_manual?: boolean;
  /** Fecha (YYYY-MM-DD) en que se cubrió manualmente la vacante. */
  cubierta_fecha?: string | null;
  /** Nota libre: “promovido X”, “transferido de Almacén”, etc. */
  cubierta_nota?: string | null;
}

/** Forma cruda del JSON de bajas (claves con espacios al final permitidas). */
export interface BajaRaw {
  'Num Empleado'?: string;
  Nombre?: string;
  Area?: string;
  Seccion?: string;
  Puesto?: string;
  'Fecha Ingreso'?: string;
  'Fecha Baja'?: string;
  'Tipo de Baja'?: string;
  'Motivo de Baja'?: string;
  [key: string]: string | undefined;
}

/**
 * Raw JSON shape from the import file
 */
export interface EmployeeRaw {
  "Num Empleado": string;
  "Nombre": string;
  "Area": string;
  "Seccion": string;
  "Puesto": string;
  "Categoria": string;
  "Turno": string;
  "Fecha Ingreso": string;
}

/**
 * Optional flags that can be attached to an authorized position.
 * Configurable in `src/lib/constants.ts`.
 */
export interface PositionConfig {
  /**
   * Número de contrataciones urgentes pendientes para este puesto.
   * El badge "URGEN N" se muestra cuando N > 0. Es independiente de las
   * vacantes — puede usarse para cubrir back-up (excedentes intencionales)
   * o vacantes regulares; lo que importa es la prioridad de reclutamiento.
   */
  urgentes?: number;
  /**
   * Excedentes intencionales que se mantienen como respaldo de plantilla.
   * Si `plantilla_real - plantilla_autorizada <= backup`, el excedente se
   * etiqueta como "BACK-UP" (no como problema). Lo que exceda este buffer
   * se reporta como excedente real.
   */
  backup?: number;
  /** Nota interna opcional explicando el back-up o la urgencia. */
  notas?: string;
  /**
   * Sueldo base mensual del puesto, en MXN. Si se define, la requisición
   * lo pre-llena automáticamente; si se omite, queda en blanco para
   * captura manual del reclutador.
   */
  sueldo?: number;
  /**
   * Si el puesto tiene bono asociado. Si se define, la requisición
   * muestra "Sí" / "No" como valor pre-llenado en lugar de las casillas
   * en blanco para marcar a mano.
   */
  bono?: boolean;
  /**
   * Monto del bono mensual, en MXN. Solo aplica cuando `bono === true`.
   * Si se define, la requisición lo pre-llena automáticamente.
   */
  bono_monto?: number;
}

/**
 * Authorized headcount definition per position
 */
export interface AuthorizedPosition extends PositionConfig {
  area: string;
  seccion: string;
  puesto: string;
  plantilla_autorizada: number;
}

/**
 * Puesto creado en tiempo de ejecución desde la UI (ej. al promover a un
 * empleado a un puesto que aún no aparece en `PLANTILLA_AUTORIZADA`). Se
 * persiste en la tabla `custom_positions` de Supabase y se fusiona con la
 * lista estática para alimentar selectores en Dashboard, Vacantes,
 * Pipeline y formularios relacionados.
 */
export interface CustomPosition {
  id?: string;
  area: string;
  seccion: string;
  puesto: string;
  plantilla_autorizada: number;
  notas?: string | null;
  created_by?: string | null;
  created_at?: string;
}

/**
 * Catálogo de habilidades requeridas por puesto. Se usa para pre-llenar el
 * bloque "Habilidades requeridas" de la requisición. La búsqueda usa la
 * tripleta (área, sección, puesto) como clave compuesta, con normalización
 * de acentos y sufijo de turno (A/B/C/D) — igual que la lookup de bono.
 *
 * Si un puesto no tiene entrada aquí, la requisición deja el bloque en
 * blanco para captura manual del reclutador.
 */
export interface PuestoHabilidades {
  area: string;
  seccion: string;
  puesto: string;
  /** Conocimientos técnicos, sistemas, herramientas. */
  habilidades?: string;
  /** Nivel académico mínimo o deseable. */
  escolaridad?: string;
  /** Experiencia mínima requerida. */
  experiencia?: string;
}

/**
 * Comment/note for a position's recruitment process
 */
export interface PositionComment {
  id?: string;
  area: string;
  seccion: string;
  puesto: string;
  comentario: string;
  tipo: 'proceso_activo' | 'entrevista' | 'entrega_documentos' | 'otro';
  fecha: string;
  autor?: string;
}

/**
 * Computed coverage data for dashboard display
 */
export interface PositionCoverage {
  area: string;
  seccion: string;
  puesto: string;
  plantilla_autorizada: number;
  /**
   * Plantilla objetivo total: `plantilla_autorizada + backup`. Es el
   * denominador del % de cobertura y la base para el conteo de vacantes.
   * Para puestos sin backup definido, `plantilla_objetivo === plantilla_autorizada`.
   */
  plantilla_objetivo: number;
  plantilla_real: number;
  vacantes: number;
  porcentaje_cobertura: number;
  comentarios: PositionComment[];
  /** Flags propagados desde la PLANTILLA_AUTORIZADA. */
  urgentes: number;
  backup: number;
  notas?: string;
  /** Excedente total: real - autorizada (>= 0). */
  excedente: number;
  /** Porción del excedente cubierta por el buffer `backup`. */
  excedente_backup: number;
  /** Excedente real fuera del buffer — requiere atención. */
  excedente_critico: number;
}

/**
 * Department-level aggregated coverage
 */
export interface DepartmentCoverage {
  area: string;
  plantilla_autorizada: number;
  /** Suma de `plantilla_objetivo` (autorizada + backup) de todos los puestos del área. */
  plantilla_objetivo: number;
  plantilla_real: number;
  vacantes: number;
  porcentaje_cobertura: number;
  puestos: PositionCoverage[];
  /** Suma de contrataciones urgentes pendientes a través de todos los puestos. */
  urgentes: number;
}

/* ────────────────────────────────────────────────────────────────────────
 * Pipeline de candidatos (tabla `candidates` + `candidate_notes`)
 * ──────────────────────────────────────────────────────────────────────── */

/**
 * Status activos del pipeline de candidatos. El flujo se simplificó a 4
 * etapas: Entrevista 1, Entrevista 2 (procesos en curso), y los terminales
 * Contratado / Rechazado.
 *
 * La data histórica pudo guardar valores ya retirados (`aplico`,
 * `revision`, `oferta`). Esos se normalizan al leer mediante
 * `normalizeCandidateStatus` — nunca se exponen al resto de la app.
 */
export const CANDIDATE_STATUSES = [
  'entrevista_1',
  'entrevista_2',
  'contratado',
  'rechazado',
] as const;

export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number];

/** Labels en español para UI. */
export const CANDIDATE_STATUS_LABEL: Record<CandidateStatus, string> = {
  entrevista_1: 'Entrevista 1',
  entrevista_2: 'Entrevista 2',
  contratado: 'Contratado',
  rechazado: 'Rechazado',
};

/**
 * Mapa de status legados → status actuales. Solo se usa al leer data
 * persistida (Supabase / localStorage) para tolerar registros viejos.
 */
const LEGACY_CANDIDATE_STATUS_MAP: Record<string, CandidateStatus> = {
  aplico: 'entrevista_1',
  revision: 'entrevista_1',
  oferta: 'entrevista_2',
};

/**
 * Normaliza cualquier valor de status crudo (incluyendo legados) al
 * conjunto actual de 4 status. Si el valor no es reconocible, regresa
 * 'entrevista_1' como fallback seguro — nunca lanza.
 */
export function normalizeCandidateStatus(raw: unknown): CandidateStatus {
  const value = String(raw ?? '').trim().toLowerCase();
  if ((CANDIDATE_STATUSES as readonly string[]).includes(value)) {
    return value as CandidateStatus;
  }
  return LEGACY_CANDIDATE_STATUS_MAP[value] ?? 'entrevista_1';
}

export interface Candidate {
  id?: string;
  nombre: string;
  telefono?: string | null;
  email?: string | null;
  cv_url?: string | null;
  source?: string | null;
  puesto: string;
  area: string;
  seccion?: string | null;
  status: CandidateStatus;
  reclutador?: string | null;
  fecha_aplicacion?: string;
  notas?: string | null;
  /**
   * Num. de empleado generado al convertir al candidato en empleado.
   * Null mientras no se haya hecho la conversion. PR F.
   */
  employee_num?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CandidateNote {
  id?: string;
  candidate_id: string;
  autor?: string | null;
  texto: string;
  created_at?: string;
}

/* ────────────────────────────────────────────────────────────────────────
 * Vacancy lifecycle (tabla `vacancy_requests` + `vacancy_status_history`)
 * ──────────────────────────────────────────────────────────────────────── */

export const VACANCY_STATUSES = [
  'abierta',
  'en_proceso',
  'pausa',
  'cubierta',
  'cancelada',
] as const;

export type VacancyStatus = (typeof VACANCY_STATUSES)[number];

export const VACANCY_STATUS_LABEL: Record<VacancyStatus, string> = {
  abierta: 'Abierta',
  en_proceso: 'En proceso',
  pausa: 'Pausa',
  cubierta: 'Cubierta',
  cancelada: 'Cancelada',
};

export const VACANCY_PRIORITIES = ['alta', 'media', 'baja'] as const;
export type VacancyPriority = (typeof VACANCY_PRIORITIES)[number];

export const VACANCY_PRIORITY_LABEL: Record<VacancyPriority, string> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};

export interface VacancyRequest {
  id?: string;
  puesto: string;
  area: string;
  seccion?: string | null;
  fecha_apertura?: string;
  fecha_objetivo?: string | null;
  fecha_cubierta?: string | null;
  reclutador_asignado?: string | null;
  fuente_planeada?: string | null;
  status: VacancyStatus;
  prioridad: VacancyPriority;
  justificacion?: string | null;
  /**
   * SLA en dias para cubrir la vacante. Default 10. PR G.
   */
  dias_sla?: number | null;
  /**
   * Si true, la vacante NO cuenta en los KPIs de SLA / time-to-fill.
   * Util cuando el responsable del area no le dio seguimiento, la vacante
   * fue pausada por gerencia, o el recurso fue reasignado. PR G.
   */
  excluida_indicador?: boolean | null;
  /**
   * Razon por la que la vacante esta excluida del indicador. PR G.
   */
  motivo_exclusion?: string | null;
  created_at?: string;
  updated_at?: string;
}

/** Motivos comunes para excluir una vacante del indicador (KPI). */
export const VACANCY_EXCLUSION_REASONS = [
  'Sin seguimiento del área',
  'Pausada por gerencia',
  'Recurso reasignado',
  'Cancelada por presupuesto',
  'Otro',
] as const;

/** Default SLA en dias para cubrir una vacante recien aperturada. */
export const DEFAULT_VACANCY_SLA_DAYS = 10;

export interface VacancyStatusHistoryEntry {
  id?: string;
  vacancy_id: string;
  from_status?: VacancyStatus | null;
  to_status: VacancyStatus;
  changed_by?: string | null;
  reason?: string | null;
  changed_at?: string;
}


export const CANDIDATE_SOURCES = [
  'LinkedIn',
  'Indeed',
  'OCC',
  'Computrabajo',
  'Referido',
  'Facebook',
  'Pauta',
  'Volanteo',
] as const;

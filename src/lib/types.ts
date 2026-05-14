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

export const CANDIDATE_STATUSES = [
  'aplico',
  'revision',
  'entrevista_1',
  'entrevista_2',
  'oferta',
  'contratado',
  'rechazado',
] as const;

export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number];

/** Labels en español para UI. */
export const CANDIDATE_STATUS_LABEL: Record<CandidateStatus, string> = {
  aplico: 'Aplicó',
  revision: 'Revisión',
  entrevista_1: 'Entrevista 1',
  entrevista_2: 'Entrevista 2',
  oferta: 'Oferta',
  contratado: 'Contratado',
  rechazado: 'Rechazado',
};

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
  'Walk-in',
  'Facebook',
  'TikTok Jobs',
  'Bolsa de trabajo',
  'Computrabajo',
] as const;

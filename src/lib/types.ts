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

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
 * Authorized headcount definition per position
 */
export interface AuthorizedPosition {
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
}

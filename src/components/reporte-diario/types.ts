import type { INCIDENT_TABS } from "./constants"

export type IncidentTab = (typeof INCIDENT_TABS)[number]

export type MexicoHolidayRule =
    | { label: string; month: number; day: number; fixed: true }
    | { label: string; month: number; weekday: number; occurrence: number }

/** Resumen de personal por sección para el grid del Reporte Diario */
export interface AreaStaffSummary {
    /** Nombre de la sección (ej. 'PRODUCCIÓN 1ER. TURNO') */
    area: string
    personal_autorizado: number
    personal_activo: number
    personal_incidencia: number
    personal_real: number
    operadores_autorizados: number
    operadores_contratados: number
    operadores_incidencia: number
    is_descanso?: boolean
}

export interface ReporteRow {
    mes: string
    numero_empleado: string
    nombre: string
    departamento: string
    area: string
    puesto?: string
    turno?: string
    days: Record<string, string>
}

export interface EmployeeRef {
    key: string
    numero_empleado: string
    nombre: string
    departamento: string
    area: string
    turno: string
}

export interface AreaDetailRow extends EmployeeRef {
    puesto?: string
    tipo_incidencia: string
}

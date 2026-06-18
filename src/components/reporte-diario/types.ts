import type { INCIDENT_TABS, AREA_STAFF } from "./constants"

export type IncidentTab = (typeof INCIDENT_TABS)[number]

export type MexicoHolidayRule =
    | { label: string; month: number; day: number; fixed: true }
    | { label: string; month: number; weekday: number; occurrence: number }

export type AreaStaffDefinition = (typeof AREA_STAFF)[number]

export type AreaStaffSummary = AreaStaffDefinition & {
    personal_activo: number
    personal_incidencia: number
    personal_real: number
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

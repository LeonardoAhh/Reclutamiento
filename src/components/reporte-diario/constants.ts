import type { MexicoHolidayRule } from "./types"
import { PLANTILLA_AUTORIZADA } from "@/lib/constants"

export const INCIDENCIA_LABELS: Record<string, string> = {
    "-": "No contratado",
    A: "Asistencia",
    F: "Falta injustificada",
    DF: "Día festivo",
    FJ: "Faltas just.",
    S: "Sanción",
    P: "Permiso",
    CT: "Cambio turno",
    I: "Incapacidad",
    V: "Vacación",
    TXT: "T. por tiempo",
    D: "Descanso",
    PH: "Permiso horas",
    X: "Sin incidencia",
}

export const INCIDENT_TABS = [
    "F", "FJ", "S", "P", "CT", "I", "V", "TXT", "PH",
] as const

export const MEXICO_HOLIDAY_RULES: readonly MexicoHolidayRule[] = [
    { label: "Año Nuevo", month: 0, day: 1, fixed: true },
    { label: "Día de la Constitución", month: 1, weekday: 1, occurrence: 1 },
    { label: "Benito Juárez", month: 2, weekday: 1, occurrence: 3 },
    { label: "Día del Trabajo", month: 4, day: 1, fixed: true },
    { label: "Independencia", month: 8, day: 16, fixed: true },
    { label: "Revolución", month: 10, weekday: 1, occurrence: 3 },
    { label: "Navidad", month: 11, day: 25, fixed: true },
    { label: "Dia de las madres", month: 4, day: 10, fixed: true },
]

// ── Compatibilidad con código que aún usa AREA_STAFF ──────────────────────────
// Se mantiene solo como alias; la fuente de verdad es PLANTILLA_AUTORIZADA.
export const AREA_STAFF = [
    { area: "A. CALIDAD 1ER TURNO", personal_autorizado: 22 },
    { area: "A. CALIDAD 2DO. TURNO", personal_autorizado: 22 },
    { area: "CALIDAD ADMTVO", personal_autorizado: 21 },
    { area: "PRODUCCIÓN 1ER. TURNO", personal_autorizado: 32 },
    { area: "PRODUCCIÓN 2o. TURNO", personal_autorizado: 32 },
    { area: "PRODUCCIÓN 3ER. TURNO", personal_autorizado: 32 },
    { area: "PRODUCCIÓN 4o. TURNO", personal_autorizado: 32 },
] as const

export const ALLOWED_PUESTOS = new Set([
    "OPERADOR DE ACABADOS GP-12 A",
    "OPERADOR DE ACABADOS GP-12 B",
    "OPERADOR DE ACABADOS GP-12 C",
    "OPERADOR DE ACABADOS GP-12 D",
    "OPERADOR DE MÁQUINA A",
    "OPERADOR DE MÁQUINA B",
    "OPERADOR DE MÁQUINA C",
    "OPERADOR DE MÁQUINA D",
    "AUXILIAR DE CALIDAD",
    "INGENIERO DE CALIDAD A,",
    "INGENIERO DE CALIDAD B",
    "INGENIERO DE CALIDAD C",
    "INGENIERO DE CALIDAD D",
    "INSPECTOR DE CALIDAD A",
    "INSPECTOR DE CALIDAD B",
    "INSPECTOR DE CALIDAD C",
    "INSPECTOR DE CALIDAD D",
    "SUPERVISOR DE ACABADOS - GP12 A",
    "SUPERVISOR DE ACABADOS - GP12 B",
    "SUPERVISOR DE ACABADOS - GP12 C",
    "SUPERVISOR DE ACABADOS - GP12 D",
    "INSPECTOR RECIBO",
])

export const NON_INCIDENT_CODES = new Set(["-", "X", "A", "D", "DF", "B"])

// ── SECTION_CONFIGS: secciones únicas derivadas de PLANTILLA_AUTORIZADA ───────
// Cada entrada = una sección de la plantilla con su headcount total sumado.
// Ésta es la fuente canónica para el grid de secciones del Reporte Diario.

export interface SectionConfig {
    /** Área padre (ej. 'PRODUCCIÓN') */
    area: string
    /** Nombre de la sección (ej. 'PRODUCCIÓN 1ER. TURNO') */
    seccion: string
    /** Suma de plantilla_autorizada de todos los puestos de la sección */
    personal_autorizado: number
}

export const SECTION_CONFIGS: SectionConfig[] = (() => {
    const map = new Map<string, SectionConfig>()
    for (const pos of PLANTILLA_AUTORIZADA) {
        const existing = map.get(pos.seccion)
        if (existing) {
            existing.personal_autorizado += pos.plantilla_autorizada
        } else {
            map.set(pos.seccion, {
                area: pos.area,
                seccion: pos.seccion,
                personal_autorizado: pos.plantilla_autorizada,
            })
        }
    }
    return Array.from(map.values())
})()

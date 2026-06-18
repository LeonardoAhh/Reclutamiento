import { MEXICO_HOLIDAY_RULES, NON_INCIDENT_CODES, INCIDENT_TABS } from "./constants"
import type { ReporteRow, IncidentTab } from "./types"

export function isIncidence(code: string | undefined): boolean {
    return !!code && !NON_INCIDENT_CODES.has(code)
}

export function isIncidentTab(code: string): code is IncidentTab {
    return (INCIDENT_TABS as readonly string[]).includes(code)
}

export function getNthWeekdayOfMonth(year: number, month: number, weekday: number, occurrence: number) {
    const date = new Date(year, month, 1)
    let count = 0
    while (date.getMonth() === month) {
        if (date.getDay() === weekday) {
            count += 1
            if (count === occurrence) return new Date(date)
        }
        date.setDate(date.getDate() + 1)
    }
    return null
}

export function getMexicoHolidayLabels(year: number) {
    return MEXICO_HOLIDAY_RULES.reduce<Record<string, string>>((acc, rule) => {
        if ("fixed" in rule) {
            const key = `${String(rule.month + 1).padStart(2, "0")}-${String(rule.day).padStart(2, "0")}`
            acc[key] = rule.label
            return acc
        }

        const holiday = getNthWeekdayOfMonth(year, rule.month, rule.weekday, rule.occurrence)
        if (holiday) {
            const key = `${String(holiday.getMonth() + 1).padStart(2, "0")}-${String(holiday.getDate()).padStart(2, "0")}`
            acc[key] = rule.label
        }
        return acc
    }, {})
}

const MONTH_NAMES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

export function formatMes(ym: string) {
    const [year, month] = ym.split("-")
    return `${MONTH_NAMES[parseInt(month, 10) - 1] ?? month} ${year}`
}

export function daysInMonth(ym: string) {
    const [year, month] = ym.split("-").map(Number)
    return new Date(year, month, 0).getDate()
}

function normalizeString(value: unknown) {
    if (typeof value !== "string") return ""
    return value.trim()
}

export function parseReporteJSON(raw: unknown[]): { rows: ReporteRow[]; errors: string[] } {
    const rows: ReporteRow[] = []
    const errors: string[] = []

    raw.forEach((item, index) => {
        if (typeof item !== "object" || item === null) {
            errors.push(`Elemento ${index + 1} no es un objeto válido`)
            return
        }

        // Normaliza llaves: recorta espacios al inicio/fin (ej. Excel exporta
        // "mes " o "área " con espacios) para que el mapeo sea tolerante.
        const rawRow = item as Record<string, unknown>
        const row: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(rawRow)) row[k.trim()] = v

        const mes = normalizeString(row.mes)
        const numero_empleado = normalizeString(row.numero_empleado)
        const nombre = normalizeString(row.nombre)
        const departamento = normalizeString(row.departamento)
        const area = normalizeString(row.area ?? row["área"])
        const puesto = normalizeString(row.puesto)
        const turno = normalizeString(row.turno)

        // Ignoramos la fila si es un encabezado repetido del Excel
        if (mes.toLowerCase() === "mes" && numero_empleado.toLowerCase() === "numero_empleado") {
            return
        }

        if (!mes || !/^\d{4}-\d{2}$/.test(mes)) { errors.push(`Fila ${index + 1}: mes inválido, use YYYY-MM`); return }
        if (!numero_empleado) { errors.push(`Fila ${index + 1}: falta numero_empleado`); return }
        if (!nombre) { errors.push(`Fila ${index + 1}: falta nombre`); return }
        if (!departamento) { errors.push(`Fila ${index + 1}: falta departamento`); return }
        if (!area) { errors.push(`Fila ${index + 1}: falta área`); return }

        const days: Record<string, string> = {}

        // Support both formats:
        // 1. Flat (from JSON file): { "01": "A", "02": "F", ... }
        // 2. Nested (from Supabase): { days: { "01": "A", "02": "F", ... } }
        const daysSource = (typeof row.days === "object" && row.days !== null && !Array.isArray(row.days))
            ? row.days as Record<string, unknown>
            : row

        Object.entries(daysSource).forEach(([key, value]) => {
            if (!/^\d{2}$/.test(key)) return
            days[key] = normalizeString(value) || ""
        })

        rows.push({ mes, numero_empleado, nombre, departamento, area, puesto, turno, days })
    })

    return { rows, errors }
}

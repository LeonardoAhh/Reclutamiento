import { INCIDENT_TABS, NON_INCIDENT_CODES } from "./constants"
import { parseReporteJSON } from "./helpers"
import type { ReporteRow, IncidentTab } from "./types"

// Codes treated as "ausentismo" puro (no asistencia, no descanso, no festivo)
// Aligned with the existing pct_ausentismo definition in index.tsx (F + P + I).
export const AUSENTISMO_CODES = new Set<string>(["F", "P", "I"])

// Codes considered "incidencias" of any kind (everything that is not asistencia,
// descanso, festivo, no-contrato o sin-incidencia).
export function isReportedIncidence(code: string | undefined): boolean {
    return !!code && !NON_INCIDENT_CODES.has(code)
}

export function isAusentismoCode(code: string | undefined): boolean {
    return !!code && AUSENTISMO_CODES.has(code)
}

export interface DateKey {
    /** YYYY-MM-DD, in Mexico City local time */
    iso: string
    /** YYYY-MM */
    mes: string
    /** "01".."31" */
    day: string
    /** native Date at 00:00 local */
    date: Date
}

const TIME_ZONE = "America/Mexico_City"

function pad2(n: number): string {
    return n < 10 ? `0${n}` : String(n)
}

/** Today, in Mexico City timezone, anchored at 00:00. */
export function todayInMexico(): Date {
    const now = new Date()
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(now)
    const y = parts.find((p) => p.type === "year")!.value
    const m = parts.find((p) => p.type === "month")!.value
    const d = parts.find((p) => p.type === "day")!.value
    return new Date(`${y}-${m}-${d}T00:00:00`)
}

export function buildDateKey(date: Date): DateKey {
    const y = date.getFullYear()
    const m = pad2(date.getMonth() + 1)
    const d = pad2(date.getDate())
    return {
        iso: `${y}-${m}-${d}`,
        mes: `${y}-${m}`,
        day: d,
        date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
    }
}

/** Return an inclusive list of DateKeys between `from` and `to` (both anchored at 00:00 local). */
export function enumerateDateRange(from: Date, to: Date): DateKey[] {
    if (from.getTime() > to.getTime()) return []
    const out: DateKey[] = []
    const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate())
    const end = new Date(to.getFullYear(), to.getMonth(), to.getDate())
    while (cursor.getTime() <= end.getTime()) {
        out.push(buildDateKey(cursor))
        cursor.setDate(cursor.getDate() + 1)
    }
    return out
}

/** Subtract `days` from `date` (returns a new Date at 00:00 local). */
export function addDays(date: Date, days: number): Date {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    d.setDate(d.getDate() + days)
    return d
}

export type PeriodPreset =
    | "yesterday"
    | "last3"
    | "last7"
    | "last15"
    | "last30"
    | "thisMonth"
    | "lastMonth"
    | "custom"

export interface ResolvedPeriod {
    from: Date
    to: Date
    label: string
    days: DateKey[]
    mesList: string[]
}

export function resolvePeriod(
    preset: PeriodPreset,
    customFrom?: string,
    customTo?: string,
): ResolvedPeriod {
    const today = todayInMexico()
    let from = today
    let to = today
    let label = ""

    switch (preset) {
        case "yesterday": {
            const y = addDays(today, -1)
            from = y; to = y
            label = "Ayer"
            break
        }
        case "last3": {
            from = addDays(today, -3); to = addDays(today, -1)
            label = "Últimos 3 días"
            break
        }
        case "last7": {
            from = addDays(today, -7); to = addDays(today, -1)
            label = "Últimos 7 días"
            break
        }
        case "last15": {
            from = addDays(today, -15); to = addDays(today, -1)
            label = "Últimos 15 días"
            break
        }
        case "last30": {
            from = addDays(today, -30); to = addDays(today, -1)
            label = "Últimos 30 días"
            break
        }
        case "thisMonth": {
            from = new Date(today.getFullYear(), today.getMonth(), 1)
            to = today
            label = "Mes actual"
            break
        }
        case "lastMonth": {
            const firstThis = new Date(today.getFullYear(), today.getMonth(), 1)
            const lastMonthLast = addDays(firstThis, -1)
            from = new Date(lastMonthLast.getFullYear(), lastMonthLast.getMonth(), 1)
            to = lastMonthLast
            label = "Mes anterior"
            break
        }
        case "custom": {
            if (customFrom) from = new Date(`${customFrom}T00:00:00`)
            if (customTo) to = new Date(`${customTo}T00:00:00`)
            if (from.getTime() > to.getTime()) {
                const tmp = from; from = to; to = tmp
            }
            label = "Personalizado"
            break
        }
    }

    const days = enumerateDateRange(from, to)
    const mesList = Array.from(new Set(days.map((d) => d.mes))).sort()

    return { from, to, label, days, mesList }
}

export interface EmployeePeriodStats {
    key: string
    numero_empleado: string
    nombre: string
    departamento: string
    area: string
    puesto: string
    turno: string
    /** Total days observed in window where this employee was tracked (non "-"). */
    tracked: number
    asistencias: number
    descansos: number
    incidencias: number
    ausentismo: number
    pctAusentismo: number
    byCode: Record<string, number>
    /** Per-day code map filtered to the requested window (iso → code). */
    byDay: Record<string, string>
    /** Sorted list of incident occurrences (latest first). */
    incidents: { iso: string; code: string }[]
}

export interface DailySummary {
    iso: string
    weekday: number
    /** total employees with any code other than "-" on that day */
    tracked: number
    asistencias: number
    descansos: number
    festivos: number
    incidencias: number
    ausentismo: number
    byCode: Record<string, number>
    /** Names of employees who were absent (F+P+I) on this day, sorted. */
    absentees: { key: string; nombre: string; numero_empleado: string; departamento: string; area: string; turno: string; code: string }[]
}

export interface AusentismoAggregate {
    employees: EmployeePeriodStats[]
    days: DailySummary[]
    totals: {
        tracked: number
        asistencias: number
        descansos: number
        festivos: number
        incidencias: number
        ausentismo: number
        pctAusentismo: number
        byCode: Record<string, number>
        empleadosAfectados: number
    }
}

/** Make a stable employee key (numero_empleado preferred, fallback to normalized name). */
export function employeeKey(row: Pick<ReporteRow, "numero_empleado" | "nombre">): string {
    return (row.numero_empleado || "").trim() || row.nombre.trim().toUpperCase()
}

/**
 * Parse the `data` JSONB blobs returned by Supabase, indexed by month.
 * Silently drops rows that fail validation in `parseReporteJSON`.
 */
export function parseRecordsByMes(records: { mes: string; data: unknown }[]): Map<string, ReporteRow[]> {
    const out = new Map<string, ReporteRow[]>()
    for (const rec of records) {
        if (!Array.isArray(rec.data)) continue
        const { rows } = parseReporteJSON(rec.data)
        // Force `mes` to match the column (defensive against rows missing it).
        const tagged = rows.map((r) => ({ ...r, mes: rec.mes || r.mes }))
        out.set(rec.mes, tagged)
    }
    return out
}

/**
 * Build the aggregated period stats from monthly parsed rows + a list of days.
 * Each `day` carries `mes` + `day` (DD) for fast indexing into row.days.
 */
export function aggregatePeriod(
    rowsByMes: Map<string, ReporteRow[]>,
    period: ResolvedPeriod,
    filters: {
        search?: string
        departamento?: string
        area?: string
        turno?: string
        codeFilter?: string
    } = {},
): AusentismoAggregate {
    const search = (filters.search ?? "").trim().toLowerCase()
    const empMap = new Map<string, EmployeePeriodStats>()
    const dayMap = new Map<string, DailySummary>()

    function matchesFilters(row: ReporteRow): boolean {
        if (filters.departamento && row.departamento !== filters.departamento) return false
        if (filters.area && row.area !== filters.area) return false
        if (filters.turno && (row.turno || "") !== filters.turno) return false
        if (search) {
            const hay = `${row.nombre} ${row.numero_empleado} ${row.departamento} ${row.area} ${row.puesto ?? ""}`.toLowerCase()
            if (!hay.includes(search)) return false
        }
        return true
    }

    for (const dk of period.days) {
        dayMap.set(dk.iso, {
            iso: dk.iso,
            weekday: dk.date.getDay(),
            tracked: 0,
            asistencias: 0,
            descansos: 0,
            festivos: 0,
            incidencias: 0,
            ausentismo: 0,
            byCode: {},
            absentees: [],
        })
    }

    for (const dk of period.days) {
        const monthRows = rowsByMes.get(dk.mes)
        if (!monthRows) continue
        const summary = dayMap.get(dk.iso)!

        for (const row of monthRows) {
            if (!matchesFilters(row)) continue
            const code = row.days[dk.day]
            if (!code || code === "-") continue

            const key = employeeKey(row)
            let emp = empMap.get(key)
            if (!emp) {
                emp = {
                    key,
                    numero_empleado: row.numero_empleado,
                    nombre: row.nombre,
                    departamento: row.departamento,
                    area: row.area,
                    puesto: row.puesto ?? "",
                    turno: row.turno ?? "",
                    tracked: 0,
                    asistencias: 0,
                    descansos: 0,
                    incidencias: 0,
                    ausentismo: 0,
                    pctAusentismo: 0,
                    byCode: {},
                    byDay: {},
                    incidents: [],
                }
                empMap.set(key, emp)
            }

            emp.tracked += 1
            emp.byCode[code] = (emp.byCode[code] || 0) + 1
            emp.byDay[dk.iso] = code

            summary.tracked += 1
            summary.byCode[code] = (summary.byCode[code] || 0) + 1

            if (code === "A") {
                emp.asistencias += 1
                summary.asistencias += 1
            } else if (code === "D") {
                emp.descansos += 1
                summary.descansos += 1
            } else if (code === "DF") {
                summary.festivos += 1
                emp.descansos += 1
            } else if (code === "X") {
                // tracked already counted, skip categorization
            } else {
                emp.incidencias += 1
                summary.incidencias += 1
                if (isAusentismoCode(code)) {
                    emp.ausentismo += 1
                    summary.ausentismo += 1
                    summary.absentees.push({
                        key,
                        nombre: row.nombre,
                        numero_empleado: row.numero_empleado,
                        departamento: row.departamento,
                        area: row.area,
                        turno: row.turno ?? "",
                        code,
                    })
                }
                emp.incidents.push({ iso: dk.iso, code })
            }
        }
    }

    // Sort & finalize
    const employees = Array.from(empMap.values()).map((e) => {
        e.incidents.sort((a, b) => (a.iso < b.iso ? 1 : a.iso > b.iso ? -1 : 0))
        e.pctAusentismo = e.tracked > 0 ? Math.round((e.ausentismo / e.tracked) * 10000) / 100 : 0
        return e
    })

    const codeFilter = filters.codeFilter
    const filteredEmployees = codeFilter
        ? employees.filter((e) => (e.byCode[codeFilter] || 0) > 0)
        : employees

    const days = Array.from(dayMap.values()).sort((a, b) => (a.iso < b.iso ? 1 : -1))
    days.forEach((d) => d.absentees.sort((a, b) => a.nombre.localeCompare(b.nombre)))

    const totals = filteredEmployees.reduce(
        (acc, e) => {
            acc.tracked += e.tracked
            acc.asistencias += e.asistencias
            acc.descansos += e.descansos
            acc.incidencias += e.incidencias
            acc.ausentismo += e.ausentismo
            for (const [code, count] of Object.entries(e.byCode)) {
                acc.byCode[code] = (acc.byCode[code] || 0) + count
            }
            return acc
        },
        {
            tracked: 0,
            asistencias: 0,
            descansos: 0,
            festivos: 0,
            incidencias: 0,
            ausentismo: 0,
            pctAusentismo: 0,
            byCode: {} as Record<string, number>,
            empleadosAfectados: 0,
        },
    )
    totals.festivos = days.reduce((n, d) => n + d.festivos, 0)
    totals.empleadosAfectados = filteredEmployees.filter((e) => e.incidencias > 0).length
    totals.pctAusentismo = totals.tracked > 0
        ? Math.round((totals.ausentismo / totals.tracked) * 10000) / 100
        : 0

    return { employees: filteredEmployees, days, totals }
}

/** All known incident codes (excluding "DF" which is festivo). */
export const INCIDENT_CODE_LIST: readonly string[] = INCIDENT_TABS

export function formatLongDate(iso: string): string {
    const [y, m, d] = iso.split("-").map(Number)
    const date = new Date(y, m - 1, d)
    return date.toLocaleDateString("es-MX", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
    })
}

export function formatShortDate(iso: string): string {
    const [y, m, d] = iso.split("-").map(Number)
    const date = new Date(y, m - 1, d)
    return date.toLocaleDateString("es-MX", {
        weekday: "short",
        day: "2-digit",
        month: "short",
    })
}

export function codeTone(code: string): { text: string; bg: string; ring: string } {
    if (code === "F") return { text: "text-destructive", bg: "bg-destructive/10", ring: "ring-destructive/20" }
    if (code === "I") return { text: "text-warning", bg: "bg-warning/10", ring: "ring-warning/20" }
    if (code === "P") return { text: "text-warning", bg: "bg-warning/15", ring: "ring-warning/30" }
    if (code === "FJ") return { text: "text-info", bg: "bg-info/10", ring: "ring-info/20" }
    if (code === "S") return { text: "text-destructive", bg: "bg-destructive/15", ring: "ring-destructive/30" }
    return { text: "text-muted-foreground", bg: "bg-muted", ring: "ring-border" }
}

export type EmployeeSortField =
    | "nombre"
    | "departamento"
    | "ausentismo"
    | "incidencias"
    | "pctAusentismo"
    | "F"
    | "FJ"
    | "P"
    | "I"
    | "S"

export function sortEmployees(
    employees: EmployeePeriodStats[],
    field: EmployeeSortField,
    dir: "asc" | "desc",
): EmployeePeriodStats[] {
    const mult = dir === "asc" ? 1 : -1
    return [...employees].sort((a, b) => {
        const av = readEmployeeField(a, field)
        const bv = readEmployeeField(b, field)
        if (typeof av === "string" && typeof bv === "string") {
            return av.localeCompare(bv) * mult
        }
        return ((av as number) - (bv as number)) * mult
    })
}

function readEmployeeField(e: EmployeePeriodStats, field: EmployeeSortField): number | string {
    switch (field) {
        case "nombre": return e.nombre
        case "departamento": return e.departamento
        case "ausentismo": return e.ausentismo
        case "incidencias": return e.incidencias
        case "pctAusentismo": return e.pctAusentismo
        default: return e.byCode[field] || 0
    }
}

export function isIncidentCode(code: string): code is IncidentTab {
    return (INCIDENT_TABS as readonly string[]).includes(code)
}

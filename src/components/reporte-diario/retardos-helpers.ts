import type {
    ScheduleDefinition,
    PunchRow,
    PunchAnalysis,
    PunchStatus,
    RetardosSummary,
    EmployeeSummary,
} from "./retardos-types"
import { SKIP_ANALYSIS_CODES, PUNCH_STATUS_LABELS } from "./retardos-constants"
import { localTodayIso } from "@/lib/dates"

// ─── Time utils ──────────────────────────────────────────────────────────────

function timeToMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number)
    return h * 60 + m
}

export function minutesToHHMM(mins: number): string {
    const h = Math.floor(Math.abs(mins) / 60)
    const m = Math.abs(mins) % 60
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function diffMinutes(from: string, to: string): number {
    return timeToMinutes(to) - timeToMinutes(from)
}

/** diffMinutes that handles midnight crossover (e.g., 21:45→02:01 = 256 min) */
function diffMinutesOvernight(from: string, to: string): number {
    let diff = timeToMinutes(to) - timeToMinutes(from)
    if (diff < 0) diff += 1440
    return diff
}

// ─── Schedule resolution ─────────────────────────────────────────────────────

/** Resolve the matching schedule for a punch row by turno number + day of week */
export function resolveSchedule(
    row: PunchRow,
    schedules: ScheduleDefinition[],
): ScheduleDefinition | undefined {
    const dayOfWeek = row.fecha
        ? new Date(row.fecha + "T12:00:00").getDay()
        : -1
    const candidates = schedules.filter((s) => s.turnoNumber === row.turno)
    if (candidates.length > 1 && dayOfWeek >= 0) {
        return candidates.find((s) => s.workDays.includes(dayOfWeek)) ?? candidates[0]
    }
    return candidates[0]
}

// ─── Analyze a single row ────────────────────────────────────────────────────

export function analyzeRow(
    row: PunchRow,
    schedules: ScheduleDefinition[],
): PunchAnalysis {
    const base: Pick<PunchAnalysis,
        "numero_empleado" | "nombre" | "departamento" | "area" | "fecha" | "turno" | "incidencia" | "observaciones" |
        "entrada1" | "salida1" | "entrada2" | "salida2"
    > = {
        numero_empleado: row.numero_empleado,
        nombre: row.nombre,
        departamento: row.departamento,
        area: row.area,
        fecha: row.fecha,
        turno: row.turno,
        incidencia: row.incidencia,
        observaciones: row.observaciones,
        entrada1: row.entrada1,
        salida1: row.salida1,
        entrada2: row.entrada2,
        salida2: row.salida2,
    }

    // Skip if non-work incidence
    if (SKIP_ANALYSIS_CODES.has(row.incidencia)) {
        return {
            ...base,
            hora_entrada_esperada: "--:--",
            hora_salida_esperada: "--:--",
            status: row.incidencia === "D" || row.incidencia === "DF" ? "day_off" : "incidence",
            minutos_trabajados: 0,
            minutos_comida: 0,
            exceso_comida: 0,
            minutos_retardo: 0,
            minutos_extra: 0,
            marcajes_faltantes: [],
        }
    }

    // Find matching schedule by turno number (+ day of week for multi-schedule turnos)
    const schedule = resolveSchedule(row, schedules)
    if (!schedule) {
        return {
            ...base,
            hora_entrada_esperada: "--:--",
            hora_salida_esperada: "--:--",
            status: "no_schedule",
            minutos_trabajados: 0,
            minutos_comida: 0,
            exceso_comida: 0,
            minutos_retardo: 0,
            minutos_extra: 0,
            marcajes_faltantes: [],
        }
    }

    // Detect night shift (entry > exit means crossing midnight)
    const isNightShift = timeToMinutes(schedule.entryTime) > timeToMinutes(schedule.exitTime)

    // Night shifts: discard previous-day residual punches.
    // Find the first punch near entryTime; everything before it is from the prior shift.
    if (isNightShift) {
        const allPunches = [
            row.entrada1, row.salida1, row.entrada2, row.salida2,
            row.entrada3, row.salida3, row.entrada4, row.salida4,
            row.entrada5, row.salida5,
        ].filter((p): p is string => p != null)

        if (allPunches.length > 1) {
            const entryMin = timeToMinutes(schedule.entryTime)
            const threshold = entryMin - 120
            const startIdx = allPunches.findIndex((p) => timeToMinutes(p) >= threshold)
            if (startIdx > 0) {
                const cleaned = allPunches.slice(startIdx)
                row = {
                    ...row,
                    entrada1: cleaned[0] ?? null,
                    salida1: cleaned[1] ?? null,
                    entrada2: cleaned[2] ?? null,
                    salida2: cleaned[3] ?? null,
                    entrada3: cleaned[4] ?? null,
                    salida3: cleaned[5] ?? null,
                    entrada4: cleaned[6] ?? null,
                    salida4: cleaned[7] ?? null,
                    entrada5: cleaned[8] ?? null,
                    salida5: cleaned[9] ?? null,
                }
                base.entrada1 = row.entrada1
                base.salida1 = row.salida1
                base.entrada2 = row.entrada2
                base.salida2 = row.salida2
            }
        }
    }

    // Check missing punches
    // Night shifts: only entrada1 is required on the entry day;
    // comedor/salida punches may appear in the next day's report
    const noLunch = schedule.lunchMinutes === 0
    const faltantes: string[] = []
    if (!row.entrada1) faltantes.push("Entrada")
    if (!isNightShift) {
        if (noLunch) {
            // No-lunch schedule: only need entrada + salida (salida1 = shift exit)
            if (!row.salida1) faltantes.push("Salida")
        } else {
            if (!row.salida1) faltantes.push("Sal. comedor")
            if (!row.entrada2) faltantes.push("Ent. comedor")
            if (!row.salida2) faltantes.push("Salida")
        }
    }
    const diff = isNightShift ? diffMinutesOvernight : diffMinutes

    // Compute work time
    let minutosTrabajados = 0
    if (isNightShift && row.entrada1) {
        // Night shift: compute from entrada1 to last available punch
        const lastPunch = row.salida2 || row.entrada2 || row.salida1
        if (lastPunch) {
            minutosTrabajados = diff(row.entrada1, lastPunch)
        }
    } else if (noLunch) {
        // No-lunch schedule: entrada1→salida1 is the full shift
        if (row.entrada1 && row.salida1) {
            minutosTrabajados = diff(row.entrada1, row.salida1)
        }
    } else {
        // Day shift with lunch: (entrada1→salida1) + (entrada2→salida2)
        if (row.entrada1 && row.salida1) {
            minutosTrabajados += diff(row.entrada1, row.salida1)
        }
        if (row.entrada2 && row.salida2) {
            minutosTrabajados += diff(row.entrada2, row.salida2)
        }
        // If only entrada1 and salida2 exist (no lunch punches), count full span
        if (row.entrada1 && row.salida2 && !row.salida1 && !row.entrada2) {
            minutosTrabajados = diff(row.entrada1, row.salida2)
        }
    }

    // Compute lunch time: salida1→entrada2
    let minutosComida = 0
    if (row.salida1 && row.entrada2) {
        minutosComida = diff(row.salida1, row.entrada2)
    }

    // Exceso de comida
    let excesoComida = 0
    if (minutosComida > 0 && schedule) {
        const limiteComida = schedule.lunchMinutes + schedule.lunchToleranceMinutes
        if (minutosComida > limiteComida) {
            excesoComida = minutosComida - schedule.lunchMinutes
        }
    }

    // Compute tardiness: entrada1 vs schedule entry
    let minutosRetardo = 0
    if (row.entrada1) {
        const tardDiff = isNightShift
            ? diffMinutesOvernight(schedule.entryTime, row.entrada1)
            : diffMinutes(schedule.entryTime, row.entrada1)
        // For night shifts, if diff > 720 (12h) the person arrived early, not late
        const effectiveTard = isNightShift && tardDiff > 720 ? tardDiff - 1440 : tardDiff
        if (effectiveTard > schedule.toleranceMinutes) {
            minutosRetardo = effectiveTard
        }
    }

    // Compute extra time: salida2 vs schedule exit
    let minutosExtra = 0
    if (row.salida2) {
        const extraDiff = isNightShift
            ? diffMinutesOvernight(schedule.exitTime, row.salida2)
            : diffMinutes(schedule.exitTime, row.salida2)
        // For night shifts, if diff > 720 the person left early, not extra
        const effectiveExtra = isNightShift && extraDiff > 720 ? extraDiff - 1440 : extraDiff
        if (effectiveExtra > 10) {
            minutosExtra = effectiveExtra
        }
    }

    // Determine status
    let status: PunchStatus = "on_time"
    if (faltantes.length > 0) {
        status = "missing_punch"
    } else if (minutosRetardo > 0) {
        status = "late"
    }

    return {
        ...base,
        hora_entrada_esperada: schedule.entryTime,
        hora_salida_esperada: schedule.exitTime,
        status,
        minutos_trabajados: Math.max(minutosTrabajados, 0),
        minutos_comida: Math.max(minutosComida, 0),
        exceso_comida: excesoComida,
        minutos_retardo: minutosRetardo,
        minutos_extra: minutosExtra,
        marcajes_faltantes: faltantes,
    }
}

// ─── Analyze all rows ────────────────────────────────────────────────────────

export function analyzeAllRows(
    rows: PunchRow[],
    schedules: ScheduleDefinition[],
): PunchAnalysis[] {
    return rows.map((r) => analyzeRow(r, schedules))
}

// ─── Summary ─────────────────────────────────────────────────────────────────

export function computeRetardosSummary(analyses: PunchAnalysis[]): RetardosSummary {
    const working = analyses.filter(
        (a) => a.status !== "day_off" && a.status !== "incidence",
    )
    const empleados = new Set(working.map((a) => a.numero_empleado))
    const retardos = working.filter((a) => a.status === "late").length
    const faltasMarcaje = working.filter((a) => a.status === "missing_punch").length
    const minutosExtra = working.reduce((sum, a) => sum + a.minutos_extra, 0)
    const minutosTrabajados = working.reduce((sum, a) => sum + a.minutos_trabajados, 0)

    const withLunch = working.filter((a) => a.minutos_comida > 0)
    const promedioComida = withLunch.length > 0
        ? Math.round(withLunch.reduce((s, a) => s + a.minutos_comida, 0) / withLunch.length)
        : 0

    const onTime = working.filter((a) => a.status === "on_time").length
    const pctPuntualidad = working.length > 0
        ? Math.round((onTime / working.length) * 100 * 100) / 100
        : 0

    return {
        total_empleados: empleados.size,
        total_registros: working.length,
        total_retardos: retardos,
        total_faltas_marcaje: faltasMarcaje,
        total_minutos_extra: minutosExtra,
        total_minutos_trabajados: minutosTrabajados,
        promedio_comida_minutos: promedioComida,
        pct_puntualidad: pctPuntualidad,
    }
}

// ─── Employee summaries ──────────────────────────────────────────────────────

export function computeEmployeeSummaries(analyses: PunchAnalysis[]): EmployeeSummary[] {
    const byEmployee = new Map<string, PunchAnalysis[]>()
    for (const a of analyses) {
        const rows = byEmployee.get(a.numero_empleado) ?? []
        rows.push(a)
        byEmployee.set(a.numero_empleado, rows)
    }

    const summaries: EmployeeSummary[] = []
    for (const [empId, registros] of byEmployee) {
        const working = registros.filter(
            (a) => a.status !== "day_off" && a.status !== "incidence",
        )
        const diasPuntual = working.filter((a) => a.status === "on_time").length
        const diasRetardo = working.filter((a) => a.status === "late").length
        const diasFaltantes = working.filter((a) => a.status === "missing_punch").length
        const withLunch = working.filter((a) => a.minutos_comida > 0)

        summaries.push({
            numero_empleado: empId,
            nombre: registros[0].nombre,
            turno: registros[0].turno,
            total_dias: working.length,
            dias_puntual: diasPuntual,
            dias_retardo: diasRetardo,
            dias_faltantes: diasFaltantes,
            pct_puntualidad: working.length > 0
                ? Math.round((diasPuntual / working.length) * 100)
                : 0,
            total_minutos_retardo: working.reduce((s, a) => s + a.minutos_retardo, 0),
            total_minutos_extra: working.reduce((s, a) => s + a.minutos_extra, 0),
            total_minutos_trabajados: working.reduce((s, a) => s + a.minutos_trabajados, 0),
            promedio_comida_minutos: withLunch.length > 0
                ? Math.round(withLunch.reduce((s, a) => s + a.minutos_comida, 0) / withLunch.length)
                : 0,
            registros,
        })
    }

    return summaries.sort((a, b) => a.numero_empleado.localeCompare(b.numero_empleado))
}

export async function exportRetardosExcel(analyses: PunchAnalysis[]): Promise<void> {
    alert("La exportación a Excel ha sido deshabilitada por seguridad.");
}

export interface ParsePunchResult {
    rows: PunchRow[]
    errors: string[]
}

export async function parseExcelPunches(file: File): Promise<ParsePunchResult> {
    alert("El parseo de archivos Excel ha sido deshabilitado por seguridad.");
    return { rows: [], errors: ["Función deshabilitada"] };
}

// ─── Night-shift cross-date merge ────────────────────────────────────────────

function punchArray(row: PunchRow): (string | null)[] {
    return [
        row.entrada1, row.salida1, row.entrada2, row.salida2,
        row.entrada3, row.salida3, row.entrada4, row.salida4,
        row.entrada5, row.salida5,
    ]
}

function assignPunches(row: PunchRow, punches: (string | null)[]): PunchRow {
    return {
        ...row,
        entrada1: punches[0] ?? null,
        salida1: punches[1] ?? null,
        entrada2: punches[2] ?? null,
        salida2: punches[3] ?? null,
        entrada3: punches[4] ?? null,
        salida3: punches[5] ?? null,
        entrada4: punches[6] ?? null,
        salida4: punches[7] ?? null,
        entrada5: punches[8] ?? null,
        salida5: punches[9] ?? null,
    }
}

/**
 * For night-shift employees whose punches span two calendar dates,
 * pull the "residual" early-morning punches from the next-day row
 * into the entry-day row so that one row = one full shift.
 */
export function mergeNightShiftPunches(
    rows: PunchRow[],
    schedules: ScheduleDefinition[],
): PunchRow[] {
    // Group by employee, preserving original order
    const byEmployee = new Map<string, PunchRow[]>()
    for (const row of rows) {
        const empRows = byEmployee.get(row.numero_empleado) ?? []
        empRows.push(row)
        byEmployee.set(row.numero_empleado, empRows)
    }

    const result: PunchRow[] = []

    for (const [, empRows] of byEmployee) {
        // Sort by fecha ascending
        empRows.sort((a, b) => a.fecha.localeCompare(b.fecha))

        // Track which rows had residuals removed (to avoid pushing duplicates)
        const processed = new Set<number>()

        for (let i = 0; i < empRows.length; i++) {
            const current = empRows[i]

            // Resolve schedule for current row
            const schedule = resolveSchedule(current, schedules)

            const isNight = schedule
                ? timeToMinutes(schedule.entryTime) > timeToMinutes(schedule.exitTime)
                : false

            if (isNight && i + 1 < empRows.length) {
                const next = empRows[i + 1]
                const nextPunches = punchArray(next).filter((p): p is string => p != null)
                const entryMin = timeToMinutes(schedule!.entryTime)
                const threshold = entryMin - 120 // e.g. 20:00 for 22:00 entry

                // Split next-day punches: residuals (before threshold) vs remaining
                const residuals: string[] = []
                const remaining: string[] = []
                let foundNextEntry = false
                for (const p of nextPunches) {
                    const m = timeToMinutes(p)
                    if (!foundNextEntry && m < threshold) {
                        residuals.push(p)
                    } else {
                        foundNextEntry = true
                        remaining.push(p)
                    }
                }

                if (residuals.length > 0) {
                    // Merge: current punches + residuals, de-duplicate adjacent
                    const currentPunches = punchArray(current).filter((p): p is string => p != null)
                    const merged: string[] = []
                    for (const p of [...currentPunches, ...residuals]) {
                        if (merged.length === 0 || merged[merged.length - 1] !== p) {
                            merged.push(p)
                        }
                    }
                    empRows[i] = assignPunches(current, merged)

                    // Update next-day row with remaining punches only
                    empRows[i + 1] = assignPunches(next, remaining)
                    // Skip empty next-day row (all punches were residuals)
                    if (remaining.length === 0) {
                        processed.add(i + 1)
                    }
                }
            }

            if (!processed.has(i)) {
                result.push(empRows[i])
            }
        }
    }

    return result
}

// ─── Schedule-aware punch classification ─────────────────────────────────────

/**
 * For day shifts with lunch, reclassify punches using the schedule
 * so that the last punch maps to salida (shift exit) when appropriate,
 * instead of being blindly assigned by sequential order.
 *
 * Pattern for 4-punch day shift: entrada, sal.comedor, ent.comedor, salida
 * When only 3 punches exist, check if last punch is near exitTime → salida.
 */
export function classifyPunchesBySchedule(
    rows: PunchRow[],
    schedules: ScheduleDefinition[],
): PunchRow[] {
    return rows.map((row) => {
        const schedule = resolveSchedule(row, schedules)
        if (!schedule) return row

        const isNight = timeToMinutes(schedule.entryTime) > timeToMinutes(schedule.exitTime)
        if (isNight) return row
        if (schedule.lunchMinutes === 0) return row

        const punches = punchArray(row).filter((p): p is string => p != null)
        if (punches.length !== 3) return row

        // 3 punches for a day shift with lunch: check if last is near exitTime
        const exitMin = timeToMinutes(schedule.exitTime)
        const lastMin = timeToMinutes(punches[2])
        const midShift = (timeToMinutes(schedule.entryTime) + exitMin) / 2

        // If last punch is closer to exitTime than to mid-shift, it's the salida
        if (Math.abs(lastMin - exitMin) < Math.abs(lastMin - midShift)) {
            return assignPunches(row, [punches[0], punches[1], null, punches[2]])
        }

        return row
    })
}

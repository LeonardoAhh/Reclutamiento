import { useCallback, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { toast } from "@/lib/notify"
import { formatSupabaseError as describeSupabaseError } from "@/lib/errors"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ReporteDiarioRecord {
    id: string
    mes: string
    data: unknown[]
    total_empleados: number
    total_incidencias: number
    tasa_asistencia: number
    dias_disponibles: number
    total_ausentismo: number
    pct_ausentismo: number
    uploaded_by: string | null
    created_at: string
    updated_at: string
}

export interface ReporteDiarioSummary {
    id: string
    mes: string
    total_empleados: number
    total_incidencias: number
    tasa_asistencia: number
    dias_disponibles: number
    total_ausentismo: number
    pct_ausentismo: number
    created_at: string
}

export interface ReporteDiarioInsert {
    mes: string
    data: unknown[]
    total_empleados: number
    total_incidencias: number
    tasa_asistencia: number
    dias_disponibles: number
    total_ausentismo: number
    pct_ausentismo: number
}

const REPORT_SUMMARY_COLUMNS = "id, mes, total_empleados, total_incidencias, tasa_asistencia, dias_disponibles, total_ausentismo, pct_ausentismo, created_at"
const REPORT_COLUMNS = `${REPORT_SUMMARY_COLUMNS}, data, uploaded_by, updated_at`
const REPORT_CACHE_MAX_AGE_MS = 60_000

let summariesCache: ReporteDiarioSummary[] | null = null
let summariesRequest: Promise<ReporteDiarioSummary[]> | null = null
let cacheOwnerId: string | null | undefined
let cacheGeneration = 0
let cacheExpiresAt = 0
const reportsByMonthCache = new Map<string, ReporteDiarioRecord | null>()
const reportListCache = new Map<string, ReporteDiarioRecord[]>()
const reportListRequests = new Map<string, Promise<ReporteDiarioRecord[]>>()

function clearReporteDiarioCache() {
    cacheGeneration += 1
    cacheExpiresAt = 0
    summariesCache = null
    summariesRequest = null
    reportsByMonthCache.clear()
    reportListCache.clear()
    reportListRequests.clear()
}

function ensureReporteDiarioCacheOwner(ownerId: string | null) {
    if (cacheOwnerId !== ownerId) {
        clearReporteDiarioCache()
        cacheOwnerId = ownerId
        return
    }
    if (cacheExpiresAt > 0 && Date.now() >= cacheExpiresAt) clearReporteDiarioCache()
}

function monthListKey(months: string[]) {
    return [...new Set(months)].sort().join("\u0000")
}

async function requestSummaries(): Promise<ReporteDiarioSummary[]> {
    if (summariesCache) return summariesCache
    if (summariesRequest) return summariesRequest

    const requestGeneration = cacheGeneration
    const request = (async () => {
        const { data, error } = await supabase
            .from("reportes_diarios")
            .select(REPORT_SUMMARY_COLUMNS)
            .order("mes", { ascending: false })
        if (error) throw new Error(error.message)
        const summaries = (data ?? []) as ReporteDiarioSummary[]
        if (cacheGeneration === requestGeneration) {
            summariesCache = summaries
            cacheExpiresAt = Date.now() + REPORT_CACHE_MAX_AGE_MS
        }
        return summaries
    })()
    summariesRequest = request

    try {
        return await request
    } finally {
        if (summariesRequest === request) summariesRequest = null
    }
}

async function requestReportsByMonth(months: string[]): Promise<ReporteDiarioRecord[]> {
    const uniqueMonths = [...new Set(months)].sort()
    if (uniqueMonths.length === 0) return []
    const key = monthListKey(uniqueMonths)
    const cached = reportListCache.get(key)
    if (cached) return cached
    const pending = reportListRequests.get(key)
    if (pending) return pending

    const requestGeneration = cacheGeneration
    const request = (async () => {
        const { data, error } = await supabase
            .from("reportes_diarios")
            .select(REPORT_COLUMNS)
            .in("mes", uniqueMonths)
            .order("mes", { ascending: true })
        if (error) throw new Error(error.message)
        const reports = (data ?? []) as ReporteDiarioRecord[]
        if (cacheGeneration === requestGeneration) {
            const reportsByMonth = new Map(reports.map((report) => [report.mes, report]))
            uniqueMonths.forEach((month) => reportsByMonthCache.set(month, reportsByMonth.get(month) ?? null))
            reportListCache.set(key, reports)
            cacheExpiresAt = Date.now() + REPORT_CACHE_MAX_AGE_MS
        }
        return reports
    })()
    reportListRequests.set(key, request)

    try {
        return await request
    } finally {
        if (reportListRequests.get(key) === request) reportListRequests.delete(key)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useReporteDiario() {
    const { user } = useAuth()
    const ownerId = user?.id ?? null
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    /** Fetch all saved report summaries (without full data) for listing/comparison */
    const fetchSummaries = useCallback(async (): Promise<ReporteDiarioSummary[]> => {
        setLoading(true)
        setError(null)
        try {
            ensureReporteDiarioCacheOwner(ownerId)
            return await requestSummaries()
        } catch (err) {
            const msg = describeSupabaseError(err)
            setError(msg)
            return []
        } finally {
            setLoading(false)
        }
    }, [ownerId])

    /** Fetch full report data for a specific month */
    const fetchByMes = useCallback(async (mes: string): Promise<ReporteDiarioRecord | null> => {
        setLoading(true)
        setError(null)
        try {
            ensureReporteDiarioCacheOwner(ownerId)
            if (reportsByMonthCache.has(mes)) {
                return reportsByMonthCache.get(mes) ?? null
            }
            const requestGeneration = cacheGeneration
            const { data, error } = await supabase
                .from("reportes_diarios")
                .select(REPORT_COLUMNS)
                .eq("mes", mes)
                .maybeSingle()
            if (error) throw new Error(error.message)
            const report = data as ReporteDiarioRecord | null
            if (cacheGeneration === requestGeneration) {
                reportsByMonthCache.set(mes, report)
                cacheExpiresAt = Date.now() + REPORT_CACHE_MAX_AGE_MS
            }
            return report
        } catch (err) {
            const msg = describeSupabaseError(err)
            setError(msg)
            return null
        } finally {
            setLoading(false)
        }
    }, [ownerId])

    /** Fetch full report data for multiple months (used by ausentismo analytics) */
    const fetchByMesList = useCallback(async (mesList: string[]): Promise<ReporteDiarioRecord[]> => {
        if (mesList.length === 0) return []
        setLoading(true)
        setError(null)
        try {
            ensureReporteDiarioCacheOwner(ownerId)
            return await requestReportsByMonth(mesList)
        } catch (err) {
            const msg = describeSupabaseError(err)
            setError(msg)
            return []
        } finally {
            setLoading(false)
        }
    }, [ownerId])

    /** Save (upsert) a report for a given month */
    const saveReport = useCallback(async (
        report: ReporteDiarioInsert,
    ): Promise<{ success: boolean; error?: string }> => {
        setSaving(true)
        setError(null)
        try {
            ensureReporteDiarioCacheOwner(ownerId)
            const { error } = await supabase
                .from("reportes_diarios")
                .upsert(
                    {
                        ...report,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "mes", ignoreDuplicates: false },
                )
            if (error) throw error
            clearReporteDiarioCache()
            return { success: true }
        } catch (err) {
            const msg = describeSupabaseError(err)
            setError(msg)
            toast.error({ title: 'No se pudo guardar el reporte' })
            return { success: false, error: msg }
        } finally {
            setSaving(false)
        }
    }, [ownerId])

    /** Delete a saved report */
    const deleteReport = useCallback(async (id: string): Promise<{ success: boolean }> => {
        setSaving(true)
        try {
            ensureReporteDiarioCacheOwner(ownerId)
            const { error } = await supabase
                .from("reportes_diarios")
                .delete()
                .eq("id", id)
            if (error) throw error
            clearReporteDiarioCache()
            toast.success({ title: "Reporte eliminado" })
            return { success: true }
        } catch (err) {
            const msg = describeSupabaseError(err)
            return { success: false }
        } finally {
            setSaving(false)
        }
    }, [ownerId])

    /** Fetch summaries for a range of months (for comparison) */
    const fetchComparison = useCallback(async (
        months: string[],
    ): Promise<ReporteDiarioSummary[]> => {
        setLoading(true)
        setError(null)
        try {
            ensureReporteDiarioCacheOwner(ownerId)
            if (summariesCache) {
                const requestedMonths = new Set(months)
                return summariesCache
                    .filter((summary) => requestedMonths.has(summary.mes))
                    .sort((left, right) => left.mes.localeCompare(right.mes))
            }
            const { data, error } = await supabase
                .from("reportes_diarios")
                .select(REPORT_SUMMARY_COLUMNS)
                .in("mes", months)
                .order("mes", { ascending: true })
            if (error) throw new Error(error.message)
            return (data ?? []) as ReporteDiarioSummary[]
        } catch (err) {
            const msg = describeSupabaseError(err)
            setError(msg)
            return []
        } finally {
            setLoading(false)
        }
    }, [ownerId])

    return {
        loading,
        saving,
        error,
        fetchSummaries,
        fetchByMes,
        fetchByMesList,
        saveReport,
        deleteReport,
        fetchComparison,
    }
}

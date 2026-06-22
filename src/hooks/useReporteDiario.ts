import { useCallback, useState } from "react"
import { supabase } from "@/lib/supabase"
import { sileo } from "@/lib/notify"
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

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useReporteDiario() {
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    /** Fetch all saved report summaries (without full data) for listing/comparison */
    const fetchSummaries = useCallback(async (): Promise<ReporteDiarioSummary[]> => {
        setLoading(true)
        setError(null)
        try {
            const { data, error } = await supabase
                .from("reportes_diarios")
                .select("id, mes, total_empleados, total_incidencias, tasa_asistencia, dias_disponibles, total_ausentismo, pct_ausentismo, created_at")
                .order("mes", { ascending: false })
            if (error) throw new Error(error.message)
            return (data ?? []) as ReporteDiarioSummary[]
        } catch (err) {
            const msg = describeSupabaseError(err)
            setError(msg)
            return []
        } finally {
            setLoading(false)
        }
    }, [])

    /** Fetch full report data for a specific month */
    const fetchByMes = useCallback(async (mes: string): Promise<ReporteDiarioRecord | null> => {
        setLoading(true)
        setError(null)
        try {
            const { data, error } = await supabase
                .from("reportes_diarios")
                .select("*")
                .eq("mes", mes)
                .maybeSingle()
            if (error) throw new Error(error.message)
            return data as ReporteDiarioRecord | null
        } catch (err) {
            const msg = describeSupabaseError(err)
            setError(msg)
            return null
        } finally {
            setLoading(false)
        }
    }, [])

    /** Fetch full report data for multiple months (used by ausentismo analytics) */
    const fetchByMesList = useCallback(async (mesList: string[]): Promise<ReporteDiarioRecord[]> => {
        if (mesList.length === 0) return []
        setLoading(true)
        setError(null)
        try {
            const { data, error } = await supabase
                .from("reportes_diarios")
                .select("*")
                .in("mes", mesList)
                .order("mes", { ascending: true })
            if (error) throw new Error(error.message)
            return (data ?? []) as ReporteDiarioRecord[]
        } catch (err) {
            const msg = describeSupabaseError(err)
            setError(msg)
            return []
        } finally {
            setLoading(false)
        }
    }, [])

    /** Save (upsert) a report for a given month */
    const saveReport = useCallback(async (
        report: ReporteDiarioInsert,
    ): Promise<{ success: boolean; error?: string }> => {
        setSaving(true)
        setError(null)
        try {
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
            return { success: true }
        } catch (err) {
            const msg = describeSupabaseError(err)
            setError(msg)
            sileo.error({ title: 'No se pudo guardar el reporte' })
            return { success: false, error: msg }
        } finally {
            setSaving(false)
        }
    }, [])

    /** Delete a saved report */
    const deleteReport = useCallback(async (id: string): Promise<{ success: boolean }> => {
        setSaving(true)
        try {
            const { error } = await supabase
                .from("reportes_diarios")
                .delete()
                .eq("id", id)
            if (error) throw error
            sileo.success({ title: "Reporte eliminado" })
            return { success: true }
        } catch (err) {
            const msg = describeSupabaseError(err)
            sileo.error({ title: 'No se pudo eliminar el reporte' })
            return { success: false }
        } finally {
            setSaving(false)
        }
    }, [])

    /** Fetch summaries for a range of months (for comparison) */
    const fetchComparison = useCallback(async (
        months: string[],
    ): Promise<ReporteDiarioSummary[]> => {
        setLoading(true)
        setError(null)
        try {
            const { data, error } = await supabase
                .from("reportes_diarios")
                .select("id, mes, total_empleados, total_incidencias, tasa_asistencia, dias_disponibles, total_ausentismo, pct_ausentismo, created_at")
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
    }, [])

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

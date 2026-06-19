"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import './ReporteDiario.css';
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Modal } from "@/components/ui/Modal";
import { motion, AnimatePresence } from "framer-motion"
import { sileo } from "@/lib/notify"
import { format, getISOWeek } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils-shadcn";
import {
    CloudUpload,
    Calendar,
    AlertCircle,
    Loader2,
    X,
    Download,
    Save,
    Check,
    Database,
    Trash2,
    Building2,
    SunMedium,
    User,
    ChevronRight,
    ChevronLeft,
    FileJson,
} from "lucide-react"

import { INCIDENT_TABS, INCIDENCIA_LABELS, AREA_STAFF, ALLOWED_PUESTOS } from "./constants"
import { formatMes, daysInMonth, parseReporteJSON, isIncidence, isIncidentTab, getMexicoHolidayLabels } from "./helpers"
import type { IncidentTab, AreaStaffSummary, ReporteRow, EmployeeRef } from "./types"

import ReporteCalendar from "./reporte-calendar"
import ReporteAreaSummary from "./reporte-area-summary"
import ReporteIncidentTabs from "./reporte-incident-tabs"
import ReporteKpiDashboard from "./reporte-kpi-dashboard"
import ReporteComparison from "./reporte-comparison"
import ReporteEmployeeDetail from "./reporte-employee-detail"
import ReportesGuardadosDialog from "./reportes-guardados-dialog"

import { useReporteDiario } from "@/hooks/useReporteDiario"
import type { ReporteDiarioSummary } from "@/hooks/useReporteDiario"

export default function ReporteDiarioContent() {
    const [rows, setRows] = useState<ReporteRow[]>([])
    const [selectedMes, setSelectedMes] = useState("")
    const [search, setSearch] = useState("")
    const [selectedEmployee, setSelectedEmployee] = useState<string>("")
    const [empDetailOpen, setEmpDetailOpen] = useState(false)
    const [departamentoFilter, setDepartamentoFilter] = useState("")
    const [turnoFilter, setTurnoFilter] = useState("")
    const [selectedIncidentTab, setSelectedIncidentTab] = useState<IncidentTab | "">("")
    const [selectedDay, setSelectedDay] = useState("")
    const [selectedArea, setSelectedArea] = useState<string | null>(null)
    const [errors, setErrors] = useState<string[]>([])
    const [fileName, setFileName] = useState("")
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [saveSuccess, setSaveSuccess] = useState(false)

    const [processStep, setProcessStep] = useState<"reading" | "validating" | "generating" | null>(null)
    const [previewData, setPreviewData] = useState<{
        rows: ReporteRow[];
        mes: string;
        fileName: string;
        jsonRaw: unknown;
    } | null>(null)

    const {
        loading: dbLoading,
        saving: dbSaving,
        fetchSummaries,
        fetchByMes,
        saveReport,
        deleteReport,
    } = useReporteDiario()

    const [savedSummaries, setSavedSummaries] = useState<ReporteDiarioSummary[]>([])
    const [loadingDb, setLoadingDb] = useState(true)

    // Recuperar último reporte parseado si se recarga la página por accidente
    useEffect(() => {
        const cached = sessionStorage.getItem("reporteDiarioCache")
        if (cached) {
            try {
                const json = JSON.parse(cached)
                const { rows: parsed, errors: errs } = parseReporteJSON(json)
                if (errs.length === 0 && parsed.length > 0) {
                    setRows(parsed)
                    setSelectedMes(parsed[0]?.mes ?? "")
                    setFileName("Autoguardado")
                }
            } catch (err) {
                // Si falla el parseo, solo ignoramos la caché
            }
        }
    }, [])

    useEffect(() => {
        fetchSummaries().then((data) => {
            setSavedSummaries(data)
            setLoadingDb(false)
        })
    }, [fetchSummaries])

    // Notifica a la navbar (badge del Menú) cuando cambian los datos del
    // reporte o la lista de meses guardados en Supabase.
    useEffect(() => {
        window.dispatchEvent(new CustomEvent("reporte-diario:changed"))
    }, [rows, savedSummaries])

    const months = useMemo(
        () => Array.from(new Set(rows.map((r) => r.mes))).sort(),
        [rows],
    )
    const availableDepartments = useMemo(
        () => Array.from(new Set(rows.map((r) => r.departamento))).sort(),
        [rows],
    )
    const availableTurnos = useMemo(
        () => Array.from(new Set(rows.map((r) => r.turno).filter((t): t is string => !!t))).sort(),
        [rows],
    )

    const currentMonth = selectedMes || months[0] || ""
    const dayCount = currentMonth ? daysInMonth(currentMonth) : 0
    const dayHeaders = Array.from({ length: dayCount }, (_, i) => String(i + 1).padStart(2, "0"))

    const selectedRows = useMemo(() => {
        const lower = search.toLowerCase()
        return rows
            .filter((r) => r.mes === currentMonth)
            .filter((r) => {
                if (departamentoFilter && r.departamento !== departamentoFilter) return false
                if (turnoFilter && r.turno !== turnoFilter) return false
                if (!lower) return true
                return (
                    r.nombre.toLowerCase().includes(lower) ||
                    r.numero_empleado.toLowerCase().includes(lower) ||
                    r.departamento.toLowerCase().includes(lower) ||
                    r.area.toLowerCase().includes(lower)
                )
            })
    }, [rows, currentMonth, search, departamentoFilter, turnoFilter])

    const daySummaries = useMemo(() => {
        return dayHeaders.reduce<Record<string, number>>((acc, day) => {
            acc[day] = selectedRows.reduce((n, r) => {
                return n + (isIncidence(r.days[day]) ? 1 : 0)
            }, 0)
            return acc
        }, {})
    }, [dayHeaders, selectedRows])

    const dayAusentismoPct = useMemo(() => {
        const total = selectedRows.length
        if (total === 0) return {} as Record<string, number>
        return dayHeaders.reduce<Record<string, number>>((acc, day) => {
            const hasAnyCode = selectedRows.some((r) => !!r.days[day])
            if (!hasAnyCode) {
                return acc
            }

            const ausentes = selectedRows.reduce((n, r) => {
                const code = r.days[day]
                return n + (code === "F" || code === "P" || code === "I" ? 1 : 0)
            }, 0)
            acc[day] = Math.round((ausentes / total) * 100 * 100) / 100
            return acc
        }, {})
    }, [dayHeaders, selectedRows])

    const emptyIncident = () => INCIDENT_TABS.reduce(
        (acc, c) => ({ ...acc, [c]: [] as EmployeeRef[] }),
        {} as Record<IncidentTab, EmployeeRef[]>,
    )

    const selectedDayIncidentSummary = useMemo(() => {
        const base = emptyIncident()
        if (!selectedDay) return base
        const result = selectedRows.reduce((acc, row, idx) => {
            const code = row.days[selectedDay]
            if (!isIncidence(code) || !isIncidentTab(code!)) return acc
            acc[code].push({
                key: `${code}||${row.departamento}||${row.area}||${row.turno || "-"}||${row.numero_empleado}||${idx}`,
                numero_empleado: row.numero_empleado,
                nombre: row.nombre,
                departamento: row.departamento,
                area: row.area,
                turno: row.turno || "-",
            })
            return acc
        }, base)
        for (const tab of INCIDENT_TABS) {
            result[tab].sort((a, b) => a.area.localeCompare(b.area))
        }
        return result
    }, [selectedRows, selectedDay])

    const selectedDayAreaSummary = useMemo<AreaStaffSummary[]>(() => {
        if (!selectedDay) return AREA_STAFF.map((area) => ({
            ...area,
            personal_activo: 0,
            personal_incidencia: 0,
            personal_real: area.personal_autorizado,
        }))

        let dayOfWeek = -1
        if (currentMonth && selectedDay) {
            const [year, month] = currentMonth.split("-").map(Number)
            dayOfWeek = new Date(year, month - 1, parseInt(selectedDay, 10)).getDay()
        }

        return AREA_STAFF.map((area) => {
            const rowsInArea = selectedRows.filter(
                (row) => row.area === area.area && ALLOWED_PUESTOS.has(row.puesto || ""),
            )
            const personal_activo = rowsInArea.length
            const personal_incidencia = rowsInArea.reduce((count, row) => {
                return count + (isIncidence(row.days[selectedDay]) ? 1 : 0)
            }, 0)

            let is_descanso = false
            if (dayOfWeek !== -1) {
                if (area.area === "PRODUCCIÓN 1ER. TURNO" && dayOfWeek === 0) {
                    // Domingo
                    is_descanso = true
                } else if (area.area === "PRODUCCIÓN 2o. TURNO" && (dayOfWeek === 1 || dayOfWeek === 2)) {
                    // Lunes y Martes
                    is_descanso = true
                } else if (area.area === "PRODUCCIÓN 3ER. TURNO" && (dayOfWeek === 3 || dayOfWeek === 4)) {
                    // Miércoles y Jueves
                    is_descanso = true
                } else if (area.area === "PRODUCCIÓN 4o. TURNO" && (dayOfWeek === 5 || dayOfWeek === 6)) {
                    // Viernes y Sábado
                    is_descanso = true
                }
            }

            return {
                ...area,
                personal_activo,
                personal_incidencia,
                personal_real: Math.max(personal_activo - personal_incidencia, 0),
                is_descanso,
            }
        })
    }, [selectedRows, selectedDay, currentMonth])

    const selectedAreaDetailRows = useMemo(() => {
        if (!selectedDay || !selectedArea) return []

        const seen = new Set<string>()
        return selectedRows
            .filter(
                (row) =>
                    row.area === selectedArea &&
                    ALLOWED_PUESTOS.has(row.puesto || "") &&
                    isIncidence(row.days[selectedDay]),
            )
            .filter((row) => {
                if (seen.has(row.numero_empleado)) return false
                seen.add(row.numero_empleado)
                return true
            })
            .map((row, idx) => ({
                key: `${row.numero_empleado}||${row.area}||${idx}`,
                numero_empleado: row.numero_empleado,
                nombre: row.nombre,
                departamento: row.departamento,
                area: row.area,
                puesto: row.puesto,
                turno: row.turno || "-",
                tipo_incidencia: row.days[selectedDay] || "-",
            }))
    }, [selectedRows, selectedDay, selectedArea])

    const selectedDayCounts = useMemo(() => {
        const base = INCIDENT_TABS.reduce((acc, c) => ({ ...acc, [c]: 0 }), {} as Record<IncidentTab, number>)
        if (!selectedDay) return base
        return selectedRows.reduce((acc, row) => {
            const code = row.days[selectedDay]
            if (!isIncidence(code) || !isIncidentTab(code!)) return acc
            acc[code] = (acc[code] || 0) + 1
            return acc
        }, base)
    }, [selectedRows, selectedDay])

    const daysWithData = useMemo(() => {
        return dayHeaders.filter(day => dayAusentismoPct[day] !== undefined || (daySummaries[day] ?? 0) > 0)
    }, [dayHeaders, dayAusentismoPct, daySummaries])

    const currentDayIndex = selectedDay ? daysWithData.indexOf(selectedDay) : -1
    const prevDay = currentDayIndex > 0 ? daysWithData[currentDayIndex - 1] : null
    const nextDay = currentDayIndex !== -1 && currentDayIndex < daysWithData.length - 1 ? daysWithData[currentDayIndex + 1] : null

    const selectedDateTitle = useMemo(() => {
        if (!selectedDay || !currentMonth) return ""
        try {
            const dateStr = `${currentMonth}-${selectedDay}`
            const date = new Date(dateStr + "T00:00:00")

            const weekday = format(date, "EEEE", { locale: es })
            const day = format(date, "d", { locale: es })
            const month = format(date, "MMMM", { locale: es })
            const year = format(date, "yyyy", { locale: es })

            const capWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1)
            const capMonth = month.charAt(0).toUpperCase() + month.slice(1)
            const weekNum = getISOWeek(date)

            return `${capWeekday} ${day} ${capMonth} ${year} - Semana ${weekNum}`
        } catch {
            return `Incidencias — día ${parseInt(selectedDay, 10)}`
        }
    }, [selectedDay, currentMonth])

    const monthFirstDay = currentMonth ? (() => {
        const [year, month] = currentMonth.split("-").map(Number)
        return new Date(year, month - 1, 1).getDay()
    })() : 0

    const selectedMonthHolidayLabels = useMemo(() => {
        if (!currentMonth) return {} as Record<string, string>
        const [year] = currentMonth.split("-").map(Number)
        return getMexicoHolidayLabels(year)
    }, [currentMonth])

    const calendarCells = Array.from({ length: dayCount + monthFirstDay }, (_, i) =>
        i < monthFirstDay ? null : String(i - monthFirstDay + 1).padStart(2, "0"),
    )

    const processFile = useCallback(async (file: File) => {
        if (file.type !== "application/json" && !file.name.endsWith('.json')) {
            sileo.error({ title: "Formato de archivo inválido", description: "Por favor, asegúrate de subir el archivo correcto." })
            return
        }

        setErrors([])
        setProcessStep("reading")
        const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

        try {
            await delay(1200) // Simulación de lectura (más tiempo)
            const text = await file.text()
            
            setProcessStep("validating")
            await delay(2000) // Simulación de validación (más tiempo)

            const json = JSON.parse(text)
            const { rows: parsed, errors: errs } = parseReporteJSON(json)
            
            if (errs.length > 0) { 
                setProcessStep(null)
                setErrors(errs)
                sileo.error({ title: "Inconsistencias en el archivo", description: "Se encontraron errores al revisar los datos." })
                return 
            }
            
            setPreviewData({
                rows: parsed,
                mes: parsed[0]?.mes ?? "",
                fileName: file.name,
                jsonRaw: json
            })
            setProcessStep(null)
        } catch (err) {
            setProcessStep(null)
            const msg = `Error al revisar el archivo: ${err instanceof Error ? err.message : String(err)}`
            setErrors([msg])
            sileo.error({ title: "Archivo corrupto", description: "El archivo no tiene la estructura esperada." })
        }
    }, [])

    const confirmLoad = useCallback(async () => {
        if (!previewData) return
        setProcessStep("generating")
        const delay = (ms: number) => new Promise(res => setTimeout(res, ms))
        await delay(1500) // Simulación de generación (más tiempo)

        setRows(previewData.rows)
        setSelectedMes(previewData.mes)
        setFileName(previewData.fileName)
        sessionStorage.setItem("reporteDiarioCache", JSON.stringify(previewData.jsonRaw))
        
        setProcessStep(null)
        setPreviewData(null)
        sileo.success({ title: "Reporte cargado", description: `Información de ${formatMes(previewData.mes)} cargada con éxito.` })
    }, [previewData])

    const cancelLoad = useCallback(() => {
        setPreviewData(null)
        setProcessStep(null)
    }, [])

    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        await processFile(file)
    }, [processFile])

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files[0]
        if (!file) return
        await processFile(file)
    }, [processFile])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        if (!isDragging) setIsDragging(true)
    }, [isDragging])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        // Solo quitamos isDragging si salimos del documento principal
        if (e.relatedTarget === null || (e.relatedTarget as HTMLElement).nodeName === "HTML") {
            setIsDragging(false)
        }
    }, [])

    const handleClearFile = useCallback(() => {
        setRows([])
        setFileName("")
        setErrors([])
        sessionStorage.removeItem("reporteDiarioCache")
        sileo.info({ title: "Vista de datos limpiada" })
    }, [])

    const computeKpis = useCallback((reportRows: ReporteRow[], dayH: string[]) => {
        let totalIncidencias = 0
        let totalAsistencias = 0
        let totalDaysTracked = 0
        for (const row of reportRows) {
            for (const day of dayH) {
                const code = row.days[day]
                if (!code || code === "-" || code === "X") continue
                totalDaysTracked++
                if (code === "A") totalAsistencias++
                else if (isIncidence(code)) totalIncidencias++
            }
        }
        const tasaAsistencia = totalDaysTracked > 0
            ? Math.round((totalAsistencias / totalDaysTracked) * 100 * 100) / 100
            : 0
        return { totalIncidencias, tasaAsistencia }
    }, [])

    const heroKpis = useMemo(
        () => computeKpis(selectedRows, dayHeaders),
        [computeKpis, selectedRows, dayHeaders],
    )

    const handleSaveToDb = useCallback(async () => {
        if (!currentMonth || rows.length === 0) return
        const monthRows = rows.filter((r) => r.mes === currentMonth)
        const dCount = daysInMonth(currentMonth)
        const dHeaders = Array.from({ length: dCount }, (_, i) => String(i + 1).padStart(2, "0"))
        const { totalIncidencias, tasaAsistencia } = computeKpis(monthRows, dHeaders)

        const diasDisponibles = monthRows.length * dCount
        let totalAusentismo = 0
        for (const row of monthRows) {
            for (const day of dHeaders) {
                const code = row.days[day]
                if (code === "F" || code === "P" || code === "I") {
                    totalAusentismo++
                }
            }
        }
        const pctAusentismo = diasDisponibles > 0
            ? Math.round((totalAusentismo / diasDisponibles) * 100 * 100) / 100
            : 0

        const result = await saveReport({
            mes: currentMonth,
            data: monthRows,
            total_empleados: monthRows.length,
            total_incidencias: totalIncidencias,
            tasa_asistencia: tasaAsistencia,
            dias_disponibles: diasDisponibles,
            total_ausentismo: totalAusentismo,
            pct_ausentismo: pctAusentismo,
        })
        if (result.success) {
            setSaveSuccess(true)
            setTimeout(() => setSaveSuccess(false), 3500)
            const updated = await fetchSummaries()
            setSavedSummaries(updated)
        }
    }, [currentMonth, rows, computeKpis, saveReport, fetchSummaries])

    const handleLoadFromDb = useCallback(async (mes: string) => {
        const record = await fetchByMes(mes)
        if (!record) return
        const { rows: parsed, errors: errs } = parseReporteJSON(record.data as unknown[])
        if (errs.length > 0) {
            setErrors(errs)
            return
        }
        setRows(parsed)
        setSelectedMes(mes)
        setFileName(formatMes(mes))
        setErrors([])
    }, [fetchByMes])

    const handleDeleteFromDb = useCallback(async (id: string) => {
        const result = await deleteReport(id)
        if (result.success) {
            const updated = await fetchSummaries()
            setSavedSummaries(updated)
        }
    }, [deleteReport, fetchSummaries])

    const handleExportPdf = useCallback(async () => {
        if (!selectedDay || !currentMonth) return

        const jsPDF = (await import("jspdf")).default
        const autoTable = (await import("jspdf-autotable")).default
        const { addReportFooter } = await import("@/lib/pdf-footer")

        const doc = new jsPDF()
        const dayNum = parseInt(selectedDay, 10)
        const title = `Reporte Diario — ${formatMes(currentMonth)} — Día ${dayNum}`

        doc.setFontSize(14)
        doc.text(title, 14, 20)

        let y = 30

        doc.setFontSize(11)
        doc.text("Resumen por Área", 14, y)
        y += 4
        autoTable(doc, {
            startY: y,
            head: [["Área", "Autorizado", "Activo", "Incidencias", "Personal Real"]],
            body: selectedDayAreaSummary.map((a) => [
                a.area, a.personal_autorizado, a.personal_activo, a.personal_incidencia, a.personal_real,
            ]),
            styles: { fontSize: 8 },
        })

        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

        for (const code of INCIDENT_TABS) {
            const rows = selectedDayIncidentSummary[code]
            if (rows.length === 0) continue

            if (y > 260) { doc.addPage(); y = 20 }

            doc.setFontSize(11)
            doc.text(`${INCIDENCIA_LABELS[code] ?? code} (${rows.length})`, 14, y)
            y += 4
            autoTable(doc, {
                startY: y,
                head: [["Empleado", "# Empleado", "Departamento", "Área", "Turno"]],
                body: rows.map((r) => [r.nombre, r.numero_empleado, r.departamento, r.area, r.turno]),
                styles: { fontSize: 8 },
            })
            y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
        }

        addReportFooter(doc)
        doc.save(`reporte-diario-${currentMonth}-dia-${selectedDay}.pdf`)
    }, [selectedDay, currentMonth, selectedDayAreaSummary, selectedDayIncidentSummary])

    const labelCls = "block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5"

    const hasData = rows.length > 0 && Boolean(currentMonth)

    return (
        <div className="reporte-container">

            {/* ── Header ───────────────────────────────────────────────── */}
            <header className="reporte-card">
                <div className="reporte-header__top">
                    <div className="reporte-title-wrapper">
                        <h1 className="reporte-title">Reporte Diario</h1>
                        <p className="reporte-subtitle">Asistencia e incidencias · planta Querétaro</p>
                        {fileName && hasData && (
                            <div className="reporte-status-banner reporte-status-banner--file" data-testid="reporte-filename">
                                <FileJson size={16} className="text-primary" aria-hidden="true" />
                                <span>{fileName}</span>
                                <button
                                    type="button"
                                    onClick={handleClearFile}
                                    title="Limpiar archivo actual"
                                    aria-label="Limpiar archivo actual"
                                    className="reporte-iconbtn"
                                    data-testid="clear-file-btn"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="reporte-control-group">
                        {hasData && (
                            <>
                                <button
                                    type="button"
                                    className="reporte-btn-primary"
                                    onClick={handleSaveToDb}
                                    disabled={dbSaving}
                                    data-testid="save-report-btn"
                                >
                                    <Save size={16} />
                                    {savedSummaries.some((s) => s.mes === currentMonth) ? "Actualizar mes" : "Guardar mes"}
                                </button>
                                <span className="reporte-status-banner reporte-status-banner--warn">
                                    {heroKpis.totalIncidencias} incidencias
                                </span>
                                <span className="reporte-status-banner">
                                    {formatMes(currentMonth)}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={handleFileChange}
                style={{display: 'none'}}
            />

            {/* ── Top Grid (Acciones & Insights) ─────────────────────────────────────────── */}
            <div className="reporte-grid-4">
                {(savedSummaries.length >= 2) && (
                    <ReporteComparison summaries={savedSummaries} />
                )}
                {(savedSummaries.length > 0) && (
                    <ReportesGuardadosDialog 
                        savedSummaries={savedSummaries}
                        dbSaving={dbSaving}
                        onLoad={handleLoadFromDb}
                        onDelete={handleDeleteFromDb}
                        formatMes={formatMes}
                    />
                )}
                

            </div>

            {hasData ? (
                <div className="reporte-container">

            {/* ── KPI Dashboard ─────────────────────────────────────────── */}
            {currentMonth && rows.length > 0 && (
                <ReporteKpiDashboard
                    selectedRows={selectedRows}
                    dayHeaders={dayHeaders}
                    currentMonth={currentMonth}
                />
            )}

            {/* ── Calendar ─────────────────────────────────────────────── */}
            {currentMonth && rows.length > 0 && (
                <div className="reporte-card">
                    <div className="reporte-card__header">
                        <div className="reporte-flex-between">
                            <div>
                                <p className="reporte-card__title">Calendario mensual</p>
                                <p className="reporte-card__description">
                                    Selecciona un día para ver el detalle de incidencias.
                                </p>
                            </div>
                            <span className="reporte-status-banner">
                                {formatMes(currentMonth)}
                            </span>
                        </div>
                    </div>

                    <div className="reporte-card__content">
                        <ReporteCalendar
                            calendarCells={calendarCells}
                            daySummaries={daySummaries}
                            dayAusentismoPct={dayAusentismoPct}
                            selectedDay={selectedDay}
                            selectedMonthHolidayLabels={selectedMonthHolidayLabels}
                            currentMonth={currentMonth}
                            onSelectDay={setSelectedDay}
                        />
                    </div>
                </div>
            )}

            {/* ── Detalle del día ──── */}
            <div className="reporte-card">
                <div className="reporte-card__header">
                    <h3 className="reporte-card__title">
                        <Calendar size={20} className="text-primary" aria-hidden="true" />
                        Reporte Diario de Asistencia
                    </h3>
                    <div className="reporte-dayhead">
                        <div className="reporte-dayhead__title">
                            <Calendar size={16} style={{ color: 'var(--color-muted)', flexShrink: 0 }} aria-hidden="true" />
                            <p data-testid="selected-day-title">
                                {selectedDay ? selectedDateTitle : "Detalle del día"}
                            </p>
                        </div>
                        {selectedDay && (
                            <div className="reporte-dayhead__actions">
                                <div className="reporte-daynav">
                                    <button
                                        type="button"
                                        className="reporte-daynav__btn"
                                        onClick={() => prevDay && setSelectedDay(prevDay)}
                                        disabled={!prevDay}
                                        title="Día anterior"
                                        aria-label="Día anterior"
                                        data-testid="prev-day-btn"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        className="reporte-daynav__btn"
                                        onClick={() => nextDay && setSelectedDay(nextDay)}
                                        disabled={!nextDay}
                                        title="Día siguiente"
                                        aria-label="Día siguiente"
                                        data-testid="next-day-btn"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleExportPdf}
                                    className="reporte-tab-trigger"
                                    data-testid="export-pdf-btn"
                                >
                                    <Download size={14} />
                                    PDF
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="reporte-card__content">
                    {!selectedDay ? (
                        <p className="reporte-placeholder">
                            Selecciona un día en el calendario.
                        </p>
                    ) : (
                        <>
                            <ReporteAreaSummary
                                areas={selectedDayAreaSummary}
                                selectedArea={selectedArea}
                                onSelectArea={setSelectedArea}
                                detailRows={selectedAreaDetailRows}
                            />

                            <ReporteIncidentTabs
                                selectedTab={selectedIncidentTab}
                                onSelectTab={setSelectedIncidentTab}
                                dayCounts={selectedDayCounts}
                                incidentSummary={selectedDayIncidentSummary}
                            />
                        </>
                    )}
                </div>
            </div>
                </div>
            ) : (
                <div
                    className="reporte-empty"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click(); } }}
                    data-testid="upload-dropzone"
                >
                    <CloudUpload size={48} className="reporte-empty__icon" aria-hidden="true" />
                    <h3 className="reporte-card__title">Sube tu reporte diario</h3>
                    <p className="reporte-subtitle">
                        Arrastra y suelta tu archivo de datos aquí, o haz clic para seleccionarlo.
                    </p>
                </div>
            )}

            {/* ── Errors ───────────────────────────────────────────────── */}
            {errors.length > 0 && (
                <div className="reporte-status-banner error reporte-errors" role="alert" data-testid="errors-banner">
                    <AlertCircle size={16} aria-hidden="true" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="reporte-flex-between">
                            <strong>Errores de formato</strong>
                            <button
                                type="button"
                                onClick={() => setErrors([])}
                                className="reporte-iconbtn"
                                aria-label="Cerrar errores"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <ul>
                            {errors.map((err, i) => (
                                <li key={i}>{err}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* ── Employee Detail Modal ────────────────────────────────── */}
            <ReporteEmployeeDetail
                open={empDetailOpen}
                onClose={() => { setEmpDetailOpen(false); setSelectedEmployee("") }}
                employee={selectedRows.find((r) => r.numero_empleado === selectedEmployee) ?? null}
                dayHeaders={dayHeaders}
                currentMonth={currentMonth}
            />

            {/* ── Preview Modal ────────────────────────────────── */}
            <Modal
                isOpen={!!previewData}
                onClose={cancelLoad}
                title="Revisión rápida del archivo"
                icon={<FileJson />}
                footerActions={
                    <div className="reporte-control-group">
                        <button onClick={cancelLoad} className="reporte-tab-trigger">Cancelar</button>
                        <button onClick={confirmLoad} className="reporte-tab-trigger" style={{background: 'var(--color-primary)', color: 'white', borderRadius: 'var(--rounded-md)'}}>
                            <Check size={16} />
                            Sí, cargar datos
                        </button>
                    </div>
                }
            >
                {previewData && (
                    <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', padding: 'var(--spacing-md) 0'}}>
                        <div className="reporte-status-banner">
                            <FileJson size={24} style={{color: 'var(--color-primary)'}} />
                            <div>
                                <p style={{fontWeight: 'var(--type-body-strong-weight)'}}>{previewData.fileName}</p>
                                <p className="reporte-subtitle">
                                    Se encontraron {previewData.rows.length} registros para el mes de {formatMes(previewData.mes)}.
                                </p>
                            </div>
                        </div>
                        <p style={{textAlign: 'center', fontSize: 'var(--type-body-md-size)'}}>¿Deseas aplicar esta información en tu tablero?</p>
                    </div>
                )}
            </Modal>

            {/* ── Processing Overlay ────────────────────────────────── */}
            <AnimatePresence>
                {processStep && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="reporte-overlay"
                        role="status"
                        aria-live="polite"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 10 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 10 }}
                            className="reporte-overlay__card"
                        >
                            <Loader2 size={40} className="animate-spin" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
                            <h2 className="reporte-overlay__title">
                                {processStep === "reading" && "Leyendo archivo..."}
                                {processStep === "validating" && "Revisando incidencias..."}
                                {processStep === "generating" && "Construyendo tu tablero..."}
                            </h2>
                            <p className="reporte-subtitle">
                                {processStep === "reading" && "Por favor, espera un momento."}
                                {processStep === "validating" && "Asegurando que la información sea correcta."}
                                {processStep === "generating" && "Solo tomará un segundo más."}
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Save Overlay ────────────────────────────────── */}
            <AnimatePresence>
                {(dbSaving || saveSuccess) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="reporte-overlay"
                        style={{ zIndex: 50 }}
                        role="status"
                        aria-live="polite"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="reporte-overlay__card"
                        >
                            <AnimatePresence mode="wait">
                                {saveSuccess ? (
                                    <motion.div key="success" initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} className="reporte-overlay__badge reporte-overlay__badge--success">
                                        <Check size={32} />
                                    </motion.div>
                                ) : (
                                    <motion.div key="saving" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="reporte-overlay__badge reporte-overlay__badge--primary">
                                        <Loader2 size={32} className="animate-spin" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <motion.h2 className="reporte-overlay__title">
                                {saveSuccess ? "¡Guardado Exitoso!" : "Guardando reporte..."}
                            </motion.h2>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Global Drag Overlay ────────────────────────────────── */}
            <AnimatePresence>
                {isDragging && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="reporte-drag"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.8, y: 20 }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}
                        >
                            <FileJson size={64} style={{ color: 'var(--color-primary)', marginBottom: 'var(--spacing-lg)' }} aria-hidden="true" />
                            <h2 className="reporte-card__title">Suelta tu archivo aquí</h2>
                            <p className="reporte-subtitle">El reporte se generará automáticamente</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

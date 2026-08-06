import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./ReporteDiario.css";

import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { SkeletonTable } from "@/components/ui/PageSkeletons";
import { AnimatedSubmitButton } from "@/components/ui/AnimatedSubmitButton";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { sileo } from "@/lib/notify";
import { format, getISOWeek } from "date-fns";
import { es } from "date-fns/locale";

import {
  AlertCircle,
  BarChart2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  FileJson,
  Loader2,
  Search,
  X,
} from "lucide-react";

import { Check as CheckIconData, Save as SaveIconData } from "lucide";

import {
  INCIDENT_TABS,
  INCIDENCIA_LABELS,
  SECTION_CONFIGS,
  VISIBLE_SECTIONS,
} from "./constants";

import {
  daysInMonth,
  formatMes,
  getMexicoHolidayLabels,
  isIncidence,
  isIncidentTab,
  parseReporteJSON,
} from "./helpers";

import type {
  AreaStaffSummary,
  EmployeeRef,
  IncidentTab,
  ReporteRow,
} from "./types";

import ReporteCalendar from "./reporte-calendar";
import ReporteAreaSummary from "./reporte-area-summary";
import ReporteIncidentTabs from "./reporte-incident-tabs";
import ReporteKpiDashboard from "./reporte-kpi-dashboard";
import ReporteComparison from "./reporte-comparison";
import ReporteEmployeeDetail from "./reporte-employee-detail";
import ReportesGuardadosDialog from "./reportes-guardados-dialog";

import { useReporteDiario } from "@/hooks/useReporteDiario";
import type { ReporteDiarioSummary } from "@/hooks/useReporteDiario";

const LOAD_SUCCESS_DURATION_MS = 1200;
const SAVE_SUCCESS_DURATION_MS = 1500;

function hasCachedReport() {
  if (typeof window === "undefined") return false;

  try {
    return Boolean(window.sessionStorage.getItem("reporteDiarioCache"));
  } catch {
    return false;
  }
}

function createEmptyIncidentSummary() {
  return INCIDENT_TABS.reduce(
    (acc, code) => {
      acc[code] = [];
      return acc;
    },
    {} as Record<IncidentTab, EmployeeRef[]>,
  );
}

export default function ReporteDiarioContent() {
  const [rows, setRows] = useState<ReporteRow[]>([]);
  const [selectedMes, setSelectedMes] = useState("");
  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [empDetailOpen, setEmpDetailOpen] = useState(false);
  const [departamentoFilter] = useState("");
  const [turnoFilter] = useState("");
  const [selectedIncidentTab, setSelectedIncidentTab] = useState<
    IncidentTab | ""
  >("");
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [loadSuccess, setLoadSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [, setPanelCollapsed] = useState(hasCachedReport);
  const [topEmpModalOpen, setTopEmpModalOpen] = useState(false);
  const [selectedTopEmpKey, setSelectedTopEmpKey] = useState<string | null>(
    null,
  );
  const [drillDownMonth, setDrillDownMonth] = useState<{
    empKey: string;
    mes: string;
  } | null>(null);

  const [processStep, setProcessStep] = useState<
    "reading" | "validating" | null
  >(null);

  const [previewData, setPreviewData] = useState<{
    rows: ReporteRow[];
    mes: string;
    fileName: string;
    jsonRaw: unknown;
  } | null>(null);

  const [savedSummaries, setSavedSummaries] = useState<ReporteDiarioSummary[]>(
    [],
  );
  const [loadingDb, setLoadingDb] = useState(true);
  const [allMonthsRows, setAllMonthsRows] = useState<ReporteRow[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadSuccessTimerRef = useRef<number | null>(null);
  const saveSuccessTimerRef = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();

  const enterFromBelow = reduceMotion ? false : { opacity: 0, y: 8 };
  const enterFromRight = reduceMotion ? false : { opacity: 0, x: 24 };
  const enterFromLeft = reduceMotion ? false : { opacity: 0, x: -24 };

  const overlayPanelInitial = reduceMotion
    ? false
    : { opacity: 0, scale: 0.96, y: 12 };

  const exitToRight = reduceMotion ? undefined : { opacity: 0, x: 24 };
  const exitToLeft = reduceMotion ? undefined : { opacity: 0, x: -24 };

  const {
    saving: dbSaving,
    fetchSummaries,
    fetchByMes,
    fetchByMesList,
    saveReport,
    deleteReport,
  } = useReporteDiario();

  useEffect(() => {
    return () => {
      if (loadSuccessTimerRef.current !== null) {
        window.clearTimeout(loadSuccessTimerRef.current);
      }

      if (saveSuccessTimerRef.current !== null) {
        window.clearTimeout(saveSuccessTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!saveError) return;

    const timer = window.setTimeout(() => {
      setSaveError(null);
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [saveError]);

  useEffect(() => {
    try {
      const cached = window.sessionStorage.getItem("reporteDiarioCache");
      if (!cached) return;

      const json: unknown = JSON.parse(cached);
      const { rows: parsed, errors: parseErrors } = parseReporteJSON(json);

      if (parseErrors.length === 0 && parsed.length > 0) {
        setRows(parsed);
        setSelectedMes(parsed[0]?.mes ?? "");
        setFileName("Autoguardado");
      }
    } catch {
      // La caché es opcional.
    }
  }, []);

  useEffect(() => {
    let active = true;

    void fetchSummaries()
      .then((data) => {
        if (active) {
          setSavedSummaries(data);
        }
      })
      .finally(() => {
        if (active) {
          setLoadingDb(false);
        }
      });

    return () => {
      active = false;
    };
  }, [fetchSummaries]);

  useEffect(() => {
    let active = true;

    if (savedSummaries.length === 0) {
      setAllMonthsRows([]);
      return () => {
        active = false;
      };
    }

    const mesList = savedSummaries.map((summary) => summary.mes);

    void fetchByMesList(mesList).then((records) => {
      if (!active) return;

      const combined: ReporteRow[] = [];

      for (const record of records) {
        const { rows: parsed } = parseReporteJSON(record.data as unknown[]);
        combined.push(...parsed);
      }

      setAllMonthsRows(combined);
    });

    return () => {
      active = false;
    };
  }, [savedSummaries, fetchByMesList]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("reporte-diario:changed"));
  }, [rows, savedSummaries]);

  const months = useMemo(
    () => Array.from(new Set(rows.map((row) => row.mes))).sort(),
    [rows],
  );

  const currentMonth = selectedMes || months[0] || "";
  const dayCount = currentMonth ? daysInMonth(currentMonth) : 0;

  const dayHeaders = useMemo(
    () =>
      Array.from({ length: dayCount }, (_, index) =>
        String(index + 1).padStart(2, "0"),
      ),
    [dayCount],
  );

  const topIncidenceEmployees = useMemo(() => {
    const dbMeses = new Set(allMonthsRows.map((row) => row.mes));
    const currentMes = rows[0]?.mes ?? null;

    const analysisRowsRaw: ReporteRow[] =
      currentMes && !dbMeses.has(currentMes)
        ? [...allMonthsRows, ...rows]
        : allMonthsRows;

    const analysisRows = analysisRowsRaw.filter(
      (row) =>
        VISIBLE_SECTIONS.has(row.departamento) ||
        VISIBLE_SECTIONS.has(row.area),
    );

    if (analysisRows.length === 0) return [];

    const employeeMap = new Map<
      string,
      {
        numero_empleado: string;
        nombre: string;
        departamento: string;
        area: string;
        total: number;
        byCode: Record<string, number>;
        byMes: Record<string, number>;
      }
    >();

    for (const row of analysisRows) {
      const employeeKey = row.numero_empleado;

      if (!employeeMap.has(employeeKey)) {
        employeeMap.set(employeeKey, {
          numero_empleado: row.numero_empleado,
          nombre: row.nombre,
          departamento: row.departamento,
          area: row.area,
          total: 0,
          byCode: {},
          byMes: {},
        });
      }

      const employee = employeeMap.get(employeeKey);
      if (!employee) continue;

      for (const code of Object.values(row.days)) {
        if (!isIncidence(code)) continue;
        if (code === "I" || code === "V") continue;

        employee.total += 1;
        employee.byCode[code] = (employee.byCode[code] ?? 0) + 1;
        employee.byMes[row.mes] = (employee.byMes[row.mes] ?? 0) + 1;
      }
    }

    return Array.from(employeeMap.values())
      .filter((employee) => employee.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [allMonthsRows, rows]);

  const selectedRows = useMemo(() => {
    const lowerSearch = search.trim().toLowerCase();

    return rows
      .filter((row) => row.mes === currentMonth)
      .filter(
        (row) =>
          VISIBLE_SECTIONS.has(row.departamento) ||
          VISIBLE_SECTIONS.has(row.area),
      )
      .filter((row) => {
        if (departamentoFilter && row.departamento !== departamentoFilter) {
          return false;
        }

        if (turnoFilter && row.turno !== turnoFilter) {
          return false;
        }

        if (!lowerSearch) return true;

        return (
          row.nombre.toLowerCase().includes(lowerSearch) ||
          row.numero_empleado.toLowerCase().includes(lowerSearch) ||
          row.departamento.toLowerCase().includes(lowerSearch) ||
          row.area.toLowerCase().includes(lowerSearch)
        );
      });
  }, [rows, currentMonth, search, departamentoFilter, turnoFilter]);

  const searchResults = useMemo(() => {
    if (!search.trim() || !currentMonth) return [];
    return selectedRows.slice(0, 12);
  }, [search, selectedRows, currentMonth]);

  const clearSearch = useCallback(() => {
    setSearch("");
  }, []);

  const openEmployeeModal = useCallback((employeeId: string) => {
    setSelectedEmployee(employeeId);
    setEmpDetailOpen(true);
  }, []);

  const daySummaries = useMemo(() => {
    return dayHeaders.reduce<Record<string, number>>((accumulator, day) => {
      accumulator[day] = selectedRows.reduce((count, row) => {
        return count + (isIncidence(row.days[day]) ? 1 : 0);
      }, 0);

      return accumulator;
    }, {});
  }, [dayHeaders, selectedRows]);

  const dayAusentismoPct = useMemo(() => {
    const total = selectedRows.length;

    if (total === 0) {
      return {} as Record<string, number>;
    }

    return dayHeaders.reduce<Record<string, number>>((accumulator, day) => {
      const hasAnyCode = selectedRows.some((row) => Boolean(row.days[day]));

      if (!hasAnyCode) {
        return accumulator;
      }

      const ausentes = selectedRows.reduce((count, row) => {
        const code = row.days[day];
        return count + (code === "F" || code === "P" || code === "I" ? 1 : 0);
      }, 0);

      accumulator[day] = Math.round((ausentes / total) * 100 * 100) / 100;

      return accumulator;
    }, {});
  }, [dayHeaders, selectedRows]);

  const selectedDayIncidentSummary = useMemo(() => {
    const result = createEmptyIncidentSummary();

    if (!selectedDay) return result;

    selectedRows.forEach((row, index) => {
      const code = row.days[selectedDay];

      if (!isIncidence(code) || !isIncidentTab(code)) return;

      result[code].push({
        key: `${code}||${row.departamento}||${row.area}||${
          row.turno || "-"
        }||${row.numero_empleado}||${index}`,
        numero_empleado: row.numero_empleado,
        nombre: row.nombre,
        departamento: row.departamento,
        area: row.area,
        turno: row.turno || "-",
      });
    });

    for (const tab of INCIDENT_TABS) {
      result[tab].sort((a, b) => a.area.localeCompare(b.area));
    }

    return result;
  }, [selectedRows, selectedDay]);

  const selectedDayAreaSummary = useMemo<AreaStaffSummary[]>(() => {
    const visibleSections = SECTION_CONFIGS.filter((section) =>
      VISIBLE_SECTIONS.has(section.seccion),
    );

    if (!selectedDay) {
      return visibleSections.map((section) => ({
        area: section.seccion,
        personal_activo: 0,
        personal_autorizado: section.personal_autorizado,
        personal_incidencia: 0,
        personal_real: section.personal_autorizado,
        operadores_autorizados: section.operadores_autorizados,
        operadores_contratados: 0,
        operadores_incidencia: 0,
      }));
    }

    let dayOfWeek = -1;

    if (currentMonth) {
      const [year, month] = currentMonth.split("-").map(Number);
      dayOfWeek = new Date(
        year,
        month - 1,
        Number.parseInt(selectedDay, 10),
      ).getDay();
    }

    return visibleSections.map((section) => {
      const rowsInSection = selectedRows.filter((row) => {
        const effectiveSection = VISIBLE_SECTIONS.has(row.area)
          ? row.area
          : row.departamento;

        return effectiveSection === section.seccion;
      });

      const personalActivo = rowsInSection.length;

      const personalIncidencia = rowsInSection.reduce((count, row) => {
        return count + (isIncidence(row.days[selectedDay]) ? 1 : 0);
      }, 0);

      const operadoresRows = rowsInSection.filter(
        (row) =>
          row.puesto?.toUpperCase().includes("OPERADOR DE MÁQUINA") ?? false,
      );

      const operadoresContratados = operadoresRows.length;

      const operadoresIncidencia = operadoresRows.reduce((count, row) => {
        return count + (isIncidence(row.days[selectedDay]) ? 1 : 0);
      }, 0);

      let isDescanso = false;

      if (dayOfWeek !== -1) {
        if (section.seccion === "PRODUCCIÓN 1ER. TURNO" && dayOfWeek === 0) {
          isDescanso = true;
        } else if (
          section.seccion === "PRODUCCIÓN 2o. TURNO" &&
          (dayOfWeek === 1 || dayOfWeek === 2)
        ) {
          isDescanso = true;
        } else if (
          section.seccion === "PRODUCCIÓN 3ER. TURNO" &&
          (dayOfWeek === 3 || dayOfWeek === 4)
        ) {
          isDescanso = true;
        } else if (
          section.seccion === "PRODUCCIÓN 4o. TURNO" &&
          (dayOfWeek === 5 || dayOfWeek === 6)
        ) {
          isDescanso = true;
        }
      }

      return {
        area: section.seccion,
        personal_activo: personalActivo,
        personal_autorizado: section.personal_autorizado,
        operadores_autorizados: section.operadores_autorizados,
        operadores_contratados: operadoresContratados,
        operadores_incidencia: operadoresIncidencia,
        personal_incidencia: personalIncidencia,
        personal_real: Math.max(personalActivo - personalIncidencia, 0),
        is_descanso: isDescanso,
      };
    });
  }, [selectedRows, selectedDay, currentMonth]);

  const selectedAreaDetailRows = useMemo(() => {
    if (!selectedDay || !selectedArea) return [];

    const seen = new Set<string>();

    return selectedRows
      .filter((row) => {
        const effectiveSection = VISIBLE_SECTIONS.has(row.area)
          ? row.area
          : row.departamento;

        return (
          effectiveSection === selectedArea &&
          isIncidence(row.days[selectedDay])
        );
      })
      .filter((row) => {
        if (seen.has(row.numero_empleado)) return false;

        seen.add(row.numero_empleado);
        return true;
      })
      .map((row, index) => ({
        key: `${row.numero_empleado}||${row.area}||${index}`,
        numero_empleado: row.numero_empleado,
        nombre: row.nombre,
        departamento: row.departamento,
        area: row.area,
        puesto: row.puesto,
        turno: row.turno || "-",
        tipo_incidencia: row.days[selectedDay] || "-",
      }));
  }, [selectedRows, selectedDay, selectedArea]);

  const selectedDayCounts = useMemo(() => {
    const result = INCIDENT_TABS.reduce(
      (accumulator, code) => {
        accumulator[code] = 0;
        return accumulator;
      },
      {} as Record<IncidentTab, number>,
    );

    if (!selectedDay) return result;

    for (const row of selectedRows) {
      const code = row.days[selectedDay];

      if (!isIncidence(code) || !isIncidentTab(code)) continue;

      result[code] = (result[code] ?? 0) + 1;
    }

    return result;
  }, [selectedRows, selectedDay]);

  const daysWithData = useMemo(() => {
    return dayHeaders.filter(
      (day) =>
        dayAusentismoPct[day] !== undefined || (daySummaries[day] ?? 0) > 0,
    );
  }, [dayHeaders, dayAusentismoPct, daySummaries]);

  const currentDayIndex = selectedDay ? daysWithData.indexOf(selectedDay) : -1;

  const prevDay =
    currentDayIndex > 0 ? daysWithData[currentDayIndex - 1] : null;

  const nextDay =
    currentDayIndex !== -1 && currentDayIndex < daysWithData.length - 1
      ? daysWithData[currentDayIndex + 1]
      : null;

  const selectedDateTitle = useMemo(() => {
    if (!selectedDay || !currentMonth) return "";

    try {
      const date = new Date(`${currentMonth}-${selectedDay}T00:00:00`);

      const weekday = format(date, "EEEE", { locale: es });
      const day = format(date, "d", { locale: es });
      const month = format(date, "MMMM", { locale: es });
      const year = format(date, "yyyy", { locale: es });

      const capitalizedWeekday =
        weekday.charAt(0).toUpperCase() + weekday.slice(1);

      const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);

      const weekNumber = getISOWeek(date);

      return `${capitalizedWeekday} ${day} ${capitalizedMonth} ${year} - Semana ${weekNumber}`;
    } catch {
      return `Incidencias — día ${Number.parseInt(selectedDay, 10)}`;
    }
  }, [selectedDay, currentMonth]);

  const monthFirstDay = useMemo(() => {
    if (!currentMonth) return 0;

    const [year, month] = currentMonth.split("-").map(Number);
    return new Date(year, month - 1, 1).getDay();
  }, [currentMonth]);

  const selectedMonthHolidayLabels = useMemo(() => {
    if (!currentMonth) return {} as Record<string, string>;

    const [year] = currentMonth.split("-").map(Number);
    return getMexicoHolidayLabels(year);
  }, [currentMonth]);

  const calendarCells = useMemo(
    () =>
      Array.from({ length: dayCount + monthFirstDay }, (_, index) =>
        index < monthFirstDay
          ? null
          : String(index - monthFirstDay + 1).padStart(2, "0"),
      ),
    [dayCount, monthFirstDay],
  );

  const processFile = useCallback(
    async (file: File) => {
      if (processStep) return;

      const isJsonFile =
        file.type === "application/json" ||
        file.name.toLowerCase().endsWith(".json");

      if (!isJsonFile) {
        sileo.error({ title: "Formato de archivo inválido" });
        return;
      }

      setErrors([]);
      setProcessStep("reading");

      try {
        const text = await file.text();

        setProcessStep("validating");

        const json: unknown = JSON.parse(text);
        const { rows: parsed, errors: parseErrors } = parseReporteJSON(json);

        if (parseErrors.length > 0) {
          setErrors(parseErrors);
          sileo.error({ title: "Inconsistencias en el archivo" });
          return;
        }

        if (parsed.length === 0) {
          setErrors(["El archivo no contiene registros válidos."]);
          sileo.error({ title: "Archivo sin registros" });
          return;
        }

        setPreviewData({
          rows: parsed,
          mes: parsed[0]?.mes ?? "",
          fileName: file.name,
          jsonRaw: json,
        });
      } catch (error) {
        const message = `Error al revisar el archivo: ${
          error instanceof Error ? error.message : String(error)
        }`;

        setErrors([message]);
        sileo.error({ title: "Archivo corrupto" });
      } finally {
        setProcessStep(null);
      }
    },
    [processStep],
  );

  const confirmLoad = useCallback(() => {
    if (!previewData || loadSuccess) return;

    setRows(previewData.rows);
    setSelectedMes(previewData.mes);
    setSelectedDay("");
    setSelectedArea(null);
    setSelectedIncidentTab("");
    setFileName(previewData.fileName);

    try {
      window.sessionStorage.setItem(
        "reporteDiarioCache",
        JSON.stringify(previewData.jsonRaw),
      );
    } catch (error) {
      console.warn("No se pudo actualizar la caché local del reporte:", error);
    }

    setLoadSuccess(true);

    if (loadSuccessTimerRef.current !== null) {
      window.clearTimeout(loadSuccessTimerRef.current);
    }

    loadSuccessTimerRef.current = window.setTimeout(() => {
      setLoadSuccess(false);
      setPreviewData(null);
      setPanelCollapsed(true);
      loadSuccessTimerRef.current = null;
    }, LOAD_SUCCESS_DURATION_MS);

    sileo.success({ title: "Reporte cargado" });
  }, [loadSuccess, previewData]);

  const cancelLoad = useCallback(() => {
    if (loadSuccess) return;

    if (loadSuccessTimerRef.current !== null) {
      window.clearTimeout(loadSuccessTimerRef.current);
      loadSuccessTimerRef.current = null;
    }

    setLoadSuccess(false);
    setPreviewData(null);
    setProcessStep(null);
  }, [loadSuccess]);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const input = event.currentTarget;
      const file = input.files?.[0];

      if (!file) return;

      try {
        await processFile(file);
      } finally {
        input.value = "";
      }
    },
    [processFile],
  );

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLElement>) => {
      event.preventDefault();
      setIsDragging(false);

      const file = event.dataTransfer.files[0];
      if (!file) return;

      await processFile(file);
    },
    [processFile],
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLElement>) => {
      event.preventDefault();

      if (!isDragging) {
        setIsDragging(true);
      }
    },
    [isDragging],
  );

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();

    const relatedTarget = event.relatedTarget;

    if (
      relatedTarget === null ||
      (relatedTarget instanceof HTMLElement &&
        relatedTarget.nodeName === "HTML")
    ) {
      setIsDragging(false);
    }
  }, []);

  const handleClearFile = useCallback(() => {
    setRows([]);
    setSelectedMes("");
    setSelectedDay("");
    setSelectedArea(null);
    setSelectedIncidentTab("");
    setSearch("");
    setFileName("");
    setErrors([]);

    try {
      window.sessionStorage.removeItem("reporteDiarioCache");
    } catch {
      // sessionStorage es opcional.
    }

    sileo.info({ title: "Vista de datos limpiada" });
  }, []);

  const computeKpis = useCallback(
    (reportRows: ReporteRow[], headers: string[]) => {
      let totalIncidencias = 0;
      let totalAsistencias = 0;
      let totalDaysTracked = 0;

      for (const row of reportRows) {
        for (const day of headers) {
          const code = row.days[day];

          if (!code || code === "-" || code === "X") continue;

          totalDaysTracked += 1;

          if (code === "A") {
            totalAsistencias += 1;
          } else if (isIncidence(code)) {
            totalIncidencias += 1;
          }
        }
      }

      const tasaAsistencia =
        totalDaysTracked > 0
          ? Math.round((totalAsistencias / totalDaysTracked) * 100 * 100) / 100
          : 0;

      return {
        totalIncidencias,
        tasaAsistencia,
      };
    },
    [],
  );

  const heroKpis = useMemo(
    () => computeKpis(selectedRows, dayHeaders),
    [computeKpis, selectedRows, dayHeaders],
  );

  const handleSaveToDb = useCallback(async () => {
    setSaveSuccess(false);
    setSaveError(null);

    if (!currentMonth || rows.length === 0 || dbSaving) return;

    const monthRows = rows.filter((row) => row.mes === currentMonth);
    const currentDayCount = daysInMonth(currentMonth);

    const currentDayHeaders = Array.from(
      { length: currentDayCount },
      (_, index) => String(index + 1).padStart(2, "0"),
    );

    const visibleRows = monthRows.filter(
      (row) =>
        VISIBLE_SECTIONS.has(row.departamento) ||
        VISIBLE_SECTIONS.has(row.area),
    );

    const { totalIncidencias, tasaAsistencia } = computeKpis(
      visibleRows,
      currentDayHeaders,
    );

    const diasDisponibles = visibleRows.length * currentDayCount;
    let totalAusentismo = 0;

    for (const row of visibleRows) {
      for (const day of currentDayHeaders) {
        const code = row.days[day];

        if (
          code === "F" ||
          code === "FJ" ||
          code === "S" ||
          code === "P" ||
          code === "I"
        ) {
          totalAusentismo += 1;
        }
      }
    }

    const pctAusentismo =
      diasDisponibles > 0
        ? Math.round((totalAusentismo / diasDisponibles) * 100 * 100) / 100
        : 0;

    const result = await saveReport({
      mes: currentMonth,
      data: monthRows,
      total_empleados: visibleRows.length,
      total_incidencias: totalIncidencias,
      tasa_asistencia: tasaAsistencia,
      dias_disponibles: diasDisponibles,
      total_ausentismo: totalAusentismo,
      pct_ausentismo: pctAusentismo,
    });

    if (!result.success) {
      setSaveError(result.error || "Error al guardar");
      return;
    }

    setSaveSuccess(true);

    if (saveSuccessTimerRef.current !== null) {
      window.clearTimeout(saveSuccessTimerRef.current);
    }

    saveSuccessTimerRef.current = window.setTimeout(() => {
      setSaveSuccess(false);
      saveSuccessTimerRef.current = null;
    }, SAVE_SUCCESS_DURATION_MS);

    const updated = await fetchSummaries();
    setSavedSummaries(updated);
  }, [currentMonth, rows, dbSaving, computeKpis, saveReport, fetchSummaries]);

  const handleLoadFromDb = useCallback(
    async (mes: string) => {
      const record = await fetchByMes(mes);

      if (!record) {
        sileo.error({ title: "No se encontró el reporte" });
        return;
      }

      const { rows: parsed, errors: parseErrors } = parseReporteJSON(
        record.data as unknown[],
      );

      if (parseErrors.length > 0) {
        setErrors(parseErrors);
        return;
      }

      setRows(parsed);
      setSelectedMes(mes);
      setSelectedDay("");
      setSelectedArea(null);
      setSelectedIncidentTab("");
      setFileName(formatMes(mes));
      setErrors([]);
      setPanelCollapsed(true);
    },
    [fetchByMes],
  );

  const handleDeleteFromDb = useCallback(
    async (id: string) => {
      const result = await deleteReport(id);

      if (!result.success) {
        sileo.error({
          title: result.error || "No se pudo eliminar el reporte",
        });
        return;
      }

      const updated = await fetchSummaries();
      setSavedSummaries(updated);
    },
    [deleteReport, fetchSummaries],
  );

  const getDrillDownDays = useCallback(
    (employeeKey: string, mes: string) => {
      const [year, month] = mes.split("-").map(Number);
      const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

      const dbMonths = new Set(allMonthsRows.map((row) => row.mes));
      const sourceRows = dbMonths.has(mes)
        ? allMonthsRows
        : [...allMonthsRows, ...rows];

      const employeeRows = sourceRows.filter(
        (row) => row.numero_empleado === employeeKey && row.mes === mes,
      );

      const seen = new Set<string>();

      const days: Array<{
        day: string;
        dayLabel: string;
        code: string;
        label: string;
      }> = [];

      for (const row of employeeRows) {
        for (const [day, code] of Object.entries(row.days)) {
          if (!isIncidence(code) || seen.has(day)) continue;
          if (code === "I" || code === "V") continue;

          seen.add(day);

          const dayNumber = Number.parseInt(day, 10);
          const weekday =
            dayNames[new Date(year, month - 1, dayNumber).getDay()];

          days.push({
            day,
            dayLabel: `${weekday} ${dayNumber}`,
            code,
            label: INCIDENCIA_LABELS[code] ?? code,
          });
        }
      }

      return days.sort(
        (a, b) => Number.parseInt(a.day, 10) - Number.parseInt(b.day, 10),
      );
    },
    [allMonthsRows, rows],
  );

  const hasData = rows.length > 0 && Boolean(currentMonth);

  const previewModal = (
    <Modal
      isOpen={Boolean(previewData)}
      onClose={cancelLoad}
      title="Revisión rápida del archivo"
      subtitle="Confirma que los datos son los esperados antes de aplicarlos."
      icon={<FileJson />}
      footerActions={
        <>
          <button
            type="button"
            onClick={cancelLoad}
            className="btn-secondary"
            disabled={loadSuccess}
          >
            Cancelar
          </button>

          <AnimatedSubmitButton
            type="button"
            isSubmitting={false}
            isSuccess={loadSuccess}
            idleText="Sí, cargar datos"
            successText="¡Cargado!"
            idleIcon={CheckIconData}
            className="btn-primary"
            onClick={confirmLoad}
          />
        </>
      }
    >
      {previewData && (
        <div className="modal-body">
          <div className="reporte-preview">
            <div className="reporte-preview__card">
              <span className="reporte-preview__icon" aria-hidden="true">
                <FileJson size={20} />
              </span>

              <div className="reporte-preview__body">
                <p
                  className="reporte-preview__filename"
                  title={previewData.fileName}
                >
                  {previewData.fileName}
                </p>

                <p className="reporte-preview__meta">
                  {previewData.rows.length.toLocaleString("es-MX")} registros ·{" "}
                  {formatMes(previewData.mes)}
                </p>
              </div>
            </div>

            <ul
              className="reporte-preview__stats"
              aria-label="Resumen del archivo"
            >
              <li className="reporte-preview__stat">
                <span className="reporte-preview__stat-value">
                  {previewData.rows.length.toLocaleString("es-MX")}
                </span>
                <span className="reporte-preview__stat-label">Registros</span>
              </li>

              <li className="reporte-preview__stat">
                <span className="reporte-preview__stat-value">
                  {formatMes(previewData.mes)}
                </span>
                <span className="reporte-preview__stat-label">Periodo</span>
              </li>

              <li className="reporte-preview__stat">
                <span className="reporte-preview__stat-value">JSON</span>
                <span className="reporte-preview__stat-label">Formato</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </Modal>
  );

  const dragOverlay = (
    <AnimatePresence>
      {isDragging && (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          className="reporte-drag"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="status"
          aria-live="assertive"
          aria-label="Suelta el archivo para cargar el reporte"
        >
          <motion.div
            initial={overlayPanelInitial}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96, y: 12 }}
            className="reporte-drag__inner"
          >
            <CloudUpload
              size="1em"
              className="reporte-overlay__icon-primary reporte-drag__icon"
              aria-hidden="true"
            />

            <h2 className="reporte-overlay__title">Suelta el archivo aquí</h2>

            <p className="reporte-subtitle">
              Detecta automáticamente el mes y valida el formato.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (loadingDb) {
    if (!hasData) {
      return (
        <div className="reporte-container">
          <section
            className="reporte-hero reporte-loading-state"
            aria-busy="true"
            aria-labelledby="reporte-loading-status"
          >
            <header className="reporte-hero__intro" aria-hidden="true">
              <Skeleton
                variant="text"
                className="reporte-loading-state__eyebrow"
              />
            </header>

            <div
              className="reporte-hero__dropzone reporte-loading-state__dropzone"
              aria-hidden="true"
            >
              <Skeleton
                variant="circle"
                className="reporte-loading-state__icon"
              />
              <Skeleton
                variant="text"
                className="reporte-loading-state__title"
              />
              <Skeleton
                variant="text"
                className="reporte-loading-state__subtitle"
              />
            </div>

            <span
              id="reporte-loading-status"
              className="sr-only"
              role="status"
              aria-live="polite"
            >
              Cargando reportes de asistencia…
            </span>
          </section>
        </div>
      );
    }

    return (
      <div className="reporte-container">
        <header className="reporte-card reporte-head">
          <div className="reporte-head__row">
            <div className="reporte-title-wrapper">
              <h1 className="reporte-title">Reporte Diario</h1>
            </div>
          </div>
        </header>

        <div
          className="reporte-card reporte-skeleton-card"
          data-testid="reporte-skeleton"
          aria-busy="true"
        >
          <Skeleton variant="text" className="reporte-skeleton-card__title" />

          <SkeletonTable
            rows={8}
            columns={["24%", "30%", "12%", "12%", "10%", "12%"]}
          />

          <span className="sr-only" role="status" aria-live="polite">
            Actualizando datos del reporte…
          </span>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="reporte-container">
        <input
          ref={fileInputRef}
          className="reporte-file-input"
          type="file"
          accept="application/json,.json"
          onChange={handleFileChange}
          tabIndex={-1}
          aria-hidden="true"
        />

        <motion.section
          className="reporte-hero"
          initial={enterFromBelow}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reduceMotion ? 0 : 0.35,
            ease: [0.16, 1, 0.3, 1],
          }}
          aria-labelledby="reporte-hero-title"
        >
          <header className="reporte-hero__intro">
            <span id="reporte-hero-title" className="reporte-hero__eyebrow">
              <BarChart2 size={25} aria-hidden="true" />
              Reporte Diario
            </span>
          </header>

          <div
            className="reporte-hero__dropzone"
            data-dragging={isDragging}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
              if (!processStep) {
                fileInputRef.current?.click();
              }
            }}
            role="button"
            tabIndex={processStep ? -1 : 0}
            onKeyDown={(event) => {
              if (
                !processStep &&
                (event.key === "Enter" || event.key === " ")
              ) {
                event.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            aria-label="Sube un archivo de reporte de asistencia"
            aria-busy={Boolean(processStep)}
            aria-disabled={Boolean(processStep)}
            data-testid="upload-dropzone"
          >
            <AnimatePresence mode="wait">
              {processStep ? (
                <motion.div
                  key="processing"
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
                  className="reporte-hero__dropzone-inner reporte-hero__dropzone-inner--processing"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <Loader2
                    size="1em"
                    className="reporte-spinner reporte-overlay__icon-primary"
                    aria-hidden="true"
                  />

                  <h3 className="reporte-hero__dropzone-title">
                    {processStep === "reading" && "Leyendo archivo…"}
                    {processStep === "validating" && "Revisando incidencias…"}
                  </h3>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
                  className="reporte-hero__dropzone-inner"
                >
                  <span
                    className="reporte-hero__dropzone-icon"
                    aria-hidden="true"
                  >
                    <CloudUpload size={34} />
                  </span>

                  <h3 className="reporte-hero__dropzone-title">
                    Selecciona un archivo
                    <FileJson size={18} aria-hidden="true" />
                  </h3>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {savedSummaries.length > 0 && (
            <div
              className="reporte-hero__saved"
              aria-label="Acceso a reportes guardados"
            >
              <p className="reporte-hero__saved-hint">Reportes guardados.</p>

              <div className="reporte-hero__saved-actions">
                <ReportesGuardadosDialog
                  savedSummaries={savedSummaries}
                  dbSaving={dbSaving}
                  onLoad={handleLoadFromDb}
                  onDelete={handleDeleteFromDb}
                  formatMes={formatMes}
                  triggerVariant="labeled"
                />

                {savedSummaries.length >= 2 && (
                  <ReporteComparison
                    summaries={savedSummaries}
                    triggerVariant="labeled"
                  />
                )}
              </div>
            </div>
          )}
        </motion.section>

        {errors.length > 0 && (
          <div
            className="reporte-status-banner error reporte-errors"
            role="alert"
            data-testid="errors-banner"
          >
            <AlertCircle size={16} aria-hidden="true" />

            <div className="reporte-errors__content">
              <div className="reporte-flex-between">
                <strong>Errores de formato</strong>

                <button
                  type="button"
                  onClick={() => setErrors([])}
                  className="reporte-iconbtn"
                  aria-label="Cerrar errores"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>

              <ul>
                {errors.map((error, index) => (
                  <li key={`${error}-${index}`}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {previewModal}
        {dragOverlay}
      </div>
    );
  }

  return (
    <div className="reporte-layout">
      <input
        ref={fileInputRef}
        className="reporte-file-input"
        type="file"
        accept="application/json,.json"
        onChange={handleFileChange}
        tabIndex={-1}
        aria-hidden="true"
      />

      <div className="reporte-main">
        <div
          className="reporte-top-bar"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "var(--spacing-md)",
            marginBottom: "var(--spacing-lg)",
          }}
        >
          <h1
            className="reporte-title"
            style={{
              margin: 0,
              paddingRight: "var(--spacing-md)",
            }}
          >
            Reporte
          </h1>

          <div
            className="reporte-controls-group"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--spacing-sm)",
              flexWrap: "wrap",
            }}
          >
            {fileName && !processStep && (
              <div
                className="reporte-status-banner reporte-status-banner--file"
                data-testid="reporte-filename"
              >
                <FileJson
                  size={16}
                  className="text-primary"
                  aria-hidden="true"
                />

                <span className="reporte-head__grid-text">{fileName}</span>

                <button
                  type="button"
                  onClick={handleClearFile}
                  title="Limpiar archivo actual"
                  aria-label="Limpiar archivo actual"
                  className="reporte-iconbtn"
                  data-testid="clear-file-btn"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            )}

            {processStep && (
              <div
                className="reporte-status-banner reporte-status-banner--file"
                data-testid="reporte-filename-loading"
              >
                <Loader2
                  size="1em"
                  className="reporte-spinner text-primary"
                  aria-hidden="true"
                />

                <span className="reporte-head__grid-text">
                  Analizando archivo...
                </span>
              </div>
            )}

            <span
              className="reporte-status-banner reporte-status-banner--warn"
              aria-label={`${heroKpis.totalIncidencias} incidencias detectadas`}
            >
              <AlertCircle size={16} aria-hidden="true" />

              <span className="reporte-head__grid-value">
                {heroKpis.totalIncidencias}
              </span>

              <span className="reporte-head__grid-text">incidencias</span>
            </span>

            {savedSummaries.length >= 2 && (
              <ReporteComparison
                summaries={savedSummaries}
                triggerVariant="labeled"
              />
            )}

            {savedSummaries.length > 0 && (
              <ReportesGuardadosDialog
                savedSummaries={savedSummaries}
                dbSaving={dbSaving}
                onLoad={handleLoadFromDb}
                onDelete={handleDeleteFromDb}
                formatMes={formatMes}
                triggerVariant="labeled"
              />
            )}
          </div>

          <div
            className="reporte-search-container"
            style={{
              flex: 1,
              minWidth: "250px",
            }}
          >
            <div className="reporte-search">
              <div className="reporte-search__field-wrap">
                <label htmlFor="reporte-search" className="sr-only">
                  Buscar empleado
                </label>

                <Search
                  size={16}
                  className="reporte-search__icon"
                  aria-hidden="true"
                />

                <input
                  id="reporte-search"
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nombre, número o área"
                  className="reporte-search__input"
                  aria-label="Buscar empleado por nombre, número o área"
                  autoComplete="off"
                />

                {search && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="reporte-search__clear"
                    aria-label="Limpiar búsqueda"
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                )}
              </div>

              <div className="reporte-search__meta">
                {search && (
                  <p className="reporte-search__subtitle">
                    {searchResults.length}{" "}
                    {searchResults.length === 1
                      ? "resultado encontrado"
                      : "resultados encontrados"}
                  </p>
                )}
              </div>

              {search && (
                <div className="reporte-search__results" role="list">
                  {searchResults.length > 0 ? (
                    searchResults.map((row, index) => (
                      <button
                        key={`${row.numero_empleado}-${index}`}
                        type="button"
                        className="reporte-search__result"
                        onClick={() => openEmployeeModal(row.numero_empleado)}
                        role="listitem"
                      >
                        <div className="reporte-search__result-main">
                          <span className="reporte-search__result-title">
                            {row.nombre.toLowerCase()}
                          </span>

                          <span className="reporte-search__result-meta">
                            #{row.numero_empleado}
                          </span>
                        </div>

                        <div className="reporte-search__result-followup">
                          <span>{row.departamento.toLowerCase()}</span>

                          {row.area && row.area !== row.departamento && (
                            <span>• {row.area.toLowerCase()}</span>
                          )}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="reporte-search__empty">
                      No se encontraron empleados que coincidan con la búsqueda.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <AnimatedSubmitButton
            type="button"
            isSubmitting={dbSaving}
            isSuccess={saveSuccess}
            isError={Boolean(saveError)}
            errorText={saveError || undefined}
            idleText={
              savedSummaries.some((summary) => summary.mes === currentMonth)
                ? "Actualizar"
                : "Guardar"
            }
            loadingText="Guardando…"
            successText="¡Guardado!"
            idleIcon={SaveIconData}
            iconOnly
            className="btn-primary"
            onClick={handleSaveToDb}
            data-testid="save-report-btn"
          />
        </div>

        {errors.length > 0 && (
          <div
            className="reporte-status-banner error reporte-errors"
            role="alert"
            data-testid="errors-banner"
          >
            <AlertCircle size={16} aria-hidden="true" />

            <div className="reporte-errors__content">
              <div className="reporte-flex-between">
                <strong>Errores de formato</strong>

                <button
                  type="button"
                  onClick={() => setErrors([])}
                  className="reporte-iconbtn"
                  aria-label="Cerrar errores"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>

              <ul>
                {errors.map((error, index) => (
                  <li key={`${error}-${index}`}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <motion.div
          className="reporte-container"
          initial={reduceMotion ? false : "hidden"}
          animate="visible"
          variants={{
            hidden: {
              opacity: 0,
            },
            visible: {
              opacity: 1,
              transition: reduceMotion
                ? { duration: 0 }
                : {
                    staggerChildren: 0.08,
                    delayChildren: 0.05,
                  },
            },
          }}
        >
          <motion.div
            variants={{
              hidden: {
                opacity: 0,
                y: reduceMotion ? 0 : 12,
              },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: reduceMotion ? 0 : 0.35,
                  ease: [0.16, 1, 0.3, 1],
                },
              },
            }}
          >
            <ReporteKpiDashboard
              selectedRows={selectedRows}
              dayHeaders={dayHeaders}
              currentMonth={currentMonth}
            />
          </motion.div>

          <motion.div
            className="reporte-card"
            variants={{
              hidden: {
                opacity: 0,
                y: reduceMotion ? 0 : 12,
              },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: reduceMotion ? 0 : 0.35,
                  ease: [0.16, 1, 0.3, 1],
                },
              },
            }}
          >
            <div className="reporte-card__header">
              <div className="reporte-flex-between">
                <h2 className="reporte-card__title reporte-card__title--capitalize">
                  {formatMes(currentMonth)}
                </h2>

                <div className="reporte-cal-actions">
                  {topIncidenceEmployees.length > 0 && (
                    <button
                      type="button"
                      className="reporte-top-emp-btn"
                      onClick={() => {
                        setSelectedTopEmpKey(
                          topIncidenceEmployees[0].numero_empleado,
                        );
                        setTopEmpModalOpen(true);
                      }}
                      data-testid="top-incidence-btn"
                      aria-label="Ver top 10 empleados con más incidencias"
                    >
                      <BarChart2 size={13} aria-hidden="true" />
                      <span>Análisis de asistencia</span>
                    </button>
                  )}
                </div>
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
                onSelectDay={(day) => {
                  setSelectedDay(day);
                  setSelectedArea(null);
                  setSelectedIncidentTab("");
                }}
              />
            </div>
          </motion.div>

          <motion.div
            className="reporte-card"
            variants={{
              hidden: {
                opacity: 0,
                y: reduceMotion ? 0 : 12,
              },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: reduceMotion ? 0 : 0.35,
                  ease: [0.16, 1, 0.3, 1],
                },
              },
            }}
          >
            <div className="reporte-card__header">
              <div className="reporte-dayhead">
                <div className="reporte-dayhead__title">
                  <div className="reporte-dayhead__icon">
                    <Calendar size={18} aria-hidden="true" />
                  </div>

                  <h3 data-testid="selected-day-title">
                    {selectedDay ? selectedDateTitle : "Detalle del día"}
                  </h3>
                </div>

                {selectedDay && (
                  <div className="reporte-dayhead__actions">
                    {(daySummaries[selectedDay] ?? 0) > 0 && (
                      <span
                        className="ras__incidents-total"
                        aria-label={`${
                          daySummaries[selectedDay] ?? 0
                        } incidencias`}
                      >
                        {daySummaries[selectedDay]}{" "}
                        {daySummaries[selectedDay] === 1
                          ? "incidencia"
                          : "incidencias"}
                      </span>
                    )}

                    <div className="reporte-daynav">
                      <button
                        type="button"
                        className="reporte-daynav__btn"
                        onClick={() => {
                          if (prevDay) {
                            setSelectedDay(prevDay);
                            setSelectedArea(null);
                            setSelectedIncidentTab("");
                          }
                        }}
                        disabled={!prevDay}
                        title="Día anterior"
                        aria-label="Día anterior"
                        data-testid="prev-day-btn"
                      >
                        <ChevronLeft size={16} aria-hidden="true" />
                        <span className="reporte-daynav__text">Anterior</span>
                      </button>

                      <button
                        type="button"
                        className="reporte-daynav__btn"
                        onClick={() => {
                          if (nextDay) {
                            setSelectedDay(nextDay);
                            setSelectedArea(null);
                            setSelectedIncidentTab("");
                          }
                        }}
                        disabled={!nextDay}
                        title="Día siguiente"
                        aria-label="Día siguiente"
                        data-testid="next-day-btn"
                      >
                        <span className="reporte-daynav__text">Siguiente</span>
                        <ChevronRight size={16} aria-hidden="true" />
                      </button>
                    </div>
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
          </motion.div>
        </motion.div>
      </div>

      <ReporteEmployeeDetail
        open={empDetailOpen}
        onClose={() => {
          setEmpDetailOpen(false);
          setSelectedEmployee("");
        }}
        employee={
          selectedRows.find(
            (row) => row.numero_empleado === selectedEmployee,
          ) ?? null
        }
        dayHeaders={dayHeaders}
        currentMonth={currentMonth}
      />

      {previewModal}
      {dragOverlay}

      {topIncidenceEmployees.length > 0 && (
        <Modal
          isOpen={topEmpModalOpen}
          onClose={() => {
            setTopEmpModalOpen(false);
            setSelectedTopEmpKey(null);
            setDrillDownMonth(null);
          }}
          title="ANÁLISIS DE ASISTENCIA"
        >
          <div className="top-emp-modal">
            <AnimatePresence mode="wait" initial={false}>
              {drillDownMonth ? (
                <motion.div
                  key="drill"
                  initial={enterFromRight}
                  animate={{ opacity: 1, x: 0 }}
                  exit={exitToRight}
                  transition={{
                    duration: reduceMotion ? 0 : 0.18,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                >
                  {(() => {
                    const employee = topIncidenceEmployees.find(
                      (item) => item.numero_empleado === drillDownMonth.empKey,
                    );

                    const days = getDrillDownDays(
                      drillDownMonth.empKey,
                      drillDownMonth.mes,
                    );

                    return (
                      <>
                        <div className="top-emp-drill-header">
                          <button
                            type="button"
                            className="top-emp-drill-back"
                            onClick={() => setDrillDownMonth(null)}
                            aria-label="Regresar a la lista de empleados"
                            data-testid="drill-back-btn"
                          >
                            <ChevronLeft size={16} aria-hidden="true" />
                            <span>Regresar</span>
                          </button>

                          <div className="top-emp-drill-header__info">
                            <span className="top-emp-drill-header__name">
                              {employee?.nombre ?? "Empleado"}
                            </span>

                            <span className="top-emp-drill-header__month">
                              {formatMes(drillDownMonth.mes)}
                            </span>
                          </div>
                        </div>

                        {days.length === 0 ? (
                          <p className="top-emp-drill-empty">
                            Sin incidencias registradas este mes.
                          </p>
                        ) : (
                          <ol
                            className="top-emp-drill-days"
                            aria-label={`Días con incidencia en ${formatMes(
                              drillDownMonth.mes,
                            )}`}
                          >
                            {days.map(({ day, dayLabel, code, label }) => (
                              <li
                                key={`${day}-${code}`}
                                className="top-emp-drill-day"
                              >
                                <span
                                  className="top-emp-drill-day__num"
                                  aria-label={dayLabel}
                                >
                                  {dayLabel}
                                </span>

                                <span
                                  className="top-emp-modal__code-badge"
                                  aria-hidden="true"
                                >
                                  {code}
                                </span>

                                <span className="top-emp-drill-day__label">
                                  {label}
                                </span>
                              </li>
                            ))}
                          </ol>
                        )}
                      </>
                    );
                  })()}
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={enterFromLeft}
                  animate={{ opacity: 1, x: 0 }}
                  exit={exitToLeft}
                  transition={{
                    duration: reduceMotion ? 0 : 0.18,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                >
                  <ol
                    className="top-emp-list"
                    aria-label="Top 10 empleados con más incidencias"
                  >
                    {topIncidenceEmployees.map((employee, index) => {
                      const isOpen =
                        selectedTopEmpKey === employee.numero_empleado;

                      const detailId = `top-emp-detail-${employee.numero_empleado}`;
                      const maxTotal = topIncidenceEmployees[0]?.total || 1;

                      const barPercentage = Math.round(
                        (employee.total / maxTotal) * 100,
                      );

                      return (
                        <li
                          key={employee.numero_empleado}
                          className={`top-emp-item${
                            isOpen ? " top-emp-item--open" : ""
                          }`}
                        >
                          <button
                            type="button"
                            className="top-emp-row"
                            aria-expanded={isOpen}
                            aria-controls={detailId}
                            onClick={() => {
                              setDrillDownMonth(null);
                              setSelectedTopEmpKey(
                                isOpen ? null : employee.numero_empleado,
                              );
                            }}
                            data-testid={`top-emp-row-${index + 1}`}
                          >
                            <span
                              className={`top-emp-rank${
                                index === 0 ? " top-emp-rank--first" : ""
                              }`}
                              aria-label={`Posición ${index + 1}`}
                            >
                              {index + 1}
                            </span>

                            <span className="top-emp-row__info">
                              <span className="top-emp-row__name">
                                {employee.nombre}
                              </span>

                              <span className="top-emp-row__meta">
                                #{employee.numero_empleado}
                                <span aria-hidden="true"> · </span>
                                {employee.area}
                              </span>
                            </span>

                            <span
                              className="top-emp-row__right"
                              aria-hidden="true"
                            >
                              <span className="top-emp-row__bar-wrap">
                                <span
                                  className="top-emp-row__bar"
                                  style={{
                                    width: `${barPercentage}%`,
                                  }}
                                />
                              </span>

                              <span className="top-emp-row__total">
                                {employee.total}
                              </span>
                            </span>
                          </button>

                          {isOpen && (
                            <div id={detailId} className="top-emp-detail">
                              <section
                                aria-labelledby={`type-heading-${employee.numero_empleado}`}
                              >
                                <h4
                                  id={`type-heading-${employee.numero_empleado}`}
                                  className="top-emp-modal__section-title"
                                >
                                  Por tipo
                                </h4>

                                <div
                                  className="top-emp-modal__codes"
                                  role="list"
                                >
                                  {Object.entries(employee.byCode)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([code, count]) => (
                                      <div
                                        key={code}
                                        className="top-emp-modal__code-item"
                                        role="listitem"
                                        aria-label={`${
                                          INCIDENCIA_LABELS[code] ?? code
                                        }: ${count}`}
                                      >
                                        <span className="top-emp-modal__code-badge">
                                          {code}
                                        </span>

                                        <span className="top-emp-modal__code-label">
                                          {INCIDENCIA_LABELS[code] ?? code}
                                        </span>

                                        <span className="top-emp-modal__code-count">
                                          {count}
                                        </span>
                                      </div>
                                    ))}
                                </div>
                              </section>

                              <section
                                aria-labelledby={`month-heading-${employee.numero_empleado}`}
                              >
                                <h4
                                  id={`month-heading-${employee.numero_empleado}`}
                                  className="top-emp-modal__section-title"
                                >
                                  Por mes
                                </h4>

                                <div
                                  className="top-emp-modal__months"
                                  role="list"
                                >
                                  {Object.entries(employee.byMes)
                                    .sort(([a], [b]) => a.localeCompare(b))
                                    .map(([mes, count]) => {
                                      const percentage = Math.round(
                                        (count / employee.total) * 100,
                                      );

                                      return (
                                        <button
                                          key={mes}
                                          type="button"
                                          className="top-emp-modal__month-row top-emp-modal__month-row--btn"
                                          onClick={() =>
                                            setDrillDownMonth({
                                              empKey: employee.numero_empleado,
                                              mes,
                                            })
                                          }
                                          aria-label={`Ver días de ${formatMes(
                                            mes,
                                          )}: ${count} incidencias`}
                                          data-testid={`month-drill-${employee.numero_empleado}-${mes}`}
                                          role="listitem"
                                        >
                                          <span className="top-emp-modal__month-name">
                                            {formatMes(mes)}
                                          </span>

                                          <div
                                            className="top-emp-modal__month-bar-wrap"
                                            aria-hidden="true"
                                          >
                                            <div
                                              className="top-emp-modal__month-bar"
                                              style={{
                                                width: `${percentage}%`,
                                              }}
                                            />
                                          </div>

                                          <span className="top-emp-modal__month-count">
                                            {count}
                                          </span>

                                          <ChevronRight
                                            size={13}
                                            className="top-emp-month-chevron"
                                            aria-hidden="true"
                                          />
                                        </button>
                                      );
                                    })}
                                </div>
                              </section>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Modal>
      )}
    </div>
  );
}

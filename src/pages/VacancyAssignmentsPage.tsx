import { useEffect, useMemo, useState } from "react";
import { Check, ClipboardList, Copy } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { Link } from "react-router-dom";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { formatReadableDate } from "@/lib/dates";
import { useDismissedPositions } from "@/hooks/useDismissedPositions";
import { toast } from "@/lib/notify";
import { calculatePositionCoverage, toNaturalCase } from "@/lib/utils";
import {
  buildWhatsAppReportFromBlocks,
  copyTextToClipboard,
  formatWhatsAppLabel,
} from "@/lib/whatsappReport";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { usePositions } from "@/lib/positions";
import { BoneyardSkeleton } from "@/components/ui/BoneyardSkeleton";
import type { PositionCoverage } from "@/lib/types";
import { useTeamDirectory } from '@/features/team/TeamProvider';
import { recruiterOptions, findTeamMember, type TeamMember } from '@/features/team/types';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import { workforceText } from '@/pages/workforce-translations';
import { PLANTILLA_PATH } from '@/lib/plantillaNavigation';
import "./VacancyAssignmentsPage.css";

interface VacancyRow {
  area: string;
  seccion: string;
  turno: string;
  puesto: string;
  vacantesAutorizada: number;
  vacantesBackup: number;
  vacantesStarlite: number;
  totalVacantes: number;
  proximosIngresos: number;
  starliteProximos: number;
  starliteUrgentes: number;
  starliteEmpleados: number;
}

interface AreaGroup {
  area: string;
  rows: VacancyRow[];
  totalVacantes: number;
  totalBackup: number;
  totalProximosIngresos: number;
  totalStarliteUrgentes: number;
  totalStarliteEmpleados: number;
}

function extractTurno(seccion: string): string {
  const match = seccion.match(
    /\b(?:1ER|1RA|2DO|2DA|3ER|3RA|4TO|4TA|[1-9]O|[1-9]A|NOCTURNO|DIURNO|MATUTINO|VESPERTINO)\.?\s*TURNO\b/i,
  );
  return match ? match[0].toUpperCase().replace(/\s+/g, " ").trim() : "";
}

function buildGroups(positions: PositionCoverage[]): AreaGroup[] {
  const pendientes = positions
    .filter((p) => p.vacantes > 0 || p.proximos_ingresos > 0 || p.urgentes > 0)
    .map<VacancyRow>((p) => {
      return {
        area: p.area,
        seccion: p.seccion,
        turno: extractTurno(p.seccion),
        puesto: p.puesto,
        vacantesAutorizada: p.vacantes_plantilla,
        vacantesBackup: p.vacantes_backup,
        vacantesStarlite: p.vacantes_starlite,
        totalVacantes: p.vacantes,
        proximosIngresos: p.proximos_ingresos,
        starliteProximos: p.starlite_proximos || 0,
        starliteUrgentes: p.urgentes || 0,
        starliteEmpleados: p.starlite_empleados || 0,
      };
    })
    .sort((a, b) => {
      if (a.area !== b.area) return a.area.localeCompare(b.area, "es");
      if (a.seccion !== b.seccion)
        return a.seccion.localeCompare(b.seccion, "es");
      return a.puesto.localeCompare(b.puesto, "es");
    });

  const map = new Map<string, AreaGroup>();
  for (const row of pendientes) {
    let group = map.get(row.area);
    if (!group) {
      group = {
        area: row.area,
        rows: [],
        totalVacantes: 0,
        totalBackup: 0,
        totalProximosIngresos: 0,
        totalStarliteUrgentes: 0,
        totalStarliteEmpleados: 0,
      };
      map.set(row.area, group);
    }
    group.rows.push(row);
    group.totalVacantes += row.vacantesAutorizada;
    group.totalBackup += row.vacantesBackup;
    group.totalProximosIngresos += row.proximosIngresos;
    group.totalStarliteUrgentes += row.starliteUrgentes;
    group.totalStarliteEmpleados += row.starliteEmpleados;
  }
  return Array.from(map.values()).sort((a, b) =>
    a.area.localeCompare(b.area, "es"),
  );
}

function buildWhatsAppMessageBlock(
  project: "Starlite" | undefined,
  groups: AreaGroup[],
  type: "general" | "starlite",
): string {
  const filteredGroups = groups
    .map((g) => ({
      ...g,
      rows: g.rows.filter((r) => {
        return type === "general"
          ? r.vacantesAutorizada > 0 ||
              r.vacantesBackup > 0 ||
              r.proximosIngresos - r.starliteProximos > 0
          : r.starliteUrgentes > 0;
      }),
    }))
    .filter((g) => g.rows.length > 0);

  if (filteredGroups.length === 0) return "";

  const lines: string[] = [];

  for (const g of filteredGroups) {
    const areaTitle = toNaturalCase(g.area);
    const groupLines: string[] = [];

    const puestosMap = new Map<string, typeof g.rows>();
    for (const r of g.rows) {
      if (!puestosMap.has(r.puesto)) puestosMap.set(r.puesto, []);
      puestosMap.get(r.puesto)!.push(r);
    }

    for (const [puesto, filas] of puestosMap.entries()) {
      for (const r of filas) {
        let puestoName = formatWhatsAppLabel(puesto);
        if (
          type !== "general" &&
          puestoName.toLowerCase().includes("operador de máquina")
        ) {
          puestoName = "Operador de Starlite";
        }

        let turnoLabel = r.turno ? formatWhatsAppLabel(r.turno) : "";

        // Filter out non-shift labels like "Admtvo", "Metrología"
        const lowerTurno = turnoLabel.toLowerCase();
        if (
          lowerTurno &&
          !lowerTurno.includes("turno") &&
          !lowerTurno.includes("mixto") &&
          !lowerTurno.includes("central")
        ) {
          turnoLabel = "";
        }

        const namePart = [puestoName, turnoLabel].filter(Boolean).join(" · ");

        let ingresosDisponibles =
          type === "general"
            ? r.proximosIngresos - r.starliteProximos
            : r.starliteProximos;

        let pending = 0;
        if (type === "general") {
          const reqTotal = r.vacantesAutorizada + r.vacantesBackup;
          pending = Math.max(0, reqTotal - ingresosDisponibles);
        } else {
          pending = Math.max(
            0,
            r.starliteUrgentes - r.starliteEmpleados - ingresosDisponibles,
          );
        }

        if (pending > 0) groupLines.push(`• ${namePart}: ${pending}`);
      }
    }

    if (groupLines.length > 0) {
      lines.push(
        `*${project ? `${project} · ${areaTitle}` : areaTitle}*`,
        ...groupLines,
        "",
      );
    }
  }

  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }

  return lines.join("\n").trim();
}

function buildAssignedWhatsAppMessage(
  groups: AreaGroup[],
  dismissedKeys: Set<string>,
  assignments: Record<string, string>,
  members: TeamMember[],
  language: Language,
): string {
  const blocks: string[] = [];
  let totalPending = 0;
  const assignedName = (value: string) => findTeamMember(members, value)?.short_name ?? (value || 'Pendiente');
  const recruiters = [...new Set([...Object.values(assignments).map(assignedName), 'Pendiente'])];
  const rows = groups
    .flatMap((g) => g.rows)
    .filter((r) => !dismissedKeys.has(`${r.area}|${r.seccion}|${r.puesto}`));

  for (const rec of recruiters) {
    const recRows = rows.filter((r) => {
      const k = `${r.area}|${r.seccion}|${r.puesto}`;
      const assignedTo = assignedName(assignments[k] || '');
      return assignedTo === rec;
    });

    if (recRows.length === 0) continue;

    const byArea = new Map<string, VacancyRow[]>();
    for (const r of recRows) {
      if (!byArea.has(r.area)) byArea.set(r.area, []);
      byArea.get(r.area)!.push(r);
    }

    let totalVacantesAsignadas = 0;
    const recLines: string[] = [];

    for (const [area, areaRows] of byArea.entries()) {
      recLines.push(`_${toNaturalCase(area)}_`);

      for (const r of areaRows) {
        let turnoLabel = r.turno ? formatWhatsAppLabel(r.turno) : "";
        const lowerTurno = turnoLabel.toLowerCase();
        if (
          lowerTurno &&
          !lowerTurno.includes("turno") &&
          !lowerTurno.includes("mixto") &&
          !lowerTurno.includes("central")
        ) {
          turnoLabel = "";
        }

        const suffix = turnoLabel ? ` · ${turnoLabel}` : "";

        // General
        const generalReq =
          (r.vacantesAutorizada || 0) + (r.vacantesBackup || 0);
        const generalIngresos =
          (r.proximosIngresos || 0) - (r.starliteProximos || 0);
        const generalFaltan = Math.max(0, generalReq - generalIngresos);

        if (generalReq > 0 && generalFaltan > 0) {
          const puestoName = formatWhatsAppLabel(r.puesto);
          recLines.push(`• ${puestoName}${suffix}: ${generalFaltan}`);
          totalVacantesAsignadas += generalFaltan;
        }

        // Starlite
        const starliteReq =
          (r.starliteUrgentes || 0) - (r.starliteEmpleados || 0);
        const starliteIngresos = r.starliteProximos || 0;
        const starliteFaltan = Math.max(0, starliteReq - starliteIngresos);

        if (starliteFaltan > 0) {
          let puestoName = formatWhatsAppLabel(r.puesto);
          if (puestoName.toLowerCase().includes("operador de máquina")) {
            puestoName = "Operador de Starlite";
          }
          recLines.push(`• ${puestoName}${suffix}: ${starliteFaltan}`);
          totalVacantesAsignadas += starliteFaltan;
        }
      }
      recLines.push("");
    }

    if (totalVacantesAsignadas > 0) {
      while (recLines[recLines.length - 1] === "") recLines.pop();
      blocks.push(
        `*${rec === 'Pendiente' ? workforceText(language, 'Pendiente') : toNaturalCase(rec)}*\n${recLines.join("\n")}\n_${workforceText(language, 'Subtotal')}: ${totalVacantesAsignadas}_`,
      );
      totalPending += totalVacantesAsignadas;
    }
  }

  return buildWhatsAppReportFromBlocks({
    title: workforceText(language, "Vacantes pendientes"),
    date: formatReadableDate(new Date().toISOString(), language === 'en' ? 'en-US' : 'es-MX'),
    total: totalPending,
    blocks,
    emptyMessage: workforceText(language, "Sin vacantes pendientes."),
  });
}

function buildWhatsAppMessage(
  allGroups: AreaGroup[],
  dismissedKeys: Set<string>,
  assignments: Record<string, string>,
  members: TeamMember[],
  language: Language,
): string {
  const hasAssignments = Object.values(assignments).some(
    (v) => v !== "" && v !== "Pendiente",
  );
  if (hasAssignments) {
    return buildAssignedWhatsAppMessage(allGroups, dismissedKeys, assignments, members, language);
  }

  const groups = allGroups
    .map((g) => ({
      ...g,
      rows: g.rows.filter(
        (r) => !dismissedKeys.has(`${r.area}|${r.seccion}|${r.puesto}`),
      ),
    }))
    .filter((g) => g.rows.length > 0);

  const date = formatReadableDate(new Date().toISOString(), language === 'en' ? 'en-US' : 'es-MX');

  const blocks: string[] = [];
  const generales = buildWhatsAppMessageBlock(
    undefined,
    groups,
    "general",
  );
  if (generales) blocks.push(generales);

  const starlite = buildWhatsAppMessageBlock(
    "Starlite",
    groups,
    "starlite",
  );
  if (starlite) blocks.push(starlite);

  const totalPending = groups.reduce(
    (total, group) =>
      total +
      group.rows.reduce((subtotal, row) => {
        const generalRequired = row.vacantesAutorizada + row.vacantesBackup;
        const generalIncoming = row.proximosIngresos - row.starliteProximos;
        const starliteRequired = row.starliteUrgentes - row.starliteEmpleados;
        return (
          subtotal +
          Math.max(0, generalRequired - generalIncoming) +
          Math.max(0, starliteRequired - row.starliteProximos)
        );
      }, 0),
    0,
  );

  return buildWhatsAppReportFromBlocks({
    title: workforceText(language, "Vacantes pendientes"),
    date,
    total: totalPending,
    blocks,
    emptyMessage: workforceText(language, "Sin vacantes pendientes."),
  });
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 320, damping: 28 },
  },
};

export function VacancyAssignmentsPage() {
  const { language } = useLanguage();
  const t = (text: string) => workforceText(language, text);
  const { members } = useTeamDirectory();
  const { employees, comments, loading } = useSupabaseData();
  const { positions } = usePositions();
  const positionCoverage = useMemo(
    () => calculatePositionCoverage(employees, comments, positions),
    [employees, comments, positions],
  );
  const groups = useMemo(() => buildGroups(positionCoverage), [positionCoverage]);
  const { dismissedKeys, toggleDismiss } = useDismissedPositions();
  const [assignments, setAssignments] = useState<Record<string, string>>({});

  const message = useMemo(
    () => buildWhatsAppMessage(groups, dismissedKeys, assignments, members, language),
    [groups, dismissedKeys, assignments, members, language],
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(id);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await copyTextToClipboard(message);
      setCopied(true);
    } catch {
      toast.error({ title: t("No se pudo copiar el reporte") });
    }
  };

  const empty = groups.length === 0;

  const renderGroupContent = (group: AreaGroup) => (
    <ul className="vacancy-report-modal__rows">
      {group.rows.map((row) => {
        const key = `${row.area}|${row.seccion}|${row.puesto}`;
        const isDismissed = dismissedKeys.has(key);

        return (
          <li
            key={key}
            className={`vacancy-report-modal__row ${isDismissed ? "vacancy-report-modal__row--dismissed" : ""}`}
          >
            <button
              type="button"
              className="vacancy-report-modal__row-main"
              onClick={() => toggleDismiss(key)}
              title={t(isDismissed ? "Click para incluir de nuevo en el conteo" : "Click para excluir del conteo")}
              aria-label={`${t(isDismissed ? "Click para incluir de nuevo en el conteo" : "Click para excluir del conteo")}: ${toNaturalCase(row.puesto)}`}
              aria-pressed={isDismissed}
            >
              <span className="vacancy-report-modal__puesto">
                {(() => {
                  let turnoLabel = row.turno ? toNaturalCase(row.turno) : "";
                  const lowerTurno = turnoLabel.toLowerCase();
                  if (
                    lowerTurno &&
                    !lowerTurno.includes("turno") &&
                    !lowerTurno.includes("mixto") &&
                    !lowerTurno.includes("central")
                  ) {
                    turnoLabel = "";
                  }

                  let displayPuesto = toNaturalCase(row.puesto);
                  if (
                    displayPuesto.toLowerCase() === "operador de máquina" &&
                    (row.starliteEmpleados > 0 || row.starliteUrgentes > 0)
                  ) {
                    displayPuesto = "Operador de Starlite";
                  }

                  return turnoLabel
                    ? `${displayPuesto} (${turnoLabel})`
                    : displayPuesto;
                })()}
              </span>
            </button>
            <div className="vacancy-report-modal__badges">
              <CustomSelect
                className="vacancy-report-modal__assign-select"
                aria-label={`${t('Asignar reclutador a')} ${toNaturalCase(row.puesto)}`}
                value={assignments[key] || ""}
                onChange={(val) => {
                  setAssignments((prev) => ({
                    ...prev,
                    [key]: val,
                  }));
                }}
                options={[
                  { value: "", label: t("Pendiente") },
                  ...recruiterOptions(members, assignments[key]),
                ]}
                placeholder={t("Pendiente")}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );

  return (
    <BoneyardSkeleton
      name="vacancy-assignments-page"
      loading={loading && employees.length === 0}
      loadingLabel={t("Cargando vacantes…")}
    >
    <main className="vacancy-assignments-page container" aria-labelledby="vacancy-assignments-title">
      <header className="page-header">
        <div className="page-header__content">
          <Link
            className="vacancy-assignments-page__title-link"
            to={PLANTILLA_PATH}
            aria-label={`${t("Volver a plantilla")}: ${t("Asignación de vacantes")}`}
          >
            <h1 id="vacancy-assignments-title" className="app-page-title">
              <ClipboardList size={20} aria-hidden="true" />
              {t("Asignación de vacantes")}
            </h1>
          </Link>
        </div>
        <div className="page-header__actions">
          <button
            type="button"
            className="btn-primary vacancy-report-modal__action"
            onClick={() => void handleCopy()}
            disabled={empty}
          >
            {copied ? (
              <Check size={16} aria-hidden="true" />
            ) : (
              <Copy size={16} aria-hidden="true" />
            )}
            <span aria-live="polite" aria-atomic="true">
              {copied ? t("Reporte copiado") : t("Copiar reporte")}
            </span>
          </button>
        </div>
      </header>

      <div className="vacancy-assignments-page__content">
        {empty ? (
          <p className="vacancy-report-modal__empty" role="status">
            {t('No hay vacantes activas ni backups pendientes. Plantilla cubierta.')}
          </p>
        ) : (
          <motion.section
            className="vacancy-report-modal__groups"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            aria-label={t("Detalle de puestos con vacantes")}
          >
            {groups.map((group) => (
              <motion.article
                key={group.area}
                className="vacancy-report-modal__group"
                variants={itemVariants}
              >
                <header className="vacancy-report-modal__group-header">
                  <h2 className="vacancy-report-modal__group-title">
                    {group.area}
                  </h2>
                  <span className="vacancy-report-modal__group-count">
                    {group.totalStarliteUrgentes > 0 &&
                      `★ Starlite ${group.totalStarliteEmpleados}/${group.totalStarliteUrgentes} · `}
                    {group.totalVacantes} {t(group.totalVacantes === 1 ? 'vacante activa' : 'vacantes activas')}
                    {group.totalBackup > 0 &&
                      ` · ${group.totalBackup} ${t('backup')}`}
                    {group.totalProximosIngresos > 0 &&
                      ` · ${group.totalProximosIngresos} ${t('próx.')}`}
                  </span>
                </header>
                {renderGroupContent(group)}
              </motion.article>
            ))}
          </motion.section>
        )}
      </div>
    </main>
    </BoneyardSkeleton>
  );
}

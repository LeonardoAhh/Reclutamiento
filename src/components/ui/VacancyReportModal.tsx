import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Share2, UsersRound, CircleAlert } from "lucide-react";
import { Check, Copy } from "lucide";
import { motion, type Variants } from "framer-motion";
import { Modal } from "./Modal";
import { MorphingIcon } from "./MorphingIcon";
import { ExpandableSection } from "./ExpandableSection";
import { CustomSelect } from "./CustomSelect";
import { formatShortDate } from "@/lib/dates";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useDismissedPositions } from "@/hooks/useDismissedPositions";
import type { PositionCoverage } from "@/lib/types";
import "./VacancyReportModal.css";

interface VacancyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  positions: PositionCoverage[];
}

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

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/(?:^|\s|-|\/)\w/g, (m) => m.toUpperCase());
}

function buildWhatsappMessageBlock(
  title: string,
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

  const totalActivas = filteredGroups.reduce(
    (sum, g) => sum + g.rows.reduce((s, r) => s + r.vacantesAutorizada, 0),
    0,
  );
  const totalBackup = filteredGroups.reduce(
    (sum, g) => sum + g.rows.reduce((s, r) => s + r.vacantesBackup, 0),
    0,
  );
  const totalProximos = filteredGroups.reduce(
    (sum, g) =>
      sum +
      g.rows.reduce(
        (s, r) =>
          s +
          (type === "general"
            ? r.proximosIngresos - r.starliteProximos
            : r.starliteProximos),
        0,
      ),
    0,
  );
  const totalStarliteUrgentes = filteredGroups.reduce(
    (sum, g) => sum + g.rows.reduce((s, r) => s + r.starliteUrgentes, 0),
    0,
  );
  const totalStarliteEmpleados = filteredGroups.reduce(
    (sum, g) => sum + g.rows.reduce((s, r) => s + r.starliteEmpleados, 0),
    0,
  );

  const totalVacantes =
    type === "general"
      ? totalActivas + totalBackup
      : filteredGroups.reduce(
          (sum, g) => sum + g.rows.reduce((s, r) => s + r.vacantesStarlite, 0),
          0,
        );

  const vacantesNetas = filteredGroups.reduce(
    (sum, g) =>
      sum +
      g.rows.reduce((s, r) => {
        const req =
          type === "general"
            ? r.vacantesAutorizada + r.vacantesBackup
            : r.starliteUrgentes - r.starliteEmpleados;
        const prox =
          type === "general"
            ? r.proximosIngresos - r.starliteProximos
            : r.starliteProximos;
        return s + Math.max(0, req - prox);
      }, 0),
    0,
  );

  const lines: string[] = [title, ""];

  // Removed summary headers for both general and starlite

  lines.push("");

  for (const g of filteredGroups) {
    if (type === "general") {
      lines.push(`*${g.area.toUpperCase()}*`);
    }

    const puestosMap = new Map<string, typeof g.rows>();
    for (const r of g.rows) {
      if (!puestosMap.has(r.puesto)) puestosMap.set(r.puesto, []);
      puestosMap.get(r.puesto)!.push(r);
    }

    for (const [puesto, filas] of puestosMap.entries()) {
      for (const r of filas) {
        let puestoName = toTitleCase(puesto);
        if (
          type !== "general" &&
          puestoName.toLowerCase().includes("operador de máquina")
        ) {
          puestoName = "Operador de Starlite";
        }

        let turnoLabel = r.turno ? toTitleCase(r.turno) : "";

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

        const namePart = turnoLabel
          ? `${puestoName} (${turnoLabel})`
          : puestoName;

        let ingresosDisponibles =
          type === "general"
            ? r.proximosIngresos - r.starliteProximos
            : r.starliteProximos;

        let faltanTexto = "";
        if (type === "general") {
          const reqTotal = r.vacantesAutorizada + r.vacantesBackup;
          if (reqTotal > 0) {
            const faltan = Math.max(0, reqTotal - ingresosDisponibles);
            if (faltan > 0) {
              faltanTexto = `${faltan}`;
            } else {
              faltanTexto = `✔ Cubierto`;
            }
          } else if (ingresosDisponibles > 0) {
            faltanTexto = `+${ingresosDisponibles} extra`;
          }
        } else {
          const faltan = Math.max(
            0,
            r.starliteUrgentes - r.starliteEmpleados - ingresosDisponibles,
          );
          if (faltan > 0) {
            faltanTexto = `${faltan}`;
          } else if (ingresosDisponibles > 0) {
            faltanTexto = `+${ingresosDisponibles} extra`;
          } else {
            faltanTexto = `✔ Cubierto`;
          }
        }

        lines.push(`• ${namePart}: ${faltanTexto}`);
      }
    }

    if (type === "general") {
      lines.push("");
    }
  }

  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }

  return lines.join("\n").trim();
}

function buildAssignedWhatsappMessage(
  groups: AreaGroup[],
  dismissedKeys: Set<string>,
  assignments: Record<string, string>,
): string {
  const lines: string[] = ["Actualización de Vacantes & Asignación.", ""];
  const recruiters = ["Alexandra", "Daniela", "Leonardo", "Pendiente"];
  const rows = groups
    .flatMap((g) => g.rows)
    .filter((r) => !dismissedKeys.has(`${r.area}|${r.seccion}|${r.puesto}`));

  for (const rec of recruiters) {
    const recRows = rows.filter((r) => {
      const k = `${r.area}|${r.seccion}|${r.puesto}`;
      const assignedTo = assignments[k] || "Pendiente;";
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
      recLines.push(`*${toTitleCase(area)}*`);

      for (const r of areaRows) {
        let turnoLabel = r.turno ? toTitleCase(r.turno) : "";
        const lowerTurno = turnoLabel.toLowerCase();
        if (
          lowerTurno &&
          !lowerTurno.includes("turno") &&
          !lowerTurno.includes("mixto") &&
          !lowerTurno.includes("central")
        ) {
          turnoLabel = "";
        }

        const suffix = turnoLabel ? ` (${turnoLabel})` : "";

        // General
        const generalReq =
          (r.vacantesAutorizada || 0) + (r.vacantesBackup || 0);
        const generalIngresos =
          (r.proximosIngresos || 0) - (r.starliteProximos || 0);
        const generalFaltan = Math.max(0, generalReq - generalIngresos);

        if (generalReq > 0 && generalFaltan > 0) {
          const puestoName = toTitleCase(r.puesto);
          recLines.push(`• ${puestoName}${suffix}: ${generalFaltan}`);
          totalVacantesAsignadas += generalFaltan;
        }

        // Starlite
        const starliteReq =
          (r.starliteUrgentes || 0) - (r.starliteEmpleados || 0);
        const starliteIngresos = r.starliteProximos || 0;
        const starliteFaltan = Math.max(0, starliteReq - starliteIngresos);

        if (starliteFaltan > 0) {
          let puestoName = toTitleCase(r.puesto);
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
      lines.push(`${rec}:`);
      lines.push("");
      lines.push(...recLines);
      if (rec !== "Pendiente") {
        lines.pop(); // remove last empty line from area
        lines.push(`Total de vacantes asignadas: ${totalVacantesAsignadas}`);
        lines.push("");
      }
    }
  }

  return lines.join("\n").trim();
}

function buildWhatsappMessage(
  allGroups: AreaGroup[],
  dismissedKeys: Set<string>,
  assignments: Record<string, string>,
): string {
  const hasAssignments = Object.values(assignments).some(
    (v) => v !== "" && v !== "Pendiente",
  );
  if (hasAssignments) {
    return buildAssignedWhatsappMessage(allGroups, dismissedKeys, assignments);
  }

  const groups = allGroups
    .map((g) => ({
      ...g,
      rows: g.rows.filter(
        (r) => !dismissedKeys.has(`${r.area}|${r.seccion}|${r.puesto}`),
      ),
    }))
    .filter((g) => g.rows.length > 0);

  const fecha = formatShortDate(new Date().toISOString());

  const blocks: string[] = [];
  const generales = buildWhatsappMessageBlock(
    `*Resumen de Vacantes* — ${fecha}`,
    groups,
    "general",
  );
  if (generales) blocks.push(generales);

  const starlite = buildWhatsappMessageBlock(
    `*★ PROYECTO STARLITE*`,
    groups,
    "starlite",
  );
  if (starlite) blocks.push(starlite);

  if (blocks.length === 0) {
    return `*Resumen de Vacantes* — ${fecha}\n\nSin vacantes pendientes.`;
  }

  return blocks.join("\n\n-----------------------------------\n\n");
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

export function VacancyReportModal({
  isOpen,
  onClose,
  positions,
}: VacancyReportModalProps) {
  const isMobile = useIsMobile();
  const groups = useMemo(() => buildGroups(positions), [positions]);
  const { dismissedKeys, toggleDismiss } = useDismissedPositions();
  const [assignments, setAssignments] = useState<Record<string, string>>({});

  const {
    totalActivas,
    totalBackup,
    totalProximos,
    totalStarliteUrgentes,
    totalStarliteEmpleados,
    totalPuestos,
  } = useMemo(() => {
    let activas = 0;
    let backup = 0;
    let proximos = 0;
    let starliteUrgentes = 0;
    let starliteEmpleados = 0;
    let puestos = 0;

    for (const g of groups) {
      for (const r of g.rows) {
        if (!dismissedKeys.has(`${r.area}|${r.seccion}|${r.puesto}`)) {
          activas += r.vacantesAutorizada;
          backup += r.vacantesBackup;
          proximos += r.proximosIngresos;
          starliteUrgentes += r.starliteUrgentes;
          starliteEmpleados += r.starliteEmpleados;
          puestos += 1;
        }
      }
    }
    return {
      totalActivas: activas,
      totalBackup: backup,
      totalProximos: proximos,
      totalStarliteUrgentes: starliteUrgentes,
      totalStarliteEmpleados: starliteEmpleados,
      totalPuestos: puestos,
    };
  }, [groups, dismissedKeys]);

  const message = useMemo(
    () => buildWhatsappMessage(groups, dismissedKeys, assignments),
    [groups, dismissedKeys, assignments],
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(id);
  }, [copied]);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = message;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
      } finally {
        document.body.removeChild(ta);
      }
    }
  };

  const handleShareWhatsapp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
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
            style={{ cursor: "default" }}
          >
            <div
              className="vacancy-report-modal__row-main"
              onClick={() => toggleDismiss(key)}
              style={{ cursor: "pointer", flex: 1, justifyContent: "center" }}
            >
              <span
                className="vacancy-report-modal__puesto"
                style={{ fontSize: "var(--type-body-sm-size)", color: "var(--color-ink)" }}
              >
                {(() => {
                  let turnoLabel = row.turno ? toTitleCase(row.turno) : "";
                  const lowerTurno = turnoLabel.toLowerCase();
                  if (
                    lowerTurno &&
                    !lowerTurno.includes("turno") &&
                    !lowerTurno.includes("mixto") &&
                    !lowerTurno.includes("central")
                  ) {
                    turnoLabel = "";
                  }

                  let displayPuesto = toTitleCase(row.puesto);
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
            </div>
            <div
              className="vacancy-report-modal__badges"
              style={{ alignItems: "center" }}
            >
              <CustomSelect
                className="vacancy-report-modal__assign-select"
                value={assignments[key] || ""}
                onChange={(val) => {
                  setAssignments((prev) => ({
                    ...prev,
                    [key]: val,
                  }));
                }}
                options={[
                  { value: "", label: "Pendiente" },
                  { value: "Alexandra", label: "Alexandra" },
                  { value: "Daniela", label: "Daniela" },
                  { value: "Leonardo", label: "Leonardo" },
                ]}
                placeholder="Pendiente"
              />
            </div>
          </li>
        );
      })}
    </ul>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="vacancy-report-modal "
      icon={<ClipboardList size={20} aria-hidden="true" />}
      title="Asignación de vacantes"
      size="md"
      fullscreenMobile={false}
      footerActions={
        <button
          type="button"
          className="btn-primary vacancy-report-modal__action"
          onClick={handleCopy}
          disabled={empty}
          style={isMobile ? { width: "100%" } : undefined}
        >
          <span
            className="vacancy-report-modal__action-inner"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              justifyContent: "center",
            }}
          >
            <MorphingIcon icon={copied ? Check : Copy} size={16} />
            {copied ? "¡Copiado!" : "Copiar"}
          </span>
        </button>
      }
    >
      <div
        className="vacancy-report-modal__wrapper"
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
        }}
      >
        <div
          className="modal-body vacancy-report-modal__body"
          style={
            isMobile
              ? {
                  padding: "var(--spacing-xl) var(--spacing-md)",
                  textAlign: "center",
                }
              : { flex: 1, overflowY: "auto" }
          }
        >
          {empty ? (
            <motion.p
              className="vacancy-report-modal__empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              No hay vacantes activas ni backups pendientes. Plantilla cubierta.
            </motion.p>
          ) : (
            <>
              {isMobile ? (
                <p
                  style={{
                    color: "var(--color-muted)",
                    fontSize: "var(--type-body-md-size)",
                  }}
                >
                  Pulsa el botón de abajo para copiar el reporte.
                </p>
              ) : (
                <motion.section
                  className="vacancy-report-modal__groups"
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  aria-label="Detalle de puestos con vacantes"
                >
                  {groups.map((group) => (
                    <motion.article
                      key={group.area}
                      className="vacancy-report-modal__group"
                      variants={itemVariants}
                    >
                      <header className="vacancy-report-modal__group-header">
                        <h3 className="vacancy-report-modal__group-title">
                          {group.area}
                        </h3>
                        <span className="vacancy-report-modal__group-count">
                          {group.totalStarliteUrgentes > 0 &&
                            `★ Starlite ${group.totalStarliteEmpleados}/${group.totalStarliteUrgentes} · `}
                          {group.totalVacantes} activa
                          {group.totalVacantes === 1 ? "" : "s"}
                          {group.totalBackup > 0 &&
                            ` · ${group.totalBackup} backup`}
                          {group.totalProximosIngresos > 0 &&
                            ` · ${group.totalProximosIngresos} próx.`}
                        </span>
                      </header>
                      {renderGroupContent(group)}
                    </motion.article>
                  ))}
                </motion.section>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

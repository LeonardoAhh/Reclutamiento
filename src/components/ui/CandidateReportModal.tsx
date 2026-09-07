import { useEffect, useMemo, useState } from "react";
import { UsersRound } from "lucide-react";
import { Check, Copy } from "lucide";
import { motion } from "framer-motion";
import { Modal } from "./Modal";
import { MorphingIcon } from "./MorphingIcon";
import { formatReadableDate } from "@/lib/dates";
import { RECLUTADORES_ACTIVOS } from "@/lib/constants";
import { normalizeString, toNaturalCase } from "@/lib/utils";
import {
  buildWhatsAppReport,
  copyTextToClipboard,
  formatWhatsAppLabel,
  formatWhatsAppSection,
  type WhatsAppReportSection,
} from "@/lib/whatsappReport";
import { toast } from "@/lib/notify";
import type { Candidate, CandidateStatus } from "@/lib/types";
import "./CandidateReportModal.css";

interface CandidateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: Candidate[];
}

const ACTIVE_STATUSES: ReadonlySet<CandidateStatus> = new Set<CandidateStatus>([
  "entrevista",
  "entrega_documentos",
  "faltan_documentos",
  "feedback_pendiente",
]);

const SIN_ASIGNAR = "Sin asignar";

interface PuestoRow {
  area: string;
  seccion: string;
  turno: string;
  puesto: string;
  e1: number;
  e2: number;
  fd: number;
  fp: number;
  total: number;
  starlite: number;
}

interface AreaGroup {
  area: string;
  rows: PuestoRow[];
  total: number;
  starlite: number;
}

interface RecruiterRow {
  name: string;
  e1: number;
  e2: number;
  fd: number;
  fp: number;
  total: number;
  starlite: number;
}

function extractTurno(seccion: string): string {
  const match = seccion.match(
    /\b(?:1ER|1RA|1ER\.|2DO|2DA|2DO\.|3ER|3RA|3ER\.|4TO|4TA|4TO\.|NOCTURNO|DIURNO|MATUTINO|VESPERTINO)\s*\.?\s*TURNO\b/i,
  );
  return match ? match[0].toUpperCase().replace(/\s+/g, " ").trim() : "";
}

function buildPuestoGroups(active: Candidate[]): AreaGroup[] {
  const rowMap = new Map<string, PuestoRow>();
  for (const c of active) {
    const area = c.area || "—";
    const seccion = c.seccion?.trim() || "—";
    const puesto = c.puesto || "—";
    const key = `${area}||${seccion}||${puesto}`;
    let row = rowMap.get(key);
    if (!row) {
      row = {
        area,
        seccion,
        turno: extractTurno(seccion),
        puesto,
        e1: 0,
        e2: 0,
        fd: 0,
        fp: 0,
        total: 0,
        starlite: 0,
      };
      rowMap.set(key, row);
    }
    if (c.status === "entrevista") row.e1 += 1;
    else if (c.status === "entrega_documentos") row.e2 += 1;
    else if (c.status === "faltan_documentos") row.fd += 1;
    else if (c.status === "feedback_pendiente") row.fp += 1;
    row.total += 1;
    if (c.is_starlite) row.starlite += 1;
  }

  const rows = Array.from(rowMap.values()).sort((a, b) => {
    if (a.area !== b.area) return a.area.localeCompare(b.area, "es");
    if (a.seccion !== b.seccion)
      return a.seccion.localeCompare(b.seccion, "es");
    return a.puesto.localeCompare(b.puesto, "es");
  });

  const map = new Map<string, AreaGroup>();
  for (const row of rows) {
    let group = map.get(row.area);
    if (!group) {
      group = { area: row.area, rows: [], total: 0, starlite: 0 };
      map.set(row.area, group);
    }
    group.rows.push(row);
    group.total += row.total;
    group.starlite += row.starlite;
  }
  return Array.from(map.values()).sort((a, b) =>
    a.area.localeCompare(b.area, "es"),
  );
}

function buildRecruiterRows(active: Candidate[]): RecruiterRow[] {
  const empty = (name: string): RecruiterRow => ({
    name,
    e1: 0,
    e2: 0,
    fd: 0,
    fp: 0,
    total: 0,
    starlite: 0,
  });
  const acc = new Map<string, RecruiterRow>();
  for (const name of RECLUTADORES_ACTIVOS) acc.set(name, empty(name));
  acc.set(SIN_ASIGNAR, empty(SIN_ASIGNAR));

  for (const c of active) {
    const norm = normalizeString(c.reclutador ?? "");
    const key = acc.has(norm) ? norm : SIN_ASIGNAR;
    const bucket = acc.get(key)!;
    if (c.status === "entrevista") bucket.e1 += 1;
    else if (c.status === "entrega_documentos") bucket.e2 += 1;
    else if (c.status === "faltan_documentos") bucket.fd += 1;
    else if (c.status === "feedback_pendiente") bucket.fp += 1;
    bucket.total += 1;
    if (c.is_starlite) bucket.starlite += 1;
  }

  return Array.from(acc.values()).filter(
    (r) => r.name !== SIN_ASIGNAR || r.total > 0,
  );
}

function buildCandidateSections(
  candidates: Candidate[],
  project?: string,
): WhatsAppReportSection[] {
  const groups = buildPuestoGroups(candidates);
  return groups.map((group) => ({
    title: project
      ? `${project} · ${toNaturalCase(group.area)}`
      : toNaturalCase(group.area),
    items: group.rows.map((row) => {
      const cleanSection = formatWhatsAppSection(row.seccion, group.area);

      const sectionLabel = cleanSection || formatWhatsAppLabel(row.turno);
      const details: string[] = [];
      if (row.e1 > 0) details.push(`Entrevista: ${row.e1}`);
      if (row.e2 > 0) details.push(`Documentos: ${row.e2}`);
      if (row.fd > 0) details.push(`Faltan documentos: ${row.fd}`);
      if (row.fp > 0) details.push(`Feedback: ${row.fp}`);

      let position = formatWhatsAppLabel(row.puesto);
      if (project && position.toLocaleLowerCase("es-MX").includes("operador de máquina")) {
        position = "Operador de Starlite";
      }

      return {
        label: [position, sectionLabel]
          .filter(Boolean)
          .join(" · "),
        value: details.join(" · "),
        separator: "—" as const,
      };
    }),
  }));
}

function buildWhatsAppMessage(active: Candidate[]): string {
  const generales = active.filter((c) => !c.is_starlite);
  const starlite = active.filter((c) => c.is_starlite);
  const recruiters = buildRecruiterRows(active).filter((row) => row.total > 0);
  const sections = [
    ...buildCandidateSections(generales),
    ...buildCandidateSections(starlite, "Starlite"),
  ];

  const recruiterSummary = recruiters
    .map((row) => `${toNaturalCase(row.name)} ${row.total}`)
    .join(" · ");

  return buildWhatsAppReport({
    title: "Candidatos activos",
    date: formatReadableDate(new Date().toISOString()),
    total: active.length,
    sections,
    emptyMessage: "Sin candidatos activos.",
    footer: recruiterSummary ? `Reclutadores: ${recruiterSummary}` : undefined,
  });
}

export function CandidateReportModal({
  isOpen,
  onClose,
  candidates,
}: CandidateReportModalProps) {
  const active = useMemo(
    () => candidates.filter((c) => ACTIVE_STATUSES.has(c.status)),
    [candidates],
  );
  const totalActivos = active.length;
  const message = useMemo(() => buildWhatsAppMessage(active), [active]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(id);
  }, [copied]);

  useEffect(() => {
    if (!isOpen) setCopied(false);
  }, [isOpen]);

  const handleCopy = async () => {
    try {
      await copyTextToClipboard(message);
      setCopied(true);
    } catch {
      toast.error({ title: "No se pudo copiar el reporte" });
    }
  };

  const empty = totalActivos === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="candidate-report-modal"
      icon={<UsersRound size={20} aria-hidden="true" />}
      title="Resumen de candidatos"
      size="xs"
      footerActions={
        <button
          type="button"
          className="btn-primary candidate-report-modal__action"
          onClick={handleCopy}
          disabled={empty}
        >
          <span
            className="candidate-report-modal__action-inner"
            aria-live="polite"
            aria-atomic="true"
          >
            <MorphingIcon icon={copied ? Check : Copy} size={16} />
            {copied ? "Reporte copiado" : "Copiar reporte"}
          </span>
        </button>
      }
    >
      <div className="modal-body candidate-report-modal__body">
        {empty ? (
          <motion.p
            className="candidate-report-modal__empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            No hay candidatos activos en proceso.
          </motion.p>
        ) : (
          <motion.div
            className="candidate-report-modal__summary"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <span className="candidate-report-modal__total">
              {totalActivos}
            </span>
            <span className="candidate-report-modal__total-label">
              Candidato{totalActivos === 1 ? '' : 's'} en total
            </span>
          </motion.div>
        )}
      </div>
    </Modal>
  );
}

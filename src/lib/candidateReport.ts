import { formatReadableDate } from "@/lib/dates";
import { findTeamMember, type TeamMember } from '@/features/team/types';
import { normalizeString, toNaturalCase } from "@/lib/utils";
import {
  buildWhatsAppReport,
  formatWhatsAppLabel,
  formatWhatsAppSection,
  type WhatsAppReportSection,
} from "@/lib/whatsappReport";
import type { Candidate, CandidateStatus } from "@/lib/types";

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

function buildRecruiterRows(active: Candidate[], members: TeamMember[]): RecruiterRow[] {
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
  for (const member of members.filter(member => member.selectable)) acc.set(member.canonical_name, empty(member.short_name));
  acc.set(SIN_ASIGNAR, empty(SIN_ASIGNAR));

  for (const c of active) {
    const norm = findTeamMember(members, c.reclutador)?.canonical_name ?? normalizeString(c.reclutador ?? "");
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

function buildWhatsAppMessage(active: Candidate[], members: TeamMember[]): string {
  const generales = active.filter((c) => !c.is_starlite);
  const starlite = active.filter((c) => c.is_starlite);
  const recruiters = buildRecruiterRows(active, members).filter((row) => row.total > 0);
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

export function buildCandidateReport(candidates: Candidate[], members: TeamMember[]): string | null {
  const active = candidates.filter((candidate) => ACTIVE_STATUSES.has(candidate.status));
  return active.length > 0 ? buildWhatsAppMessage(active, members) : null;
}

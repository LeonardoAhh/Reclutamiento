import { toNaturalCase } from "./utils";

export interface WhatsAppReportItem {
  label: string;
  value: string;
  separator?: ":" | "—";
}

export interface WhatsAppReportSection {
  title: string;
  items: WhatsAppReportItem[];
}

interface WhatsAppReportOptions {
  title: string;
  date: string;
  total: number;
  sections: WhatsAppReportSection[];
  emptyMessage: string;
  footer?: string;
}

interface WhatsAppReportBlocksOptions
  extends Omit<WhatsAppReportOptions, "sections"> {
  blocks: string[];
}

function buildWhatsAppReportHeader(
  options: Pick<WhatsAppReportOptions, "title" | "date" | "total">,
): string[] {
  return [`*${options.title} · ${options.total}*`, `_${options.date}_`];
}

export function formatWhatsAppLabel(value: string): string {
  return toNaturalCase(value)
    .replace(/\b([1-4])(?:ER|RA|RO|DO|DA|TO|TA|O)?\.?\s+Turno\b/gi, "Turno $1")
    .replace(/\bAdmtv[oa]\b/gi, "Administrativo");
}

export function formatWhatsAppSection(value: string, area: string): string {
  const escapedArea = area.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const withoutRepeatedArea = value.replace(
    new RegExp(`^(?:A\\.?\\s+)?${escapedArea}(?:\\s*[-—])?\\s*`, "i"),
    "",
  );
  return formatWhatsAppLabel(withoutRepeatedArea);
}

export function buildWhatsAppReport({
  title,
  date,
  total,
  sections,
  emptyMessage,
  footer,
}: WhatsAppReportOptions): string {
  const populatedSections = sections.filter((section) => section.items.length > 0);
  const lines = buildWhatsAppReportHeader({ title, date, total });

  if (populatedSections.length === 0) {
    return [...lines, "", emptyMessage].join("\n");
  }

  for (const section of populatedSections) {
    lines.push("", `*${section.title}*`);
    for (const item of section.items) {
      const separator = item.separator === "—" ? " — " : ": ";
      lines.push(`• ${item.label}${separator}${item.value}`);
    }
  }

  if (footer) lines.push("", `_${footer}_`);

  return lines.join("\n");
}

export function buildWhatsAppReportFromBlocks({
  title,
  date,
  total,
  blocks,
  emptyMessage,
}: WhatsAppReportBlocksOptions): string {
  const populatedBlocks = blocks.filter(Boolean);
  const lines = buildWhatsAppReportHeader({ title, date, total });
  return populatedBlocks.length > 0
    ? [...lines, "", populatedBlocks.join("\n\n")].join("\n")
    : [...lines, "", emptyMessage].join("\n");
}

export async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.readOnly = true;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    if (!document.execCommand("copy")) {
      throw new Error("Clipboard copy command failed");
    }
  } finally {
    document.body.removeChild(textarea);
  }
}

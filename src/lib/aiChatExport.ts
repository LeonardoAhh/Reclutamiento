import type jsPDF from "jspdf";

import { AI_CHAT_EXPORT_CONFIG } from "@/lib/constants";
import { localTodayIso } from "@/lib/dates";
import { addReportFooter } from "@/lib/pdf-footer";

interface EvaluationExportInput {
  analysis: string;
  candidateFileName: string;
  jobName: string;
}

type PdfBlock =
  | { type: "section"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullet"; text: string }
  | { type: "numbered"; text: string; index: string };

function cleanInlineMarkdown(value: string): string {
  return value
    .replace(/✅/g, "")
    .replace(/❌/g, "")
    .replace(/⚠️?/g, "")
    .replace(/[🔹🚩💡]/g, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/[*_~`]/g, "")
    .replace(/^(Cumple|Brecha|Parcial):\s*\1:\s*/i, "$1: ")
    .replace(/^(Cumple|Brecha|Parcial):\s*/i, "$1: ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function parseMarkdownBlocks(markdown: string): PdfBlock[] {
  const normalized = markdown
    .replace(/```[\w-]*\n?([\s\S]*?)```/g, "$1")
    .replace(/^\s*>\s?/gm, "")
    .replace(/^\|?[\s:|-]+\|?\s*$/gm, "")
    .replace(/\s*\|\s*/g, " · ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const blocks: PdfBlock[] = [];

  normalized.split("\n").forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) return;

    const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
    const boldHeadingMatch = line.match(/^\*\*([^*]+)\*\*:?$/);
    const bulletMatch = line.match(/^[-*+]\s+(.+)$/);
    const numberedMatch = line.match(/^(\d+)[.)]\s+(.+)$/);

    if (headingMatch || boldHeadingMatch) {
      const heading = cleanInlineMarkdown(
        headingMatch?.[1] ?? boldHeadingMatch?.[1] ?? "",
      ).replace(/:$/, "");
      if (heading) blocks.push({ type: "section", text: heading });
      return;
    }

    if (bulletMatch) {
      blocks.push({ type: "bullet", text: cleanInlineMarkdown(bulletMatch[1]) });
      return;
    }

    if (numberedMatch) {
      blocks.push({
        type: "numbered",
        index: numberedMatch[1],
        text: cleanInlineMarkdown(numberedMatch[2]),
      });
      return;
    }

    blocks.push({ type: "paragraph", text: cleanInlineMarkdown(line) });
  });

  return blocks.filter((block) => block.text.length > 0);
}

function markdownToPlainText(markdown: string): string {
  return parseMarkdownBlocks(markdown)
    .map((block) => {
      if (block.type === "bullet") return `• ${block.text}`;
      if (block.type === "numbered") return `${block.index}. ${block.text}`;
      return block.text;
    })
    .join("\n");
}

function getCssTokenNumber(tokenName: string): number {
  const rawValue = getComputedStyle(document.documentElement)
    .getPropertyValue(tokenName)
    .trim();
  const parsedValue = Number.parseFloat(rawValue);

  if (!Number.isFinite(parsedValue)) {
    throw new Error(`No se pudo resolver el token ${tokenName}.`);
  }

  return parsedValue;
}

function sanitizeFileSegment(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function candidateDisplayName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
}

function formatDocumentDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export function buildEvaluationShareText({
  analysis,
  candidateFileName,
  jobName,
}: EvaluationExportInput): string {
  return [
    AI_CHAT_EXPORT_CONFIG.documentTitle,
    `CV: ${candidateFileName}`,
    `Vacante: ${jobName}`,
    "",
    markdownToPlainText(analysis),
  ].join("\n");
}

export async function copyEvaluationText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.className = "sr-only";
  textArea.setAttribute("readonly", "");
  document.body.appendChild(textArea);
  textArea.select();
  const copied = document.execCommand("copy");
  textArea.remove();

  if (!copied) {
    throw new Error("El navegador no permitió copiar el contenido.");
  }
}

export async function exportEvaluationPdf({
  analysis,
  candidateFileName,
  jobName,
}: EvaluationExportInput): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const config = AI_CHAT_EXPORT_CONFIG;
  const pdf = new jsPDF({
    orientation: config.orientation,
    unit: "pt",
    format: config.pageFormat,
  });
  const toPoints = (tokenName: string) =>
    getCssTokenNumber(tokenName) * config.cssPixelToPoint;
  const margin = toPoints(config.marginToken);
  const footerGap = toPoints(config.footerGapToken);
  const headerHeight = toPoints(config.headerHeightToken);
  const headingSize = toPoints(config.headingSizeToken);
  const sectionSize = toPoints(config.sectionSizeToken);
  const bodySize = toPoints(config.bodySizeToken);
  const captionSize = toPoints(config.captionSizeToken);
  const bodyLineHeight = getCssTokenNumber(config.bodyLineToken) * bodySize;
  const sectionGap = toPoints(config.sectionGapToken);
  const blockGap = toPoints(config.blockGapToken);
  const bulletIndent = toPoints(config.bulletIndentToken);
  const hairlineWidth = getCssTokenNumber(config.hairlineWidthToken);
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  const contentBottom = pageHeight - margin - footerGap;
  const today = localTodayIso();
  let cursorY = margin;

  const setInk = () => pdf.setTextColor(0, 0, 0);
  const setMuted = () => pdf.setTextColor(90, 90, 90);

  const drawContinuationHeader = () => {
    pdf.setFillColor(0, 0, 0);
    pdf.rect(0, 0, pageWidth, headerHeight / 2, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(captionSize);
    pdf.setTextColor(255, 255, 255);
    pdf.text(config.continuationLabel, margin, headerHeight / 3);
    cursorY = headerHeight / 2 + margin;
    setInk();
  };

  const addContentPage = () => {
    pdf.addPage();
    drawContinuationHeader();
  };

  const ensurePageSpace = (requiredHeight: number) => {
    if (cursorY + requiredHeight <= contentBottom) return;
    addContentPage();
  };

  const drawCoverHeader = () => {
    pdf.setFillColor(0, 0, 0);
    pdf.rect(0, 0, pageWidth, headerHeight, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(captionSize);
    pdf.text(config.documentEyebrow, margin, margin);
    pdf.setFontSize(headingSize);
    pdf.text(config.documentTitle, margin, margin + headingSize + blockGap);
    cursorY = headerHeight + margin;
    setInk();
  };

  const drawMetadata = () => {
    const columns = [
      {
        label: config.candidateLabel,
        value: candidateDisplayName(candidateFileName),
      },
      { label: config.jobLabel, value: jobName },
      { label: config.dateLabel, value: formatDocumentDate(today) },
    ];
    const columnWidth = contentWidth / columns.length;
    const valueLineHeight = bodyLineHeight;
    const values = columns.map((column) =>
      pdf.splitTextToSize(column.value, columnWidth - blockGap) as string[],
    );
    const metadataHeight =
      captionSize + blockGap + Math.max(...values.map((lines) => lines.length)) * valueLineHeight;

    columns.forEach((column, index) => {
      const x = margin + index * columnWidth;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(captionSize);
      setMuted();
      pdf.text(column.label.toUpperCase(), x, cursorY);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(bodySize);
      setInk();
      pdf.text(values[index], x, cursorY + captionSize + blockGap);
    });
    cursorY += metadataHeight + sectionGap;
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(hairlineWidth);
    pdf.line(margin, cursorY, pageWidth - margin, cursorY);
    cursorY += sectionGap;
  };

  const writeSection = (text: string) => {
    const lines = pdf.splitTextToSize(text, contentWidth) as string[];
    const requiredHeight = lines.length * sectionSize + sectionGap;
    ensurePageSpace(requiredHeight);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(sectionSize);
    setInk();
    pdf.text(lines, margin, cursorY);
    cursorY += lines.length * sectionSize + blockGap;
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(hairlineWidth);
    pdf.line(margin, cursorY, pageWidth - margin, cursorY);
    cursorY += sectionGap;
  };

  const writeBodyBlock = (block: PdfBlock) => {
    const isList = block.type === "bullet" || block.type === "numbered";
    const marker = block.type === "bullet" ? "•" : block.type === "numbered" ? `${block.index}.` : "";
    const textX = margin + (isList ? bulletIndent : 0);
    const availableWidth = contentWidth - (isList ? bulletIndent : 0);
    const lines = pdf.splitTextToSize(block.text, availableWidth) as string[];
    const requiredHeight = lines.length * bodyLineHeight + blockGap;
    ensurePageSpace(requiredHeight);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(bodySize);
    setInk();
    if (marker) {
      pdf.setFont("helvetica", "bold");
      pdf.text(marker, margin, cursorY);
      pdf.setFont("helvetica", "normal");
    }
    pdf.text(lines, textX, cursorY);
    cursorY += lines.length * bodyLineHeight + blockGap;
  };

  drawCoverHeader();
  drawMetadata();
  parseMarkdownBlocks(analysis).forEach((block) => {
    if (block.type === "section") {
      writeSection(block.text);
      return;
    }
    writeBodyBlock(block);
  });

  addReportFooter(pdf);
  const candidateSegment = sanitizeFileSegment(candidateFileName) || "candidato";
  pdf.save(`${config.filePrefix}-${candidateSegment}-${today}.pdf`);
}

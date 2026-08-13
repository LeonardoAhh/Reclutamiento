import { AI_CHAT_EXPORT_CONFIG } from "@/lib/constants";
import { localTodayIso } from "@/lib/dates";
import { addReportFooter } from "@/lib/pdf-footer";

interface EvaluationExportInput {
  analysis: string;
  candidateFileName: string;
  jobName: string;
}

function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/✅/g, "Cumple:")
    .replace(/❌/g, "Brecha:")
    .replace(/⚠️?/g, "Parcial:")
    .replace(/[🔹🚩💡]/g, "")
    .replace(/```[\w-]*\n?([\s\S]*?)```/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/^\s*>\s?/gm, "")
    .replace(/^\|?[\s:|-]+\|?\s*$/gm, "")
    .replace(/\s*\|\s*/g, " | ")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/[*_~`]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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

  const cssPixelToPoint = config.cssPixelToPoint;
  const margin = getCssTokenNumber(config.marginToken) * cssPixelToPoint;
  const footerGap = getCssTokenNumber(config.footerGapToken) * cssPixelToPoint;
  const headingSize = getCssTokenNumber(config.headingSizeToken) * cssPixelToPoint;
  const bodySize = getCssTokenNumber(config.bodySizeToken) * cssPixelToPoint;
  const bodyLineHeight = getCssTokenNumber(config.bodyLineToken) * bodySize;
  const sectionGap = getCssTokenNumber(config.sectionGapToken) * cssPixelToPoint;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  const contentBottom = pageHeight - margin - footerGap;
  let cursorY = margin;

  const ensurePageSpace = (requiredHeight: number) => {
    if (cursorY + requiredHeight <= contentBottom) return;
    pdf.addPage();
    cursorY = margin;
  };

  const writeLines = (
    content: string,
    fontSize: number,
    lineHeight: number,
    gapAfter: number,
  ) => {
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(content, contentWidth) as string[];

    lines.forEach((line) => {
      ensurePageSpace(lineHeight);
      pdf.text(line, margin, cursorY);
      cursorY += lineHeight;
    });
    cursorY += gapAfter;
  };

  writeLines(config.documentTitle, headingSize, headingSize, sectionGap);
  writeLines(`CV: ${candidateFileName}`, bodySize, bodyLineHeight, 0);
  writeLines(`Vacante: ${jobName}`, bodySize, bodyLineHeight, sectionGap);

  markdownToPlainText(analysis)
    .split("\n")
    .forEach((paragraph) => {
      if (!paragraph.trim()) {
        ensurePageSpace(sectionGap);
        cursorY += sectionGap;
        return;
      }
      writeLines(paragraph, bodySize, bodyLineHeight, sectionGap);
    });

  addReportFooter(pdf);
  const candidateSegment = sanitizeFileSegment(candidateFileName) || "candidato";
  pdf.save(
    `${config.filePrefix}-${candidateSegment}-${localTodayIso()}.pdf`,
  );
}

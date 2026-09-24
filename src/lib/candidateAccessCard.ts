import { CANDIDATE_ACCESS_CARD_CONFIG } from "./constants";
import { toNaturalCase } from "./utils";

export interface CandidateAccessCardData {
  candidateName: string;
  recruiterName: string;
  position: string;
  interviewDate?: string | null;
}

const OUTPUT_WIDTH = 1080;
const OUTPUT_HEIGHT = 1350;
const RENDER_SCALE = 3;
const CARD_WIDTH = OUTPUT_WIDTH / RENDER_SCALE;
const CARD_HEIGHT = OUTPUT_HEIGHT / RENDER_SCALE;

type CanvasContextWithLetterSpacing = CanvasRenderingContext2D & {
  letterSpacing?: string;
};

interface CardTokens {
  paper: string;
  ink: string;
  muted: string;
  soft: string;
  hairline: string;
  fontFamily: string;
  borderWidth: number;
  radiusMd: number;
  radiusLg: number;
  spaceXs: number;
  spaceSm: number;
  spaceMd: number;
  spaceLg: number;
  spaceXl: number;
  headingMdSize: number;
  headingMdWeight: number;
  headingMdLine: number;
  headingMdTracking: string;
  headingSmSize: number;
  headingSmWeight: number;
  headingSmLine: number;
  headingSmTracking: string;
  bodySmSize: number;
  bodySmLine: number;
  bodyStrongSize: number;
  bodyStrongWeight: number;
  bodyStrongLine: number;
  captionSize: number;
  captionWeight: number;
  captionLine: number;
}

interface FittedText {
  lines: string[];
  size: number;
  lineHeight: number;
}

function readCssToken(name: string): string {
  const value = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  if (!value) throw new Error(`Falta el token CSS ${name}.`);
  return value;
}

function readCssNumber(name: string): number {
  const value = Number.parseFloat(readCssToken(name));
  if (!Number.isFinite(value)) {
    throw new Error(`El token CSS ${name} no contiene un valor numérico.`);
  }
  return value;
}

function getCardTokens(): CardTokens {
  return {
    paper: readCssToken("--color-document-paper"),
    ink: readCssToken("--color-document-ink"),
    muted: readCssToken("--color-document-muted"),
    soft: readCssToken("--color-document-soft"),
    hairline: readCssToken("--color-document-hairline"),
    fontFamily: readCssToken("--font-body"),
    borderWidth: readCssNumber("--border-width"),
    radiusMd: readCssNumber("--rounded-md"),
    radiusLg: readCssNumber("--rounded-lg"),
    spaceXs: readCssNumber("--spacing-xs"),
    spaceSm: readCssNumber("--spacing-sm"),
    spaceMd: readCssNumber("--spacing-md"),
    spaceLg: readCssNumber("--spacing-lg"),
    spaceXl: readCssNumber("--spacing-xl"),
    headingMdSize: readCssNumber("--type-heading-md-size"),
    headingMdWeight: readCssNumber("--type-heading-md-weight"),
    headingMdLine: readCssNumber("--type-heading-md-line"),
    headingMdTracking: readCssToken("--type-heading-md-tracking"),
    headingSmSize: readCssNumber("--type-heading-sm-size"),
    headingSmWeight: readCssNumber("--type-heading-sm-weight"),
    headingSmLine: readCssNumber("--type-heading-sm-line"),
    headingSmTracking: readCssToken("--type-heading-sm-tracking"),
    bodySmSize: readCssNumber("--type-body-sm-size"),
    bodySmLine: readCssNumber("--type-body-sm-line"),
    bodyStrongSize: readCssNumber("--type-body-strong-size"),
    bodyStrongWeight: readCssNumber("--type-body-strong-weight"),
    bodyStrongLine: readCssNumber("--type-body-strong-line"),
    captionSize: readCssNumber("--type-caption-xs-size"),
    captionWeight: readCssNumber("--type-caption-xs-weight"),
    captionLine: readCssNumber("--type-caption-xs-line"),
  };
}

function setFont(
  context: CanvasRenderingContext2D,
  weight: number,
  size: number,
  family: string,
  letterSpacing = "0px",
): void {
  context.font = `${weight} ${size}px ${family}`;
  (context as CanvasContextWithLetterSpacing).letterSpacing = letterSpacing;
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - safeRadius,
    y + height,
  );
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

function splitLongWord(
  context: CanvasRenderingContext2D,
  word: string,
  maxWidth: number,
): string[] {
  const parts: string[] = [];
  let part = "";

  for (const character of word) {
    const nextPart = `${part}${character}`;
    if (part && context.measureText(nextPart).width > maxWidth) {
      parts.push(part);
      part = character;
    } else {
      part = nextPart;
    }
  }

  if (part) parts.push(part);
  return parts;
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const sourceWords = text.trim().split(/\s+/).filter(Boolean);
  if (sourceWords.length === 0) return ["—"];

  const words = sourceWords.flatMap((word) =>
    context.measureText(word).width > maxWidth
      ? splitLongWord(context, word, maxWidth)
      : [word],
  );
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidateLine = currentLine ? `${currentLine} ${word}` : word;
    if (context.measureText(candidateLine).width <= maxWidth) {
      currentLine = candidateLine;
      continue;
    }

    if (currentLine) lines.push(currentLine);
    currentLine = word;
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

function fitWrappedText(
  context: CanvasRenderingContext2D,
  options: {
    text: string;
    maxWidth: number;
    maxLines: number;
    initialSize: number;
    minimumSize: number;
    weight: number;
    lineRatio: number;
    fontFamily: string;
    tracking?: string;
  },
): FittedText {
  const {
    text,
    maxWidth,
    maxLines,
    initialSize,
    minimumSize,
    weight,
    lineRatio,
    fontFamily,
    tracking = "0px",
  } = options;

  for (let size = initialSize; size >= minimumSize; size -= 1) {
    setFont(context, weight, size, fontFamily, tracking);
    const lines = wrapText(context, text, maxWidth);
    if (lines.length <= maxLines || size === minimumSize) {
      return { lines, size, lineHeight: size * lineRatio };
    }
  }

  return { lines: [text], size: minimumSize, lineHeight: minimumSize * lineRatio };
}

function drawTextLines(
  context: CanvasRenderingContext2D,
  text: FittedText,
  x: number,
  y: number,
  color: string,
  weight: number,
  fontFamily: string,
  tracking = "0px",
): number {
  context.fillStyle = color;
  setFont(context, weight, text.size, fontFamily, tracking);
  text.lines.forEach((line, index) => {
    context.fillText(line, x, y + index * text.lineHeight);
  });
  return y + text.lines.length * text.lineHeight;
}

function drawLabel(
  context: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
  tokens: CardTokens,
): number {
  context.fillStyle = tokens.muted;
  setFont(
    context,
    tokens.bodyStrongWeight,
    tokens.captionSize,
    tokens.fontFamily,
  );
  context.fillText(label, x, y);
  return y + tokens.captionSize * tokens.captionLine;
}

function drawLabeledValue(
  context: CanvasRenderingContext2D,
  options: {
    label: string;
    value: string;
    x: number;
    y: number;
    maxWidth: number;
    initialSize: number;
    minimumSize: number;
    maxLines: number;
    weight: number;
    lineRatio: number;
    tracking?: string;
    tokens: CardTokens;
  },
): number {
  const {
    label,
    value,
    x,
    y,
    maxWidth,
    initialSize,
    minimumSize,
    maxLines,
    weight,
    lineRatio,
    tracking = "0px",
    tokens,
  } = options;
  const valueTop = drawLabel(context, label, x, y, tokens) + tokens.spaceXs;
  const fittedValue = fitWrappedText(context, {
    text: value,
    maxWidth,
    maxLines,
    initialSize,
    minimumSize,
    weight,
    lineRatio,
    fontFamily: tokens.fontFamily,
    tracking,
  });

  return drawTextLines(
    context,
    fittedValue,
    x,
    valueTop,
    tokens.ink,
    weight,
    tokens.fontFamily,
    tracking,
  );
}

function drawDivider(
  context: CanvasRenderingContext2D,
  y: number,
  tokens: CardTokens,
): void {
  context.strokeStyle = tokens.hairline;
  context.lineWidth = tokens.borderWidth;
  context.beginPath();
  context.moveTo(tokens.spaceXl, y);
  context.lineTo(CARD_WIDTH - tokens.spaceXl, y);
  context.stroke();
}

function drawHeader(
  context: CanvasRenderingContext2D,
  tokens: CardTokens,
): void {
  const company = fitWrappedText(context, {
    text: CANDIDATE_ACCESS_CARD_CONFIG.cardSubtitle,
    maxWidth: CARD_WIDTH - tokens.spaceXl * 2,
    maxLines: 1,
    initialSize: tokens.captionSize,
    minimumSize: tokens.captionSize,
    weight: tokens.bodyStrongWeight,
    lineRatio: tokens.captionLine,
    fontFamily: tokens.fontFamily,
  });
  drawTextLines(
    context,
    company,
    tokens.spaceXl,
    tokens.spaceLg,
    tokens.muted,
    tokens.bodyStrongWeight,
    tokens.fontFamily,
  );

  const titleTop = tokens.spaceLg + company.lineHeight + tokens.spaceSm;
  context.fillStyle = tokens.ink;
  setFont(
    context,
    tokens.headingSmWeight,
    tokens.headingSmSize,
    tokens.fontFamily,
    tokens.headingSmTracking,
  );
  context.fillText(
    CANDIDATE_ACCESS_CARD_CONFIG.cardTitle,
    tokens.spaceXl,
    titleTop,
  );

  const dividerY =
    titleTop + tokens.headingSmSize * tokens.headingSmLine + tokens.spaceMd;
  context.strokeStyle = tokens.hairline;
  context.lineWidth = tokens.borderWidth;
  context.beginPath();
  context.moveTo(tokens.spaceXl, dividerY);
  context.lineTo(CARD_WIDTH - tokens.spaceXl, dividerY);
  context.stroke();
}

function drawLocation(
  context: CanvasRenderingContext2D,
  y: number,
  tokens: CardTokens,
): number {
  const panelX = tokens.spaceXl;
  const panelWidth = CARD_WIDTH - tokens.spaceXl * 2;
  const innerX = panelX + tokens.spaceMd;
  const innerWidth = panelWidth - tokens.spaceMd * 2;
  const name = fitWrappedText(context, {
    text: CANDIDATE_ACCESS_CARD_CONFIG.locationName,
    maxWidth: innerWidth,
    maxLines: 1,
    initialSize: tokens.bodyStrongSize,
    minimumSize: tokens.bodySmSize,
    weight: tokens.bodyStrongWeight,
    lineRatio: tokens.bodyStrongLine,
    fontFamily: tokens.fontFamily,
  });
  const address = fitWrappedText(context, {
    text: CANDIDATE_ACCESS_CARD_CONFIG.address,
    maxWidth: innerWidth,
    maxLines: 2,
    initialSize: tokens.captionSize,
    minimumSize: tokens.captionSize,
    weight: tokens.captionWeight,
    lineRatio: tokens.captionLine,
    fontFamily: tokens.fontFamily,
  });
  const labelHeight = tokens.captionSize * tokens.captionLine;
  const panelHeight =
    tokens.spaceSm * 2 +
    labelHeight +
    tokens.spaceXs +
    name.lines.length * name.lineHeight +
    tokens.spaceXs +
    address.lines.length * address.lineHeight;

  context.fillStyle = tokens.soft;
  roundedRect(
    context,
    panelX,
    y,
    panelWidth,
    panelHeight,
    tokens.radiusMd,
  );
  context.fill();

  let contentY = y + tokens.spaceSm;
  contentY =
    drawLabel(
      context,
      CANDIDATE_ACCESS_CARD_CONFIG.locationLabel,
      innerX,
      contentY,
      tokens,
    ) + tokens.spaceXs;
  contentY = drawTextLines(
    context,
    name,
    innerX,
    contentY,
    tokens.ink,
    tokens.bodyStrongWeight,
    tokens.fontFamily,
  );
  contentY += tokens.spaceXs;
  drawTextLines(
    context,
    address,
    innerX,
    contentY,
    tokens.muted,
    tokens.captionWeight,
    tokens.fontFamily,
  );

  return y + panelHeight;
}

function drawFooter(
  context: CanvasRenderingContext2D,
  tokens: CardTokens,
): void {
  const maxWidth = CARD_WIDTH - tokens.spaceXl * 2;
  const identification = fitWrappedText(context, {
    text: CANDIDATE_ACCESS_CARD_CONFIG.identificationNotice,
    maxWidth,
    maxLines: 1,
    initialSize: tokens.captionSize,
    minimumSize: tokens.captionSize,
    weight: tokens.bodyStrongWeight,
    lineRatio: tokens.captionLine,
    fontFamily: tokens.fontFamily,
  });
  const access = fitWrappedText(context, {
    text: CANDIDATE_ACCESS_CARD_CONFIG.accessNotice,
    maxWidth,
    maxLines: 1,
    initialSize: tokens.captionSize,
    minimumSize: tokens.captionSize,
    weight: tokens.captionWeight,
    lineRatio: tokens.captionLine,
    fontFamily: tokens.fontFamily,
  });
  const contentHeight =
    identification.lineHeight + tokens.spaceXs + access.lineHeight;
  const contentTop = CARD_HEIGHT - tokens.spaceXs - contentHeight;

  context.strokeStyle = tokens.hairline;
  context.lineWidth = tokens.borderWidth;
  context.beginPath();
  context.moveTo(tokens.spaceXl, contentTop - tokens.spaceSm);
  context.lineTo(CARD_WIDTH - tokens.spaceXl, contentTop - tokens.spaceSm);
  context.stroke();

  context.textAlign = "center";
  let textY = drawTextLines(
    context,
    identification,
    CARD_WIDTH / 2,
    contentTop,
    tokens.ink,
    tokens.bodyStrongWeight,
    tokens.fontFamily,
  );
  textY += tokens.spaceXs;
  drawTextLines(
    context,
    access,
    CARD_WIDTH / 2,
    textY,
    tokens.muted,
    tokens.captionWeight,
    tokens.fontFamily,
  );
  context.textAlign = "left";
}

function createCardCanvas(data: CandidateAccessCardData): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_WIDTH;
  canvas.height = OUTPUT_HEIGHT;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("No fue posible generar la imagen del pase.");

  const tokens = getCardTokens();
  const contentWidth = CARD_WIDTH - tokens.spaceXl * 2;
  const displayCandidateName = toNaturalCase(data.candidateName, {
    preserveAcronyms: false,
  });
  const displayRecruiterName = toNaturalCase(data.recruiterName, {
    preserveAcronyms: false,
  });
  const displayPosition = toNaturalCase(data.position);
  const candidateTop = 92;
  const positionTop = 174;
  const detailsTop = 246;
  const locationTop = 298;

  context.scale(RENDER_SCALE, RENDER_SCALE);
  context.textBaseline = "top";
  context.save();
  roundedRect(
    context,
    0,
    0,
    CARD_WIDTH,
    CARD_HEIGHT,
    tokens.radiusLg,
  );
  context.clip();
  context.fillStyle = tokens.paper;
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  drawHeader(context, tokens);
  drawLabeledValue(context, {
    label: CANDIDATE_ACCESS_CARD_CONFIG.candidateLabel,
    value: displayCandidateName,
    x: tokens.spaceXl,
    y: candidateTop,
    maxWidth: contentWidth,
    initialSize: tokens.headingMdSize,
    minimumSize: tokens.bodyStrongSize,
    maxLines: 2,
    weight: tokens.headingMdWeight,
    lineRatio: tokens.headingMdLine,
    tracking: tokens.headingMdTracking,
    tokens,
  });

  drawDivider(context, positionTop - tokens.spaceLg, tokens);

  drawLabeledValue(context, {
    label: CANDIDATE_ACCESS_CARD_CONFIG.positionLabel,
    value: displayPosition,
    x: tokens.spaceXl,
    y: positionTop,
    maxWidth: contentWidth,
    initialSize: tokens.bodyStrongSize,
    minimumSize: tokens.captionSize,
    maxLines: 1,
    weight: tokens.bodyStrongWeight,
    lineRatio: tokens.bodyStrongLine,
    tokens,
  });

  drawDivider(context, detailsTop - tokens.spaceLg, tokens);

  const columnGap = tokens.spaceMd;
  const dateColumnWidth = (contentWidth - columnGap) / 3;
  const recruiterColumnWidth = contentWidth - columnGap - dateColumnWidth;
  if (data.interviewDate) {
    drawLabeledValue(context, {
      label: CANDIDATE_ACCESS_CARD_CONFIG.dateLabel,
      value: data.interviewDate,
      x: tokens.spaceXl,
      y: detailsTop,
      maxWidth: dateColumnWidth,
      initialSize: tokens.bodySmSize,
      minimumSize: tokens.captionSize,
      maxLines: 1,
      weight: tokens.bodyStrongWeight,
      lineRatio: tokens.bodySmLine,
      tokens,
    });
  }
  drawLabeledValue(context, {
    label: CANDIDATE_ACCESS_CARD_CONFIG.recruiterLabel,
    value: displayRecruiterName,
    x: data.interviewDate
      ? tokens.spaceXl + dateColumnWidth + columnGap
      : tokens.spaceXl,
    y: detailsTop,
    maxWidth: data.interviewDate ? recruiterColumnWidth : contentWidth,
    initialSize: tokens.bodySmSize,
    minimumSize: tokens.captionSize,
    maxLines: 1,
    weight: tokens.bodyStrongWeight,
    lineRatio: tokens.bodySmLine,
    tokens,
  });

  drawDivider(context, locationTop - tokens.spaceMd, tokens);
  drawLocation(context, locationTop, tokens);
  drawFooter(context, tokens);
  context.restore();

  context.strokeStyle = tokens.hairline;
  context.lineWidth = tokens.borderWidth;
  roundedRect(
    context,
    tokens.borderWidth / 2,
    tokens.borderWidth / 2,
    CARD_WIDTH - tokens.borderWidth,
    CARD_HEIGHT - tokens.borderWidth,
    tokens.radiusLg,
  );
  context.stroke();

  return canvas;
}

export async function createCandidateAccessCardBlob(
  data: CandidateAccessCardData,
): Promise<Blob> {
  const canvas = createCardCanvas(data);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("No fue posible convertir el pase a imagen."));
    }, "image/png");
  });
}

export function getCandidateAccessCardFilename(candidateName: string): string {
  const safeName = candidateName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `${CANDIDATE_ACCESS_CARD_CONFIG.filePrefix}-${safeName || "candidato"}.png`;
}

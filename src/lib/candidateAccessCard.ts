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
  candidateNameSize: number;
  bodySmSize: number;
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
    candidateNameSize: readCssNumber("--type-brand-size"),
    bodySmSize: readCssNumber("--type-body-sm-size"),
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
): number {
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
    tokens.headingMdWeight,
    tokens.headingMdSize,
    tokens.fontFamily,
    tokens.headingMdTracking,
  );
  context.fillText(
    CANDIDATE_ACCESS_CARD_CONFIG.cardTitle,
    tokens.spaceXl,
    titleTop,
  );

  const dividerY = titleTop + tokens.headingMdSize * tokens.headingMdLine + tokens.spaceMd;
  drawDivider(context, dividerY, tokens);
  return dividerY + tokens.spaceLg;
}

function drawAppointment(
  context: CanvasRenderingContext2D,
  y: number,
  data: CandidateAccessCardData,
  recruiterName: string,
  tokens: CardTokens,
): number {
  const panelX = tokens.spaceXl;
  const panelWidth = CARD_WIDTH - tokens.spaceXl * 2;
  const innerX = panelX + tokens.spaceMd;
  const innerWidth = panelWidth - tokens.spaceMd * 2;
  const gap = data.interviewDate ? tokens.spaceMd : 0;
  const dateWidth = data.interviewDate ? (innerWidth - gap) / 2 : 0;
  const recruiterWidth = data.interviewDate ? dateWidth : innerWidth;
  const date = data.interviewDate ? fitWrappedText(context, {
    text: data.interviewDate,
    maxWidth: dateWidth,
    maxLines: 3,
    initialSize: tokens.bodyStrongSize,
    minimumSize: tokens.captionSize,
    weight: tokens.bodyStrongWeight,
    lineRatio: tokens.bodyStrongLine,
    fontFamily: tokens.fontFamily,
  }) : null;
  const recruiter = fitWrappedText(context, {
    text: recruiterName,
    maxWidth: recruiterWidth,
    maxLines: 3,
    initialSize: tokens.bodyStrongSize,
    minimumSize: tokens.captionSize,
    weight: tokens.bodyStrongWeight,
    lineRatio: tokens.bodyStrongLine,
    fontFamily: tokens.fontFamily,
  });
  const labelHeight = tokens.captionSize * tokens.captionLine;
  const valueHeight = Math.max(date ? date.lines.length * date.lineHeight : 0,
    recruiter.lines.length * recruiter.lineHeight);
  const panelHeight = tokens.spaceMd * 2 + labelHeight + tokens.spaceXs + valueHeight;

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

  const contentY = y + tokens.spaceMd;
  if (date) {
    const dateY = drawLabel(context, CANDIDATE_ACCESS_CARD_CONFIG.dateLabel,
      innerX, contentY, tokens) + tokens.spaceXs;
    drawTextLines(context, date, innerX, dateY, tokens.ink,
      tokens.bodyStrongWeight, tokens.fontFamily);
  }
  const recruiterX = date ? innerX + dateWidth + gap : innerX;
  const recruiterY = drawLabel(context, CANDIDATE_ACCESS_CARD_CONFIG.recruiterLabel,
    recruiterX, contentY, tokens) + tokens.spaceXs;
  drawTextLines(context, recruiter, recruiterX, recruiterY, tokens.ink,
    tokens.bodyStrongWeight, tokens.fontFamily);

  return y + panelHeight;
}

function drawLocation(
  context: CanvasRenderingContext2D,
  y: number,
  tokens: CardTokens,
): number {
  const x = tokens.spaceXl;
  const width = CARD_WIDTH - x * 2;
  const nameBottom = drawLabeledValue(context, {
    label: CANDIDATE_ACCESS_CARD_CONFIG.locationLabel,
    value: CANDIDATE_ACCESS_CARD_CONFIG.locationName,
    x, y, maxWidth: width,
    initialSize: tokens.bodyStrongSize,
    minimumSize: tokens.bodySmSize,
    maxLines: 3,
    weight: tokens.bodyStrongWeight,
    lineRatio: tokens.bodyStrongLine,
    tokens,
  });
  const address = fitWrappedText(context, {
    text: CANDIDATE_ACCESS_CARD_CONFIG.address,
    maxWidth: width,
    maxLines: 3,
    initialSize: tokens.captionSize,
    minimumSize: tokens.captionSize,
    weight: tokens.captionWeight,
    lineRatio: tokens.captionLine,
    fontFamily: tokens.fontFamily,
  });
  return drawTextLines(context, address, x, nameBottom + tokens.spaceXs,
    tokens.muted, tokens.captionWeight, tokens.fontFamily);
}

function getFooterText(context: CanvasRenderingContext2D, tokens: CardTokens) {
  const maxWidth = CARD_WIDTH - tokens.spaceXl * 2;
  const identification = fitWrappedText(context, {
    text: CANDIDATE_ACCESS_CARD_CONFIG.identificationNotice,
    maxWidth, maxLines: 3,
    initialSize: tokens.captionSize, minimumSize: tokens.captionSize,
    weight: tokens.bodyStrongWeight, lineRatio: tokens.captionLine,
    fontFamily: tokens.fontFamily,
  });
  const access = fitWrappedText(context, {
    text: CANDIDATE_ACCESS_CARD_CONFIG.accessNotice,
    maxWidth, maxLines: 3,
    initialSize: tokens.captionSize, minimumSize: tokens.captionSize,
    weight: tokens.captionWeight, lineRatio: tokens.captionLine,
    fontFamily: tokens.fontFamily,
  });
  return { identification, access, height:
    identification.lines.length * identification.lineHeight + tokens.spaceXs
    + access.lines.length * access.lineHeight };
}

function drawFooter(
  context: CanvasRenderingContext2D,
  cardHeight: number,
  tokens: CardTokens,
): void {
  const { identification, access, height } = getFooterText(context, tokens);
  const top = cardHeight - tokens.spaceLg - height;
  drawDivider(context, top - tokens.spaceMd, tokens);
  const next = drawTextLines(context, identification, tokens.spaceXl, top,
    tokens.ink, tokens.bodyStrongWeight, tokens.fontFamily);
  drawTextLines(context, access, tokens.spaceXl, next + tokens.spaceXs,
    tokens.muted, tokens.captionWeight, tokens.fontFamily);
}

function drawBody(
  context: CanvasRenderingContext2D,
  data: CandidateAccessCardData,
  tokens: CardTokens,
): number {
  const x = tokens.spaceXl;
  const contentWidth = CARD_WIDTH - x * 2;
  const displayCandidateName = toNaturalCase(data.candidateName, {
    preserveAcronyms: false,
  });
  const displayRecruiterName = toNaturalCase(data.recruiterName, {
    preserveAcronyms: false,
  });
  const displayPosition = toNaturalCase(data.position);

  let y = drawHeader(context, tokens);
  y = drawLabeledValue(context, {
    label: CANDIDATE_ACCESS_CARD_CONFIG.candidateLabel,
    value: displayCandidateName,
    x, y, maxWidth: contentWidth,
    initialSize: tokens.candidateNameSize,
    minimumSize: tokens.bodyStrongSize,
    maxLines: 4,
    weight: tokens.headingMdWeight,
    lineRatio: tokens.headingMdLine,
    tracking: tokens.headingMdTracking,
    tokens,
  });
  y += tokens.spaceLg;
  y = drawLabeledValue(context, {
    label: CANDIDATE_ACCESS_CARD_CONFIG.positionLabel,
    value: displayPosition,
    x, y, maxWidth: contentWidth,
    initialSize: tokens.bodyStrongSize,
    minimumSize: tokens.captionSize,
    maxLines: 3,
    weight: tokens.bodyStrongWeight,
    lineRatio: tokens.bodyStrongLine,
    tokens,
  });
  y += tokens.spaceLg;
  y = drawAppointment(context, y, data, displayRecruiterName, tokens);
  y += tokens.spaceLg;
  return drawLocation(context, y, tokens);
}

function createCardCanvas(data: CandidateAccessCardData): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_WIDTH;
  canvas.height = OUTPUT_HEIGHT;
  let context = canvas.getContext("2d");
  if (!context) throw new Error("No fue posible generar la imagen del pase.");

  const tokens = getCardTokens();
  context.scale(RENDER_SCALE, RENDER_SCALE);
  context.textBaseline = "top";
  const contentBottom = drawBody(context, data, tokens);
  const footerHeight = getFooterText(context, tokens).height;
  const cardHeight = Math.max(CARD_HEIGHT, Math.ceil(contentBottom + tokens.spaceLg
    + tokens.spaceMd + footerHeight + tokens.spaceLg));

  canvas.height = cardHeight * RENDER_SCALE;
  context = canvas.getContext("2d");
  if (!context) throw new Error("No fue posible generar la imagen del pase.");
  context.scale(RENDER_SCALE, RENDER_SCALE);
  context.textBaseline = "top";
  context.save();
  roundedRect(context, 0, 0, CARD_WIDTH, cardHeight, tokens.radiusLg);
  context.clip();
  context.fillStyle = tokens.paper;
  context.fillRect(0, 0, CARD_WIDTH, cardHeight);
  drawBody(context, data, tokens);
  drawFooter(context, cardHeight, tokens);
  context.restore();

  context.strokeStyle = tokens.hairline;
  context.lineWidth = tokens.borderWidth;
  roundedRect(context, tokens.borderWidth / 2, tokens.borderWidth / 2,
    CARD_WIDTH - tokens.borderWidth, cardHeight - tokens.borderWidth, tokens.radiusLg);
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

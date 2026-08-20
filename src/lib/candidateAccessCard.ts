import { CANDIDATE_ACCESS_CARD_CONFIG } from './constants';
import { toNaturalCase } from './utils';

export interface CandidateAccessCardData {
  candidateName: string;
  recruiterName: string;
  position: string;
  interviewDate?: string | null;
}

const CARD_LAYOUT = {
  width: 1080,
  height: 1350,
  padding: 80,
  headerHeight: 240,
  cornerRadius: 48,
  panelRadius: 32,
  labelSize: 24,
  bodySize: 42,
  candidateSize: 64,
  titleSize: 64,
  subtitleSize: 24,
  hairlineWidth: 3,
  informationLineHeight: 56,
} as const;

function readCssToken(name: string): string {
  const value = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!value) throw new Error(`Falta el token CSS ${name}.`);
  return value;
}

function setFont(
  context: CanvasRenderingContext2D,
  weight: number,
  size: number,
  family: string,
  letterSpacing: string = '0px'
): void {
  context.font = `${weight} ${size}px ${family}`;
  (context as any).letterSpacing = letterSpacing;
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
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return ['—'];

  const fitWithEllipsis = (value: string): string => {
    let fitted = value.trim();
    while (fitted && context.measureText(`${fitted}…`).width > maxWidth) {
      fitted = fitted.slice(0, -1).trimEnd();
    }
    return `${fitted}…`;
  };

  const lines: string[] = [];
  let currentLine = '';

  for (let index = 0; index < words.length; index += 1) {
    const word = words[index];
    const candidateLine = currentLine ? `${currentLine} ${word}` : word;
    if (context.measureText(candidateLine).width <= maxWidth) {
      currentLine = candidateLine;
      continue;
    }

    if (!currentLine) {
      currentLine = fitWithEllipsis(word);
      continue;
    }

    if (lines.length < maxLines - 1) {
      lines.push(currentLine);
      currentLine = word;
      continue;
    }

    const remainingText = [currentLine, ...words.slice(index)].join(' ');
    lines.push(fitWithEllipsis(remainingText));
    return lines;
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(
      context.measureText(currentLine).width <= maxWidth
        ? currentLine
        : fitWithEllipsis(currentLine),
    );
  }

  return lines;
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
): number {
  const lines = wrapText(context, text, maxWidth, maxLines);
  lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight));
  return lines.length;
}

function drawInformationBlock(
  context: CanvasRenderingContext2D,
  options: {
    label: string;
    value: string;
    y: number;
    textColor: string;
    mutedColor: string;
    fontFamily: string;
    maxLines?: number;
  },
): void {
  const { padding, width, labelSize, bodySize, informationLineHeight } = CARD_LAYOUT;
  const { label, value, y, textColor, mutedColor, fontFamily, maxLines = 2 } = options;

  context.fillStyle = mutedColor;
  setFont(context, 600, labelSize, fontFamily, '+0.5px');
  context.fillText(label.toUpperCase(), padding, y);

  context.fillStyle = textColor;
  setFont(context, 600, bodySize, fontFamily, '-0.5px');
  drawWrappedText(
    context,
    value,
    padding,
    y + 54,
    width - padding * 2,
    informationLineHeight,
    maxLines,
  );
}

function createCardCanvas(data: CandidateAccessCardData): HTMLCanvasElement {
  const { width, height, padding, headerHeight, cornerRadius, panelRadius } = CARD_LAYOUT;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('No fue posible generar la imagen del pase.');

  const primary = readCssToken('--color-primary');
  const surface = readCssToken('--color-surface');
  const surfaceSoft = readCssToken('--color-canvas-soft');
  const ink = readCssToken('--color-ink');
  const muted = readCssToken('--color-muted');
  const onPrimary = readCssToken('--color-on-primary');
  const hairline = readCssToken('--color-hairline');
  const fontFamily = readCssToken('--font-body');
  const displayCandidateName = toNaturalCase(data.candidateName, {
    preserveAcronyms: false,
  });
  const displayPosition = toNaturalCase(data.position);

  context.save();
  // Main card clip
  roundedRect(context, 0, 0, width, height, cornerRadius);
  context.clip();

  // Background
  context.fillStyle = surface;
  context.fillRect(0, 0, width, height);

  // Header (Solid ink block - Inverts with theme: black in light, white in dark)
  context.fillStyle = ink;
  context.fillRect(0, 0, width, headerHeight);

  // Header Typography
  context.fillStyle = surface;
  setFont(context, 600, CARD_LAYOUT.subtitleSize, fontFamily, '1px');
  context.fillText(CANDIDATE_ACCESS_CARD_CONFIG.cardSubtitle, padding, 80);
  setFont(context, 700, CARD_LAYOUT.titleSize, fontFamily, '-2.5px');
  context.fillText(CANDIDATE_ACCESS_CARD_CONFIG.cardTitle, padding, 155);

  // "1 USO" Badge (Pill shaped)
  const badgeWidth = 140;
  const badgeHeight = 56;
  const badgeX = width - padding - badgeWidth;
  const badgeY = 60;
  context.strokeStyle = surface;
  context.lineWidth = CARD_LAYOUT.hairlineWidth;
  roundedRect(context, badgeX, badgeY, badgeWidth, badgeHeight, 9999);
  context.stroke();
  context.textAlign = 'center';
  setFont(context, 600, 22, fontFamily, '1px');
  context.fillText('1 USO', badgeX + badgeWidth / 2, badgeY + 38);

  // Candidate Name
  context.textAlign = 'center';
  context.fillStyle = muted;
  setFont(context, 600, CARD_LAYOUT.labelSize, fontFamily, '1px');
  context.fillText('CANDIDATO(A)', width / 2, 320);

  context.fillStyle = ink;
  setFont(context, 700, CARD_LAYOUT.candidateSize, fontFamily, '-1.5px');
  const candidateLines = wrapText(context, displayCandidateName, width - padding * 2, 2);
  candidateLines.forEach((line, index) => {
    context.fillText(line, width / 2, 400 + index * 70);
  });
  context.textAlign = 'left';

  // Divider
  context.strokeStyle = hairline;
  context.lineWidth = CARD_LAYOUT.hairlineWidth;
  context.beginPath();
  context.moveTo(padding, 510);
  context.lineTo(width - padding, 510);
  context.stroke();

  // Information Blocks
  drawInformationBlock(context, {
    label: 'Acude con',
    value: data.recruiterName,
    y: 570,
    textColor: ink,
    mutedColor: muted,
    fontFamily,
  });

  drawInformationBlock(context, {
    label: 'Puesto',
    value: displayPosition,
    y: 730,
    textColor: ink,
    mutedColor: muted,
    fontFamily,
  });

  if (data.interviewDate) {
    drawInformationBlock(context, {
      label: 'Fecha de entrevista',
      value: data.interviewDate,
      y: 890,
      textColor: ink,
      mutedColor: muted,
      fontFamily,
      maxLines: 1,
    });
  }

  // Location panel with Notion-style micro-shadow
  const locationTop = data.interviewDate ? 1000 : 890;
  const locationHeight = 196;
  
  context.save();
  context.shadowColor = 'rgba(0, 0, 0, 0.05)';
  context.shadowBlur = 12;
  context.shadowOffsetY = 4;
  context.fillStyle = surfaceSoft;
  roundedRect(context, padding, locationTop, width - padding * 2, locationHeight, panelRadius);
  context.fill();
  context.restore();
  
  context.strokeStyle = hairline;
  context.lineWidth = CARD_LAYOUT.hairlineWidth;
  context.stroke();

  // Location text
  context.fillStyle = muted;
  setFont(context, 600, 22, fontFamily, '1px');
  context.fillText('UBICACIÓN', padding + 36, locationTop + 52);

  context.fillStyle = ink;
  setFont(context, 600, 32, fontFamily, '-0.5px');
  context.fillText(CANDIDATE_ACCESS_CARD_CONFIG.locationName, padding + 36, locationTop + 104);
  setFont(context, 400, 27, fontFamily, '0px');
  drawWrappedText(
    context,
    CANDIDATE_ACCESS_CARD_CONFIG.address,
    padding + 36,
    locationTop + 150,
    width - padding * 2 - 72,
    36,
    2,
  );

  // Bottom notices
  const noticeTop = data.interviewDate ? 1250 : 1230;
  context.strokeStyle = hairline;
  context.beginPath();
  context.moveTo(padding, noticeTop - 36);
  context.lineTo(width - padding, noticeTop - 36);
  context.stroke();

  context.textAlign = 'center';
  context.fillStyle = ink;
  setFont(context, 600, 24, fontFamily, '-0.2px');
  context.fillText(CANDIDATE_ACCESS_CARD_CONFIG.accessNotice, width / 2, noticeTop + 12);
  context.fillStyle = muted;
  setFont(context, 400, 22, fontFamily, '0px');
  context.fillText(
    CANDIDATE_ACCESS_CARD_CONFIG.identificationNotice,
    width / 2,
    noticeTop + 50,
  );
  context.textAlign = 'left';
  context.restore();

  // Outer card stroke
  context.strokeStyle = hairline;
  context.lineWidth = CARD_LAYOUT.hairlineWidth * 2; // double width because stroke is centered
  roundedRect(context, 0, 0, width, height, cornerRadius);
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
      else reject(new Error('No fue posible convertir el pase a imagen.'));
    }, 'image/png');
  });
}

export function getCandidateAccessCardFilename(candidateName: string): string {
  const safeName = candidateName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return `${CANDIDATE_ACCESS_CARD_CONFIG.filePrefix}-${safeName || 'candidato'}.png`;
}

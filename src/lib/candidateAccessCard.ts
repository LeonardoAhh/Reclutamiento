import { CANDIDATE_ACCESS_CARD_CONFIG } from './constants';

export interface CandidateAccessCardData {
  candidateName: string;
  recruiterName: string;
  position: string;
  interviewDate?: string | null;
}

const CARD_LAYOUT = {
  width: 1080,
  height: 1350,
  padding: 72,
  headerHeight: 240,
  cornerRadius: 28,
  panelRadius: 24,
  labelSize: 28,
  bodySize: 44,
  candidateSize: 54,
  titleSize: 58,
  subtitleSize: 27,
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
): void {
  context.font = `${weight} ${size}px ${family}`;
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
  const { padding, width, labelSize, bodySize } = CARD_LAYOUT;
  const { label, value, y, textColor, mutedColor, fontFamily, maxLines = 2 } = options;

  context.fillStyle = mutedColor;
  setFont(context, 600, labelSize, fontFamily);
  context.fillText(label.toUpperCase(), padding, y);

  context.fillStyle = textColor;
  setFont(context, 700, bodySize, fontFamily);
  drawWrappedText(context, value, padding, y + 62, width - padding * 2, 54, maxLines);
}

function createCardCanvas(data: CandidateAccessCardData): HTMLCanvasElement {
  const { width, height, padding, headerHeight, cornerRadius, panelRadius } = CARD_LAYOUT;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('No fue posible generar la imagen del pase.');

  const primary = readCssToken('--color-document-primary');
  const surface = readCssToken('--color-document-paper');
  const surfaceSoft = readCssToken('--color-document-soft');
  const ink = readCssToken('--color-document-ink');
  const muted = readCssToken('--color-document-muted');
  const onPrimary = readCssToken('--color-document-on-primary');
  const hairline = readCssToken('--color-document-hairline');
  const fontFamily = readCssToken('--font-body');

  context.fillStyle = surface;
  context.fillRect(0, 0, width, height);

  context.fillStyle = primary;
  context.fillRect(0, 0, width, headerHeight);

  context.fillStyle = onPrimary;
  setFont(context, 700, CARD_LAYOUT.titleSize, fontFamily);
  context.fillText(CANDIDATE_ACCESS_CARD_CONFIG.cardTitle, padding, 104);
  setFont(context, 500, CARD_LAYOUT.subtitleSize, fontFamily);
  context.fillText(CANDIDATE_ACCESS_CARD_CONFIG.cardSubtitle, padding, 158);

  context.textAlign = 'center';
  context.fillStyle = muted;
  setFont(context, 600, CARD_LAYOUT.labelSize, fontFamily);
  context.fillText('CANDIDATO(A)', width / 2, 318);

  context.fillStyle = ink;
  setFont(context, 700, CARD_LAYOUT.candidateSize, fontFamily);
  const candidateLines = wrapText(context, data.candidateName, width - padding * 2, 2);
  candidateLines.forEach((line, index) => {
    context.fillText(line, width / 2, 390 + index * 64);
  });
  context.textAlign = 'left';

  context.strokeStyle = hairline;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(padding, 505);
  context.lineTo(width - padding, 505);
  context.stroke();

  drawInformationBlock(context, {
    label: 'Acude con',
    value: data.recruiterName,
    y: 565,
    textColor: ink,
    mutedColor: muted,
    fontFamily,
  });

  drawInformationBlock(context, {
    label: 'Puesto',
    value: data.position,
    y: 755,
    textColor: ink,
    mutedColor: muted,
    fontFamily,
  });

  if (data.interviewDate) {
    drawInformationBlock(context, {
      label: 'Fecha de entrevista',
      value: data.interviewDate,
      y: 945,
      textColor: ink,
      mutedColor: muted,
      fontFamily,
      maxLines: 1,
    });
  }

  const locationTop = data.interviewDate ? 1055 : 950;
  const locationHeight = height - locationTop - padding;
  context.fillStyle = surfaceSoft;
  roundedRect(context, padding, locationTop, width - padding * 2, locationHeight, panelRadius);
  context.fill();
  context.strokeStyle = hairline;
  context.lineWidth = 2;
  context.stroke();

  context.fillStyle = muted;
  setFont(context, 600, CARD_LAYOUT.labelSize, fontFamily);
  context.fillText('UBICACIÓN', padding * 1.5, locationTop + 56);

  context.fillStyle = ink;
  setFont(context, 700, 38, fontFamily);
  context.fillText(CANDIDATE_ACCESS_CARD_CONFIG.locationName, padding * 1.5, locationTop + 112);
  setFont(context, 500, 31, fontFamily);
  drawWrappedText(
    context,
    CANDIDATE_ACCESS_CARD_CONFIG.address,
    padding * 1.5,
    locationTop + 162,
    width - padding * 3,
    42,
    2,
  );

  context.strokeStyle = hairline;
  context.lineWidth = 2;
  roundedRect(context, 1, 1, width - 2, height - 2, cornerRadius);
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

import type { Worker } from 'tesseract.js';

/** The printed employee number sits below the bars and is usually wrapped in asterisks. */
export function findPrintedEmployeeNumber(text: string): string | null {
  const starred = [...text.matchAll(/\*\s*(\d{2,8})\s*\*/g)];
  if (starred.length > 0) return starred[starred.length - 1]?.[1] ?? null;

  const lines = text.split(/\r?\n/).map(line => line.trim());
  for (const line of lines.reverse()) {
    const match = line.match(/^[^\d]*(\d{2,8})[^\d]*$/);
    if (match) return match[1];
  }
  return null;
}

export async function readPrintedEmployeeNumber(photo: Blob, worker: Worker): Promise<string | null> {
  if (typeof createImageBitmap === 'function') {
    try {
      const image = await createImageBitmap(photo);
      try {
        const top = Math.floor(image.height * 0.55);
        const scale = Math.min(1, 1800 / image.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round((image.height - top) * scale));
        canvas.getContext('2d')?.drawImage(image, 0, -top * scale, canvas.width, image.height * scale);
        const cropped = await worker.recognize(canvas, { rotateAuto: true });
        const number = findPrintedEmployeeNumber(cropped.data.text);
        if (number) return number;
      } finally {
        image.close();
      }
    } catch {
      // Photos with an unsupported format can still be read by the OCR worker directly.
    }
  }
  const full = await worker.recognize(photo, { rotateAuto: true });
  return findPrintedEmployeeNumber(full.data.text);
}

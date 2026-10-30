const COVER_MAX_BYTES = 300 * 1024;
const COVER_MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const COVER_MAX_SIDE = 1280;
const COVER_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export type CoverErrorCode = 'format' | 'sourceSize' | 'processing' | 'compressedSize';
export class CoverError extends Error {
  constructor(public readonly code: CoverErrorCode) { super(code); }
}

function encodeWebp(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob || blob.type !== 'image/webp') reject(new CoverError('processing'));
      else resolve(blob);
    }, 'image/webp', quality);
  });
}

export async function prepareKanbanCover(file: File): Promise<File> {
  if (!COVER_TYPES.has(file.type)) throw new CoverError('format');
  if (file.size > COVER_MAX_SOURCE_BYTES) throw new CoverError('sourceSize');
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file); }
  catch { throw new CoverError('processing'); }
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new CoverError('processing');
    const baseScale = Math.min(1, COVER_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    for (const sizeScale of [1, 0.85, 0.7, 0.55]) {
      canvas.width = Math.max(1, Math.round(bitmap.width * baseScale * sizeScale));
      canvas.height = Math.max(1, Math.round(bitmap.height * baseScale * sizeScale));
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.82, 0.68, 0.54]) {
        const blob = await encodeWebp(canvas, quality);
        if (blob.size <= COVER_MAX_BYTES) return new File([blob], 'cover.webp', { type: 'image/webp' });
      }
    }
    throw new CoverError('compressedSize');
  } finally { bitmap.close(); }
}

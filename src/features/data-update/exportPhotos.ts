import { downloadDataUpdatePhoto } from "./api";
import { DATA_UPDATE_PHOTO_EXPORT_JPEG_QUALITY } from "./constants";
import { downloadBlob, safeFileName } from "./download";
import type { DataUpdateCampaignDetail, DataUpdateRecord } from "./types";

export interface DataUpdatePhotoExportProgress {
  completed: number;
  total: number;
}

export interface DataUpdatePhotoExportResult {
  downloaded: number;
  missing: number;
  failed: number;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("La fotografía no se pudo procesar."));
    image.src = url;
  });
}

async function convertToJpeg(blob: Blob): Promise<Blob> {
  const url = URL.createObjectURL(blob);
  try {
    const image = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("El navegador no pudo preparar la fotografía.");
    context.drawImage(image, 0, 0);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (jpeg) => jpeg ? resolve(jpeg) : reject(new Error("La fotografía no se pudo convertir a JPEG.")),
        "image/jpeg",
        DATA_UPDATE_PHOTO_EXPORT_JPEG_QUALITY,
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function safePhotoBaseName(record: DataUpdateRecord): string {
  return `${record.identity.employeeNumber} ${record.identity.name}`
    .toLocaleUpperCase("es-MX")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniquePhotoFileName(record: DataUpdateRecord, names: Set<string>): string {
  const baseName = safePhotoBaseName(record) || record.id;
  let fileName = `${baseName}.jpg`;
  let suffix = 2;
  while (names.has(fileName)) {
    fileName = `${baseName} (${suffix}).jpg`;
    suffix += 1;
  }
  names.add(fileName);
  return fileName;
}

export async function exportDataUpdatePhotos(
  detail: DataUpdateCampaignDetail,
  onProgress?: (progress: DataUpdatePhotoExportProgress) => void,
): Promise<DataUpdatePhotoExportResult> {
  const recordsWithPhoto = detail.records.filter(
    (record): record is DataUpdateRecord & { photoPath: string } => Boolean(record.photoPath),
  );
  const missing = detail.records.length - recordsWithPhoto.length;
  if (recordsWithPhoto.length === 0) {
    return { downloaded: 0, missing, failed: 0 };
  }

  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const names = new Set<string>();
  let downloaded = 0;
  let failed = 0;
  onProgress?.({ completed: 0, total: recordsWithPhoto.length });

  for (const record of recordsWithPhoto) {
    try {
      const source = await downloadDataUpdatePhoto(record.photoPath);
      const jpeg = await convertToJpeg(source);
      zip.file(uniquePhotoFileName(record, names), jpeg);
      downloaded += 1;
    } catch {
      failed += 1;
    }
    onProgress?.({ completed: downloaded + failed, total: recordsWithPhoto.length });
  }

  if (downloaded > 0) {
    const content = await zip.generateAsync({ type: "blob", compression: "STORE" });
    const campaignName = safeFileName(detail.campaign.name) || "actualizacion-datos";
    downloadBlob(content, `${campaignName}-${detail.campaign.year}-fotografias.zip`);
  }

  return { downloaded, missing, failed };
}

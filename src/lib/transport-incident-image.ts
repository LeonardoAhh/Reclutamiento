export const TRANSPORT_INCIDENT_IMAGE_BUCKET = "transport-incident-images";
export const TRANSPORT_INCIDENT_IMAGE_ACCEPT =
  "image/jpeg,image/png,image/webp";
export const TRANSPORT_INCIDENT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function validateTransportIncidentImage(file: File): string | null {
  if (!IMAGE_EXTENSIONS[file.type]) {
    return "Selecciona una imagen JPEG, PNG o WebP.";
  }

  if (file.size > TRANSPORT_INCIDENT_IMAGE_MAX_BYTES) {
    return "La imagen debe pesar máximo 5 MB.";
  }

  return null;
}

export function getTransportIncidentImageExtension(file: File): string {
  return IMAGE_EXTENSIONS[file.type] ?? "jpg";
}

export function formatTransportIncidentImageMetadata(file: File): string {
  const format = IMAGE_EXTENSIONS[file.type]?.toUpperCase() ?? "Imagen";
  const megabytes = (file.size / (1024 * 1024)).toFixed(1);
  return `${format} · ${megabytes} MB`;
}

export const DAILY_WORK_LOG_PATH = "/actividades/bitacora";
export const DAILY_WORK_FILES_BUCKET = "daily-work-log-files";

export const DAILY_WORK_DESCRIPTION_MAX_LENGTH = 2000;
export const DAILY_WORK_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
export const DAILY_WORK_SIGNED_URL_TTL_SECONDS = 60 * 60;

export const DAILY_WORK_ATTACHMENT_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".heic",
  ".heif",
  ".pdf",
  ".txt",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
] as const;

export const DAILY_WORK_ATTACHMENT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
] as const;

export const DAILY_WORK_ATTACHMENT_ACCEPT = [
  ...DAILY_WORK_ATTACHMENT_MIME_TYPES,
  ...DAILY_WORK_ATTACHMENT_EXTENSIONS,
].join(",");

export const DAILY_WORK_ATTACHMENT_HELP =
  "Imágenes, PDF, Word, Excel, PowerPoint o texto; máximo 10 MB por archivo.";

export const DAILY_WORK_PAGE_SIZE = 12;

export function isAcceptedDailyWorkFile(file: File): boolean {
  if (
    DAILY_WORK_ATTACHMENT_MIME_TYPES.includes(
      file.type as (typeof DAILY_WORK_ATTACHMENT_MIME_TYPES)[number],
    )
  ) {
    return true;
  }

  const normalizedName = file.name.toLocaleLowerCase("es-MX");
  return DAILY_WORK_ATTACHMENT_EXTENSIONS.some((extension) =>
    normalizedName.endsWith(extension),
  );
}

const DAILY_WORK_MIME_BY_EXTENSION: Readonly<Record<string, string>> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

export function getDailyWorkFileMimeType(file: File): string | null {
  if (
    DAILY_WORK_ATTACHMENT_MIME_TYPES.includes(
      file.type as (typeof DAILY_WORK_ATTACHMENT_MIME_TYPES)[number],
    )
  ) {
    return file.type;
  }

  const normalizedName = file.name.toLocaleLowerCase("es-MX");
  const extension = DAILY_WORK_ATTACHMENT_EXTENSIONS.find((candidate) =>
    normalizedName.endsWith(candidate),
  );
  return extension ? DAILY_WORK_MIME_BY_EXTENSION[extension] ?? null : null;
}

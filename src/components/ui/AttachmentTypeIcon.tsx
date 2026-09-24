import {
  File as FileIcon,
  FileImage,
  FileSpreadsheet,
  FileText,
  Presentation,
} from "lucide-react";

interface AttachmentTypeIconProps {
  mimeType?: string;
}

export function AttachmentTypeIcon({ mimeType }: AttachmentTypeIconProps) {
  const normalizedMimeType = mimeType?.toLocaleLowerCase("en-US") ?? "";

  let Icon = mimeType ? FileIcon : FileText;
  if (normalizedMimeType.startsWith("image/")) {
    Icon = FileImage;
  } else if (
    normalizedMimeType.includes("spreadsheet") ||
    normalizedMimeType.includes("excel")
  ) {
    Icon = FileSpreadsheet;
  } else if (
    normalizedMimeType.includes("presentation") ||
    normalizedMimeType.includes("powerpoint")
  ) {
    Icon = Presentation;
  } else if (
    normalizedMimeType.startsWith("text/") ||
    normalizedMimeType.includes("pdf") ||
    normalizedMimeType.includes("word")
  ) {
    Icon = FileText;
  }

  return (
    <Icon
      className="attachment-card__file-icon"
      size="var(--icon-size-md)"
      aria-hidden="true"
    />
  );
}

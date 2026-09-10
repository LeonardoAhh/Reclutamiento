import { FileUp, X } from "lucide-react";
import { AttachmentCard } from "@/components/ui/AttachmentCard";
import {
  DAILY_WORK_ATTACHMENT_ACCEPT,
  DAILY_WORK_ATTACHMENT_HELP,
  DAILY_WORK_ATTACHMENT_MAX_BYTES,
  isAcceptedDailyWorkFile,
} from "./constants";
import { formatDailyWorkFileSize, isDailyWorkImage } from "./format";
import type { DailyWorkAttachment } from "./types";

interface DailyWorkFileFieldProps {
  idPrefix: string;
  existingAttachments: DailyWorkAttachment[];
  files: File[];
  error?: string;
  isDisabled: boolean;
  onFilesChange: (files: File[]) => void;
  onErrorChange: (error?: string) => void;
}

function fileIdentity(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

export function DailyWorkFileField({
  idPrefix,
  existingAttachments,
  files,
  error,
  isDisabled,
  onFilesChange,
  onErrorChange,
}: DailyWorkFileFieldProps) {
  const fileHelpId = `${idPrefix}-file-help`;
  const fileErrorId = `${idPrefix}-file-error`;

  const addFiles = (selectedFiles: File[]) => {
    const invalidType = selectedFiles.find(
      (file) => !isAcceptedDailyWorkFile(file),
    );
    if (invalidType) {
      onErrorChange(`“${invalidType.name}” no tiene un formato admitido.`);
      return;
    }

    const oversized = selectedFiles.find(
      (file) => file.size > DAILY_WORK_ATTACHMENT_MAX_BYTES,
    );
    if (oversized) {
      onErrorChange(`“${oversized.name}” supera el tamaño máximo permitido.`);
      return;
    }

    onErrorChange();
    const existing = new Set(files.map(fileIdentity));
    onFilesChange([
      ...files,
      ...selectedFiles.filter((file) => !existing.has(fileIdentity(file))),
    ]);
  };

  return (
    <>
      {existingAttachments.length > 0 && (
        <section
          className="daily-work-form__attachments"
          aria-labelledby={`${idPrefix}-saved-files`}
        >
          <h3 id={`${idPrefix}-saved-files`}>Archivos guardados</h3>
          <div className="daily-work-form__file-list daily-work-attachment-grid">
            {existingAttachments.map((attachment) => (
              <AttachmentCard
                key={attachment.id}
                name={attachment.fileName}
                metadata={formatDailyWorkFileSize(attachment.sizeBytes)}
                imageSrc={
                  isDailyWorkImage(attachment.mimeType)
                    ? attachment.signedUrl
                    : undefined
                }
                href={attachment.signedUrl}
                previewLabel={`Abrir ${attachment.fileName}`}
              />
            ))}
          </div>
        </section>
      )}

      <div className="form-group">
        <span className="form-label">Agregar archivos</span>
        <p id={fileHelpId} className="daily-work-form__help">
          {DAILY_WORK_ATTACHMENT_HELP}
        </p>
        <label
          className="daily-work-form__upload"
          htmlFor={`${idPrefix}-files`}
        >
          <FileUp size="var(--icon-size-lg)" aria-hidden="true" />
          <span>Elegir archivos</span>
        </label>
        <input
          id={`${idPrefix}-files`}
          className="sr-only"
          type="file"
          accept={DAILY_WORK_ATTACHMENT_ACCEPT}
          multiple
          disabled={isDisabled}
          aria-invalid={Boolean(error)}
          aria-describedby={`${fileHelpId}${error ? ` ${fileErrorId}` : ""}`}
          onChange={(event) => {
            addFiles(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
        {error && (
          <p id={fileErrorId} className="daily-work-form__error" role="alert">
            {error}
          </p>
        )}
        {files.length > 0 && (
          <div className="daily-work-form__file-list" aria-live="polite">
            {files.map((file) => (
              <AttachmentCard
                key={fileIdentity(file)}
                name={file.name}
                metadata={formatDailyWorkFileSize(file.size)}
                onRemove={() =>
                  onFilesChange(
                    files.filter(
                      (candidate) =>
                        fileIdentity(candidate) !== fileIdentity(file),
                    ),
                  )
                }
                removeLabel={`Quitar ${file.name}`}
                removeIcon={
                  <X size="var(--icon-size-sm)" aria-hidden="true" />
                }
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

import { Paperclip } from "lucide-react";
import { AttachmentCard } from "@/components/ui/AttachmentCard";
import { Modal } from "@/components/ui/Modal";
import { formatDailyWorkFileSize, isDailyWorkImage } from "./format";
import type { DailyWorkActivity } from "./types";

interface DailyWorkAttachmentsModalProps {
  activity: DailyWorkActivity | null;
  onClose: () => void;
}

export function DailyWorkAttachmentsModal({
  activity,
  onClose,
}: DailyWorkAttachmentsModalProps) {
  const attachments = activity?.attachments ?? [];

  return (
    <Modal
      isOpen={activity !== null}
      onClose={onClose}
      title={`Archivos adjuntos (${attachments.length})`}
      icon={<Paperclip size="var(--icon-size-md)" aria-hidden="true" />}
      size="sm"
    >
      <div className="modal-body">
        <div className="daily-work-attachment-grid">
          {attachments.map((attachment) => (
            <AttachmentCard
              key={attachment.id}
              name={attachment.fileName}
              metadata={formatDailyWorkFileSize(attachment.sizeBytes)}
              mimeType={attachment.mimeType}
              variant="compact"
              isNameVisible={false}
              isWholeCardInteractive
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
      </div>
    </Modal>
  );
}

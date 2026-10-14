import { useState } from "react";
import { SquarePen, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { playSound } from "@/lib/sound";

interface InlineDeleteActionProps {
  onEdit?: () => void;
  onDelete: () => Promise<boolean>;
}

export function InlineDeleteAction({ onEdit, onDelete }: InlineDeleteActionProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { language } = useLanguage();
  const en = language === "en";

  const handleDelete = async () => {
    if (!confirming) {
      playSound("warning");
      setConfirming(true);
      return;
    }
    setDeleting(true);
    try {
      if (await onDelete()) setConfirming(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="responsibility-detail__actions">
      {!confirming && onEdit && (
        <button type="button" className="responsibility-detail__edit" onClick={onEdit}>
          <SquarePen size="var(--icon-size-md)" aria-hidden="true" />{en ? "Edit" : "Editar"}
        </button>
      )}
      {confirming && (
        <button type="button" className="responsibility-detail__edit"
          disabled={deleting} onClick={() => { playSound("close"); setConfirming(false); }}>
          {en ? "Cancel" : "Cancelar"}
        </button>
      )}
      <button type="button" className="responsibility-detail__edit responsibility-detail__delete"
        disabled={deleting} aria-busy={deleting} onClick={() => void handleDelete()}>
        {!confirming && <Trash2 size="var(--icon-size-md)" aria-hidden="true" />}
        {deleting ? (en ? "Deleting…" : "Eliminando…")
          : confirming ? (en ? "Confirm" : "Confirmar") : (en ? "Delete" : "Eliminar")}
      </button>
    </div>
  );
}

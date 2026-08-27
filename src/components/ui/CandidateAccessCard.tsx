import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Share2 } from "lucide-react";
import { Check, Copy } from "lucide";
import { CANDIDATE_ACCESS_CARD_CONFIG } from "@/lib/constants";
import { MorphingIcon } from "@/components/ui/MorphingIcon";
import {
  createCandidateAccessCardBlob,
  getCandidateAccessCardFilename,
  type CandidateAccessCardData,
} from "@/lib/candidateAccessCard";
import { useIsMobile } from "@/hooks/useIsMobile";
import "./CandidateAccessCard.css";

interface CandidateAccessCardProps {
  data: CandidateAccessCardData;
  heading?: string;
}

type Feedback = {
  tone: "success" | "error" | "info";
  message: string;
} | null;

function downloadImage(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function copyImage(blob: Blob): Promise<void> {
  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    throw new Error("Este navegador no permite copiar imágenes.");
  }
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function CandidateAccessCard({
  data,
  heading = "Pase listo para compartir",
}: CandidateAccessCardProps) {
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [copied, setCopied] = useState(false);
  const isMobile = useIsMobile();

  const filename = useMemo(
    () => getCandidateAccessCardFilename(data.candidateName),
    [data.candidateName],
  );

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    setIsGenerating(true);
    setFeedback(null);
    createCandidateAccessCardBlob(data)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setImageBlob(blob);
        setPreviewUrl(objectUrl);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setFeedback({
          tone: "error",
          message:
            error instanceof Error
              ? error.message
              : "No fue posible generar la tarjeta.",
        });
      })
      .finally(() => {
        if (active) setIsGenerating(false);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [data]);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const getFile = () => {
    if (!imageBlob) return null;
    return new File([imageBlob], filename, { type: "image/png" });
  };

  const canShareFile = (file: File): boolean =>
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] });

  const handleCopy = async () => {
    if (!imageBlob) return;
    try {
      await copyImage(imageBlob);
      setCopied(true);
      setFeedback({
        tone: "success",
        message: "Imagen copiada. Ya puedes pegarla en un chat.",
      });
    } catch {
      setFeedback({
        tone: "error",
        message:
          "Tu navegador no permite copiar la imagen. Usa Compartir para enviarla.",
      });
    }
  };

  const handleShare = async () => {
    const file = getFile();
    if (!file || !imageBlob) return;

    try {
      if (canShareFile(file)) {
        await navigator.share({
          files: [file],
          title: CANDIDATE_ACCESS_CARD_CONFIG.shareTitle,
        });
        setFeedback({ tone: "success", message: "Tarjeta compartida." });
        return;
      }

      downloadImage(imageBlob, filename);
      setFeedback({
        tone: "info",
        message:
          "La imagen se descargó porque este navegador no ofrece el menú para compartir.",
      });
    } catch (error: unknown) {
      if (!isAbortError(error)) {
        setFeedback({
          tone: "error",
          message: "No fue posible compartir la tarjeta.",
        });
      }
    }
  };


  const previewAlt = [
    `Pase de entrevista para ${data.candidateName}`,
    `acude con ${data.recruiterName}`,
    `para el puesto ${data.position}`,
    data.interviewDate ? `el ${data.interviewDate}` : null,
    `en ${CANDIDATE_ACCESS_CARD_CONFIG.locationName}, ${CANDIDATE_ACCESS_CARD_CONFIG.address}`,
    CANDIDATE_ACCESS_CARD_CONFIG.accessNotice,
    CANDIDATE_ACCESS_CARD_CONFIG.identificationNotice,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <section
      className="candidate-access-card"
      aria-labelledby="candidate-access-card-heading"
    >
      <div className="candidate-access-card__intro">
        <h3 id="candidate-access-card-heading">{heading}</h3>
        <p>
          Comparte esta imagen para que la presente en caseta de vigilancia.
        </p>
      </div>

      {!isMobile && (
        <div className="candidate-access-card__preview" aria-busy={isGenerating}>
          {previewUrl ? (
            <img src={previewUrl} alt={previewAlt} />
          ) : (
            <div className="candidate-access-card__placeholder" role="status">
              {isGenerating && (
                <LoaderCircle
                  className="candidate-access-card__spinner"
                  size="var(--icon-size-lg)"
                  aria-hidden="true"
                />
              )}
              <span>{isGenerating ? "Generando pase..." : "Vista previa no disponible"}</span>
            </div>
          )}
        </div>
      )}

      {feedback && (
        <p
          className="candidate-access-card__feedback"
          data-tone={feedback.tone}
          role={feedback.tone === "error" ? "alert" : "status"}
        >
          {feedback.message}
        </p>
      )}

      <footer
        className="candidate-access-card__actions"
        aria-label="Acciones de la tarjeta"
      >
        <button
          type="button"
          className="btn-secondary"
          onClick={handleCopy}
          disabled={!imageBlob}
        >
          <MorphingIcon
            icon={copied ? Check : Copy}
            size="var(--icon-size-sm)"
            aria-hidden="true"
          />
          {copied ? "Copiada" : "Copiar"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={handleShare}
          disabled={!imageBlob}
        >
          <Share2 size="var(--icon-size-sm)" aria-hidden="true" />
          Compartir
        </button>
      </footer>
    </section>
  );
}

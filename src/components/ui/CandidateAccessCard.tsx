import { useEffect, useMemo, useState } from "react";
import { useLanguage } from '@/contexts/LanguageContext';
import { Check, Copy, LoaderCircle, Share2 } from "lucide-react";
import { CANDIDATE_ACCESS_CARD_CONFIG } from "@/lib/constants";
import { toast } from "@/lib/notify";
import {
  createCandidateAccessCardBlob,
  getCandidateAccessCardFilename,
  type CandidateAccessCardData,
} from "@/lib/candidateAccessCard";
import "./CandidateAccessCard.css";

interface CandidateAccessCardProps {
  data: CandidateAccessCardData;
}

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

export function CandidateAccessCard({ data }: CandidateAccessCardProps) {
  const { language } = useLanguage();
  const en = language === 'en';
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [generationError, setGenerationError] = useState("");
  const [copied, setCopied] = useState(false);

  const filename = useMemo(
    () => getCandidateAccessCardFilename(data.candidateName),
    [data.candidateName],
  );

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    setIsGenerating(true);
    setImageBlob(null);
    setPreviewUrl(null);
    setGenerationError("");
    setCopied(false);
    createCandidateAccessCardBlob(data)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setImageBlob(blob);
        setPreviewUrl(objectUrl);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setGenerationError(error instanceof Error
          ? error.message : 'No fue posible generar el pase.');
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
      toast.success({ title: en ? 'Pass copied' : 'Pase copiado', description: en ? 'You can now paste the image into a chat.' : 'Ya puedes pegar la imagen en un chat.' });
    } catch {
      toast.error({ title: en ? 'Could not copy' : 'No se pudo copiar', description: en ? 'Use Share to send it.' : 'Usa Compartir para enviarlo.' });
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
        toast.success({ title: en ? 'Pass shared' : 'Pase compartido' });
        return;
      }

      downloadImage(imageBlob, filename);
      toast.info({ title: en ? 'Pass downloaded' : 'Pase descargado', description: en ? 'You can send it from your files.' : 'Puedes enviarlo desde tus archivos.' });
    } catch (error: unknown) {
      if (!isAbortError(error)) {
        toast.error({ title: en ? 'Could not share the pass' : 'No se pudo compartir el pase' });
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
      aria-label={en ? 'Interview pass preview' : 'Vista previa del pase de entrevista'}
    >
      <div className="candidate-access-card__body">
        <p className="candidate-access-card__hint">{en ? 'Share it with the candidate.' : 'Compártelo con el candidato.'}</p>

        <div className="candidate-access-card__preview" aria-busy={isGenerating}>
          {previewUrl ? (
            <img src={previewUrl} alt={previewAlt} />
          ) : (
            <div className="candidate-access-card__placeholder" role={generationError ? "alert" : "status"}>
              {isGenerating && (
                <LoaderCircle
                  className="candidate-access-card__spinner"
                  size="var(--icon-size-lg)"
                  aria-hidden="true"
                />
              )}
              <span>{isGenerating ? (en ? 'Generating pass…' : 'Generando pase…') : (en && generationError === 'No fue posible generar el pase.' ? 'Could not generate the pass.' : generationError) || (en ? 'Preview unavailable' : 'Vista previa no disponible')}</span>
            </div>
          )}
        </div>
        <span className="sr-only" role="status" aria-live="polite">
          {previewUrl ? (en ? 'Pass ready to copy or share.' : 'Pase listo para copiar o compartir.') : ''}
        </span>
      </div>

      <footer
        className="candidate-access-card__actions"
        aria-label={en ? 'Pass actions' : 'Acciones de la tarjeta'}
      >
        <button
          type="button"
          className="btn-secondary"
          onClick={handleCopy}
          disabled={!imageBlob}
        >
          {copied
            ? <Check size="var(--icon-size-sm)" aria-hidden="true" />
            : <Copy size="var(--icon-size-sm)" aria-hidden="true" />}
          {copied ? (en ? 'Copied' : 'Copiada') : (en ? 'Copy' : 'Copiar')}
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={handleShare}
          disabled={!imageBlob}
        >
          <Share2 size="var(--icon-size-sm)" aria-hidden="true" />
          {en ? 'Share' : 'Compartir'}
        </button>
      </footer>
    </section>
  );
}

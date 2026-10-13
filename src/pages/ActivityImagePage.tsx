import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeading } from "@/components/layout/PageHeading";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { useActivityImage } from "@/hooks/useActivityImage";
import { getActivityReturnPath, type ActivityImageTab } from "./activityImageNavigation";
import "./ActivityImagePage.css";

export function ActivityImagePage() {
  const { activityId } = useParams();
  const [search] = useSearchParams();
  const tab: ActivityImageTab = search.get("tab") === "responsibilities" ? "responsibilities" : "activities";
  const proofId = search.get("proof");
  const { language } = useLanguage();
  const en = language === "en";
  const { status, image, retry } = useActivityImage(activityId, proofId);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const imageFailed = status === "ready" && failedSrc === image.src;
  const imageLoading = status === "ready" && !imageFailed && loadedSrc !== image.src;
  const renderSkeleton = (includeTitle: boolean) => (
    <LoadingSkeleton label={en ? "Loading image…" : "Cargando imagen…"} className="activity-image-page__skeleton">
      {includeTitle && <span className="loading-skeleton__bone activity-image-page__skeleton-title" aria-hidden="true" />}
      <span className="loading-skeleton__bone activity-image-page__skeleton-image" aria-hidden="true" />
    </LoadingSkeleton>
  );

  return (
    <main className="activity-image-page">
      <PageHeading className="app-page-title">
        <Link className="activity-image-page__title-link"
          to={getActivityReturnPath(tab, search.get("status"))}
          aria-label={en ? "Image, back to activities" : "Imagen, volver a Actividades"}>
          <ArrowLeft size="var(--icon-size-md)" aria-hidden="true" />
          {en ? "Image" : "Imagen"}
        </Link>
      </PageHeading>
      {status === "loading" && renderSkeleton(true)}
      {status === "missing" && <p>{en ? "Image unavailable or access denied." : "Imagen no disponible o sin acceso."}</p>}
      {(status === "error" || imageFailed) && (
        <div className="activity-image-page__error" role="alert">
          <p>{en ? "Could not load the image." : "No se pudo cargar la imagen."}</p>
          <button type="button" className="btn-secondary" onClick={() => { setFailedSrc(null); retry(); }}>
            {en ? "Retry" : "Reintentar"}
          </button>
        </div>
      )}
      {status === "ready" && !imageFailed && (
        <figure className="activity-image-page__figure">
          <figcaption>{image.title}</figcaption>
          {imageLoading && renderSkeleton(false)}
          <img src={image.src} alt={en ? "Full attached image" : "Imagen adjunta completa"}
            data-loaded={!imageLoading}
            onLoad={() => setLoadedSrc(image.src)}
            onError={() => setFailedSrc(image.src)} />
        </figure>
      )}
    </main>
  );
}

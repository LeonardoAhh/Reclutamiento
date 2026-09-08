import { Camera, ImageUp, RefreshCw } from "lucide-react";
import { DATA_UPDATE_PHOTO_ACCEPT, EDITABLE_FIELDS } from "./constants";
import type { DataUpdateEditableData, DataUpdateIdentity } from "./types";

interface PhotoReviewStepProps {
  identity: DataUpdateIdentity;
  data: DataUpdateEditableData;
  photoUrl: string | null;
  photoBusy: boolean;
  onPhotoChange: (file: File | undefined) => void;
}

export function PhotoReviewStep({
  identity,
  data,
  photoUrl,
  photoBusy,
  onPhotoChange,
}: PhotoReviewStepProps) {
  return (
    <section className="data-update-step" aria-labelledby="photo-step-title">
      <div>
        <h2 id="photo-step-title">Fotografía y revisión</h2>
        <p className="text-muted">La fotografía es obligatoria para finalizar. Formatos JPEG, PNG o WebP, máximo 5 MB.</p>
      </div>

      <div className="data-update-photo">
        {photoUrl ? (
          <img src={photoUrl} alt={`Fotografía nueva de ${identity.name}`} />
        ) : (
          <div className="data-update-photo__empty" aria-hidden="true"><Camera /></div>
        )}
        <div className="data-update-photo__actions">
          <label className="btn-primary">
            {photoUrl ? <RefreshCw aria-hidden="true" /> : <Camera aria-hidden="true" />}
            {photoUrl ? "Repetir fotografía" : "Usar cámara"}
            <input
              className="sr-only"
              type="file"
              accept={DATA_UPDATE_PHOTO_ACCEPT}
              capture="environment"
              disabled={photoBusy}
              onChange={(event) => onPhotoChange(event.target.files?.[0])}
            />
          </label>
          <label className="btn-secondary">
            <ImageUp aria-hidden="true" />
            Elegir archivo
            <input
              className="sr-only"
              type="file"
              accept={DATA_UPDATE_PHOTO_ACCEPT}
              disabled={photoBusy}
              onChange={(event) => onPhotoChange(event.target.files?.[0])}
            />
          </label>
        </div>
      </div>

      <section className="data-update-review" aria-labelledby="final-review-title">
        <h3 id="final-review-title">Datos que se guardarán</h3>
        <dl>
          {EDITABLE_FIELDS.map((field) => (
            <div key={field.key}>
              <dt>{field.label}</dt>
              <dd>{data[field.key]}</dd>
            </div>
          ))}
        </dl>
      </section>
    </section>
  );
}

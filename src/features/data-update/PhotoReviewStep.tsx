import { type ChangeEvent } from "react";
import { Camera, ImageUp, PencilLine, RefreshCw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatShortDate } from "@/lib/dates";
import { DATA_UPDATE_PHOTO_ACCEPT, EDITABLE_FIELDS } from "./constants";
import type {
  DataUpdateEditableData,
  DataUpdateEditableTextKey,
  DataUpdateIdentity,
} from "./types";
import { useDataUpdateText } from "./translations";

interface PhotoStepProps {
  identity: DataUpdateIdentity;
  photoUrl: string | null;
  photoBusy: boolean;
  photoStatus: string | null;
  canRetry: boolean;
  onPhotoChange: (file: File | undefined) => void;
  onRetry: () => void;
}

interface ReviewStepProps {
  data: DataUpdateEditableData;
  onEditStep: (step: number) => void;
}

const REVIEW_GROUPS: ReadonlyArray<{
  title: string;
  step: number;
  keys: ReadonlyArray<DataUpdateEditableTextKey>;
  includeChildren?: boolean;
}> = [
  { title: "Transporte", step: 1, keys: ["route", "stop", "location"] },
  { title: "Contacto", step: 2, keys: ["birthState", "civilStatus", "email", "receivesPayrollReceipts", "mobilePhone"] },
  { title: "Emergencia y domicilio", step: 3, keys: ["emergencyContact", "emergencyRelationship", "emergencyPhone", "street", "municipality", "fullAddress"] },
  { title: "Información adicional", step: 4, keys: ["educationLevel", "bloodType", "allergies", "locker"] },
  { title: "Tallas e hijos", step: 5, keys: ["shirtSize", "shoeSize"], includeChildren: true },
];

export function PhotoStep({
  identity,
  photoUrl,
  photoBusy,
  photoStatus,
  canRetry,
  onPhotoChange,
  onRetry,
}: PhotoStepProps) {
  const t = useDataUpdateText();
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    onPhotoChange(event.target.files?.[0]);
    event.target.value = "";
  };

  return (
    <section className="data-update-step" aria-labelledby="photo-step-title">
      <div>
        <h2 id="photo-step-title">{t("Fotografía")}</h2>
        <p className="text-muted">{t("La fotografía es obligatoria para finalizar. Formatos JPEG, PNG o WebP, máximo 5 MB.")}</p>
      </div>

      <div className="data-update-photo">
        {photoUrl ? (
          <img src={photoUrl} alt={t(photoBusy ? `Vista previa de ${identity.name}, pendiente de guardar` : `Fotografía de ${identity.name}`)} />
        ) : (
          <div className="data-update-photo__empty" aria-hidden="true"><Camera /></div>
        )}
        <p className="data-update-photo__status" role="status" aria-atomic="true">
          {photoStatus}
          {photoBusy && <span>{t("Espera para continuar. La vista previa todavía no confirma el guardado.")}</span>}
        </p>
        <div className="data-update-photo__actions" aria-busy={photoBusy || undefined}>
          <label className="btn-primary" aria-disabled={photoBusy || undefined}>
            {photoUrl ? <RefreshCw aria-hidden="true" /> : <Camera aria-hidden="true" />}
            {t(photoUrl ? "Volver a tomar" : "Usar cámara")}
            <input
              className="sr-only"
              type="file"
              accept={DATA_UPDATE_PHOTO_ACCEPT}
              capture="environment"
              disabled={photoBusy}
              onChange={handleFileChange}
            />
          </label>
          <label className="btn-secondary" aria-disabled={photoBusy || undefined}>
            <ImageUp aria-hidden="true" />
            {t("Elegir archivo")}
            <input
              className="sr-only"
              type="file"
              accept={DATA_UPDATE_PHOTO_ACCEPT}
              disabled={photoBusy}
              onChange={handleFileChange}
            />
          </label>
          {canRetry && (
            <button type="button" className="btn-secondary" onClick={onRetry} disabled={photoBusy}>
              <RefreshCw aria-hidden="true" />
              {t("Reintentar carga")}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export function ReviewStep({ data, onEditStep }: ReviewStepProps) {
  const t = useDataUpdateText();
  const { language } = useLanguage();
  return (
    <section className="data-update-step data-update-review" aria-labelledby="final-review-title">
      <div>
        <h2 id="final-review-title">{t("Datos que se guardarán")}</h2>
        <p className="text-muted">{t("Revisa la información antes de completar la actualización.")}</p>
      </div>
      <div className="data-update-review__groups">
        {REVIEW_GROUPS.map((group) => (
          <section key={group.title} className="data-update-review__group" aria-labelledby={`review-${group.step}-title`}>
            <header>
              <h3 id={`review-${group.step}-title`}>{t(group.title)}</h3>
              <button type="button" className="btn-secondary btn-sm" onClick={() => onEditStep(group.step)}>
                <PencilLine aria-hidden="true" />
                {t("Editar")}
                <span className="sr-only"> {t(group.title)}</span>
              </button>
            </header>
            <dl>
              {EDITABLE_FIELDS.filter((field) => group.keys.includes(field.key)).map((field) => (
                <div key={field.key}>
                  <dt>{t(field.label)}</dt>
                  <dd className={field.key === "email" ? "data-update-value--preserve-case" : undefined}>
                    {data[field.key]}
                  </dd>
                </div>
              ))}
              {group.includeChildren && (
                <>
                  <div>
                    <dt>{t("Cantidad de hijos")}</dt>
                    <dd>{data.childrenBirthDates.length}</dd>
                  </div>
                  {data.childrenBirthDates.map((birthDate, index) => (
                    <div key={`${birthDate}-${index}`}>
                      <dt>{t("Fecha de nacimiento del hijo ") + (index + 1)}</dt>
                      <dd>{formatShortDate(birthDate, language === "en" ? "en-US" : "es-MX")}</dd>
                    </div>
                  ))}
                </>
              )}
            </dl>
          </section>
        ))}
      </div>
    </section>
  );
}

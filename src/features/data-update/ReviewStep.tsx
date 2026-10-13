import { PencilLine } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatShortDate } from "@/lib/dates";
import { EDITABLE_FIELDS } from "./constants";
import type {
  DataUpdateEditableData,
  DataUpdateEditableTextKey,
  DataUpdateIdentity,
} from "./types";
import { useDataUpdateText } from "./translations";

interface DataUpdateReviewStepProps {
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

export function ReviewStep({ data, onEditStep }: DataUpdateReviewStepProps) {
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

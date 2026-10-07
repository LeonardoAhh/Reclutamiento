import { useEffect, useRef } from "react";
import type { DataUpdateCampaignDetail, DataUpdateProfileOption, DataUpdateRecord } from "./types";
import { useDataUpdateText } from "./translations";

interface DataUpdateProgressPageProps {
  onBack: () => void;
  detail: DataUpdateCampaignDetail;
  profiles: DataUpdateProfileOption[];
  currentUserId: string;
}

function ProgressSummary({ records, global = false }: { records: DataUpdateRecord[]; global?: boolean }) {
  const t = useDataUpdateText();
  const total = records.length;
  const assigned = global ? records.filter((record) => Boolean(record.assignedTo)).length : total;
  const completed = records.filter((record) => record.status === "completado").length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <section className="card data-update-summary-card" aria-label={t(global ? "Avance global" : "Avance individual")}>
      <dl className={`data-update-summary${global ? "" : " data-update-progress-page__summary--individual"}`}>
        <div><dt>{t("Asignados")}</dt><dd>{assigned}</dd></div>
        <div><dt>{t("Completados")}</dt><dd>{completed}</dd></div>
        {global && <div><dt>{t("Total visible")}</dt><dd>{total}</dd></div>}
      </dl>
      <div className="data-update-summary-progress">
        <div className="data-update-summary-progress__heading">
          <span>{t(global ? "Avance global" : "Avance individual")}</span>
          <strong>{percentage}%</strong>
        </div>
        <progress
          className="data-update-summary-progress__bar"
          value={completed}
          max={total || 1}
          aria-label={`${percentage} ${t("por ciento de colaboradores completados")}`}
        />
        <p>{completed} {t("de")} {total} {t("colaboradores completados")}</p>
      </div>
    </section>
  );
}

export function DataUpdateProgressPage({
  onBack,
  detail,
  profiles,
  currentUserId,
}: DataUpdateProgressPageProps) {
  const t = useDataUpdateText();
  const headingRef = useRef<HTMLButtonElement>(null);
  const recruiters = profiles
    .filter((profile) => profile.role === "reclutador" && (
      detail.participantIds.includes(profile.id)
      || detail.records.some((record) => record.assignedTo === profile.id)
    ))
    .sort((left, right) => left.label.localeCompare(right.label, "es"));

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <main className="data-update-page data-update-page--has-heading data-update-progress-page container" aria-labelledby="data-update-progress-title">
      <header className="page-header data-update-page__header">
        <div className="page-header__content">
          <h1 id="data-update-progress-title" className="app-page-title">
            <button
              ref={headingRef}
              type="button"
              className="data-update-progress-page__back-link"
              onClick={onBack}
              aria-label={`${t("Volver")}: ${t("Avance de la campaña")}`}
            >
              {t("Avance de la campaña")}
            </button>
          </h1>
          <p>{detail.campaign.name} · {detail.campaign.year}</p>
        </div>
      </header>
      <div className="data-update-progress-page__sections">
        <section className="data-update-progress-page__section" aria-labelledby="data-update-progress-global">
          <h2 id="data-update-progress-global">{t("Global")}</h2>
          <ProgressSummary records={detail.records} global />
        </section>
        <section className="data-update-progress-page__section" aria-labelledby="data-update-progress-mine">
          <h2 id="data-update-progress-mine">{t("Mi avance")}</h2>
          <ProgressSummary records={detail.records.filter((record) => record.assignedTo === currentUserId)} />
        </section>
        {recruiters.map((recruiter) => (
          <section className="data-update-progress-page__section" aria-labelledby={`data-update-progress-${recruiter.id}`} key={recruiter.id}>
            <h2 id={`data-update-progress-${recruiter.id}`}>{recruiter.label}</h2>
            <ProgressSummary records={detail.records.filter((record) => record.assignedTo === recruiter.id)} />
          </section>
        ))}
      </div>
    </main>
  );
}

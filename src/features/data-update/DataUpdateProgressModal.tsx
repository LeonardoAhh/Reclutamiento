import * as Tabs from "@radix-ui/react-tabs";
import { ChartNoAxesCombined } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import type { DataUpdateCampaignDetail, DataUpdateProfileOption, DataUpdateRecord } from "./types";
import { useDataUpdateText } from "./translations";

interface DataUpdateProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
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
      <dl className={`data-update-summary${global ? "" : " data-update-progress-modal__summary--individual"}`}>
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

export function DataUpdateProgressModal({
  isOpen,
  onClose,
  detail,
  profiles,
  currentUserId,
}: DataUpdateProgressModalProps) {
  const t = useDataUpdateText();
  const recruiters = profiles
    .filter((profile) => profile.role === "reclutador" && (
      detail.participantIds.includes(profile.id)
      || detail.records.some((record) => record.assignedTo === profile.id)
    ))
    .sort((left, right) => left.label.localeCompare(right.label, "es"));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("Avance de la campaña")}
      icon={<ChartNoAxesCombined aria-hidden="true" />}
      size="md"
    >
      <div className="modal-body">
        <Tabs.Root defaultValue="global" className="data-update-tabs">
          <Tabs.List className="data-update-tabs__list data-update-tabs__list--admin" aria-label={t("Avance por responsable")}>
            <Tabs.Trigger className="data-update-tabs__trigger" value="global">{t("Global")}</Tabs.Trigger>
            <Tabs.Trigger className="data-update-tabs__trigger" value="mine">{t("Mi avance")}</Tabs.Trigger>
            {recruiters.map((recruiter) => (
              <Tabs.Trigger className="data-update-tabs__trigger" value={recruiter.id} key={recruiter.id}>
                {recruiter.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <Tabs.Content className="data-update-tabs__content" value="global">
            <ProgressSummary records={detail.records} global />
          </Tabs.Content>
          <Tabs.Content className="data-update-tabs__content" value="mine">
            <ProgressSummary records={detail.records.filter((record) => record.assignedTo === currentUserId)} />
          </Tabs.Content>
          {recruiters.map((recruiter) => (
            <Tabs.Content className="data-update-tabs__content" value={recruiter.id} key={recruiter.id}>
              <ProgressSummary records={detail.records.filter((record) => record.assignedTo === recruiter.id)} />
            </Tabs.Content>
          ))}
        </Tabs.Root>
      </div>
    </Modal>
  );
}

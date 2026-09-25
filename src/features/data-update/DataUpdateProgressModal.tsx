import * as Tabs from "@radix-ui/react-tabs";
import { ChartNoAxesCombined } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import type { DataUpdateCampaignDetail, DataUpdateProfileOption, DataUpdateRecord } from "./types";

interface DataUpdateProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  detail: DataUpdateCampaignDetail;
  profiles: DataUpdateProfileOption[];
  currentUserId: string;
}

function ProgressSummary({ records, global = false }: { records: DataUpdateRecord[]; global?: boolean }) {
  const total = records.length;
  const assigned = global ? records.filter((record) => Boolean(record.assignedTo)).length : total;
  const completed = records.filter((record) => record.status === "completado").length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <section className="card data-update-summary-card" aria-label={global ? "Avance global" : "Avance individual"}>
      <dl className={`data-update-summary${global ? "" : " data-update-progress-modal__summary--individual"}`}>
        <div><dt>Asignados</dt><dd>{assigned}</dd></div>
        <div><dt>Completados</dt><dd>{completed}</dd></div>
        {global && <div><dt>Total visible</dt><dd>{total}</dd></div>}
      </dl>
      <div className="data-update-summary-progress">
        <div className="data-update-summary-progress__heading">
          <span>{global ? "Avance global" : "Avance individual"}</span>
          <strong>{percentage}%</strong>
        </div>
        <progress
          className="data-update-summary-progress__bar"
          value={completed}
          max={total || 1}
          aria-label={`${percentage} por ciento de colaboradores completados`}
        />
        <p>{completed} de {total} colaboradores completados</p>
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
      title="Avance de la campaña"
      icon={<ChartNoAxesCombined aria-hidden="true" />}
      size="md"
    >
      <div className="modal-body">
        <Tabs.Root defaultValue="global" className="data-update-tabs">
          <Tabs.List className="data-update-tabs__list data-update-tabs__list--admin" aria-label="Avance por responsable">
            <Tabs.Trigger className="data-update-tabs__trigger" value="global">Global</Tabs.Trigger>
            <Tabs.Trigger className="data-update-tabs__trigger" value="mine">Mi avance</Tabs.Trigger>
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

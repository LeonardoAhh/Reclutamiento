import { BadgeCheck, Hourglass } from "lucide-react";
import type { DataUpdateRecordStatus } from "./types";

interface DataUpdateStatusProps {
  status: DataUpdateRecordStatus;
}

export function DataUpdateStatus({ status }: DataUpdateStatusProps) {
  return (
    <span className={`data-update-status data-update-status--${status}${status === "en_proceso" ? "" : " data-update-status--icon"}`}>
      {status === "completado" ? (
        <>
          <BadgeCheck aria-hidden="true" />
          <span className="sr-only">Completado</span>
        </>
      ) : status === "pendiente" ? (
        <>
          <Hourglass aria-hidden="true" />
          <span className="sr-only">Pendiente</span>
        </>
      ) : "En proceso"}
    </span>
  );
}

import { UserRound, UsersRound } from "lucide-react";
import { ReclutadorBadge } from "@/components/ui/Badge";
import "./AssignmentMeta.css";

export interface AssignmentPerson {
  id: string;
  display_name?: string | null;
  username?: string | null;
}

interface AssignmentMetaProps {
  assignee?: AssignmentPerson;
  currentUserId?: string;
}

export function AssignmentMeta({
  assignee,
  currentUserId,
}: AssignmentMetaProps) {
  const isCurrentUser = assignee?.id === currentUserId;

  return (
    <dl className="assignment-meta">
      <div className="assignment-meta__row">
        <dt className="sr-only">Asignación</dt>
        <dd className="assignment-meta__value">
          {assignee ? (
            isCurrentUser ? (
              <span className="assignment-meta__badge">
                <UserRound
                  size="var(--icon-size-sm)"
                  aria-hidden="true"
                />
                <span>Asignada a ti</span>
              </span>
            ) : (
              <ReclutadorBadge
                nombre={
                  assignee.display_name || assignee.username || "Sin nombre"
                }
                size="sm"
                showRole={false}
              />
            )
          ) : (
            <span className="assignment-meta__badge">
              <UsersRound
                size="var(--icon-size-sm)"
                aria-hidden="true"
              />
              <span>Todo el equipo</span>
            </span>
          )}
        </dd>
      </div>
    </dl>
  );
}

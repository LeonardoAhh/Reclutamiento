import { UserRound, UsersRound } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge, ReclutadorBadge } from '@/components/ui/Badge';
import './AssignmentMeta.css';

export interface AssignmentPerson {
  id: string;
  display_name?: string | null;
  username?: string | null;
}

interface AssignmentMetaProps {
  assignee?: AssignmentPerson;
  currentUserId?: string;
  appearance?: 'default' | 'compact';
}

export function AssignmentMeta({ assignee, currentUserId, appearance = 'default' }: AssignmentMetaProps) {
  const { language } = useLanguage();
  const en = language === 'en';
  const isCurrentUser = assignee?.id === currentUserId;

  return (
    <dl className="assignment-meta">
      <div className="assignment-meta__row">
        <dt className="sr-only">{en ? 'Assignment' : 'Asignación'}</dt>
        <dd className="assignment-meta__value">
          {assignee ? (
            isCurrentUser ? (
              <Badge
                variant="neutral"
                size={appearance === 'compact' ? 'compact' : 'regular'}
                className="assignment-meta__badge"
              >
                <UserRound size="var(--icon-size-sm)" aria-hidden="true" />
                <span>{en ? 'Assigned to you' : 'Asignada a ti'}</span>
              </Badge>
            ) : (
              <ReclutadorBadge
                nombre={assignee.display_name || assignee.username || (en ? 'Unnamed' : 'Sin nombre')}
                size="sm"
                showRole={false}
              />
            )
          ) : (
            <Badge
              variant="neutral"
              size={appearance === 'compact' ? 'compact' : 'regular'}
              className="assignment-meta__badge"
            >
              <UsersRound size="var(--icon-size-sm)" aria-hidden="true" />
              <span>{en ? 'Whole team' : 'Todo el equipo'}</span>
            </Badge>
          )}
        </dd>
      </div>
    </dl>
  );
}

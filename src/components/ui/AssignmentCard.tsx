import type { ReactNode } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AssignmentMeta, type AssignmentPerson } from './AssignmentMeta';
import { Badge } from './Badge';
import './AssignmentCard.css';

export interface AssignmentCardProps {
  className?: string;
  title: string;
  summary?: string;
  assignee?: AssignmentPerson;
  assignmentDisplay?: 'visible' | 'hidden';
  currentUserId?: string;
  isNew?: boolean;
  status?: ReactNode;
  actions?: ReactNode;
  onOpen?: () => void;
  headingLevel?: 3 | 4;
}

export function AssignmentCard({
  className = '',
  title,
  summary,
  assignee,
  assignmentDisplay = 'visible',
  currentUserId,
  isNew = false,
  status,
  actions,
  onOpen,
  headingLevel = 3,
}: AssignmentCardProps) {
  const { language } = useLanguage();
  const Heading = `h${headingLevel}` as const;

  return (
    <li className={`card assignment-card ${className}`.trim()}>
      {onOpen && (
        <button
          type="button"
          className="assignment-card__open"
          onClick={onOpen}
          aria-label={`${language === 'en' ? 'View' : 'Ver'}: ${title}`}
        />
      )}
      <div className="assignment-card__meta">
        <div className="assignment-card__badges">
          {isNew && (
            <Badge size="compact" data-state="new">
              {language === 'en' ? 'New' : 'Nueva'}
            </Badge>
          )}
          {status}
        </div>
        <div className="assignment-card__end">
          {assignmentDisplay === 'visible' && (
            <AssignmentMeta assignee={assignee} currentUserId={currentUserId} appearance="compact" />
          )}
          {actions && <div className="assignment-card__actions">{actions}</div>}
        </div>
      </div>
      <Heading className="assignment-card__title">{title}</Heading>
      {summary && <p className="assignment-card__summary">{summary}</p>}
    </li>
  );
}

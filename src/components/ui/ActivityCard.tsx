import { useLanguage } from '@/contexts/LanguageContext';
import { AssignmentCard } from '@/components/ui/AssignmentCard';
import { Badge } from '@/components/ui/Badge';

type ActivityCardStatus = 'pendiente' | 'en_proceso' | 'completada';

export interface ActivityCardProps {
  title: string;
  description?: string;
  status: ActivityCardStatus;
  assignee?: {
    id: string;
    display_name?: string | null;
    username?: string | null;
  };
  isNew?: boolean;
  currentUserId?: string;
  onClick: () => void;
}

const STATUS_LABEL: Record<ActivityCardStatus, { es: string; en: string; state: string }> = {
  pendiente: { es: 'Pendiente', en: 'Pending', state: 'pending' },
  en_proceso: { es: 'En proceso', en: 'In progress', state: 'in_progress' },
  completada: { es: 'Completada', en: 'Completed', state: 'completed' },
};

export function ActivityCard({
  title,
  description,
  status,
  assignee,
  isNew = false,
  currentUserId,
  onClick,
}: ActivityCardProps) {
  const { language } = useLanguage();
  const statusCopy = STATUS_LABEL[status];

  return (
    <AssignmentCard
      title={title}
      summary={description?.trim() || undefined}
      assignee={assignee}
      currentUserId={currentUserId}
      isNew={isNew}
      status={
        <Badge size="compact" data-state={statusCopy.state}>
          {statusCopy[language]}
        </Badge>
      }
      onOpen={onClick}
    />
  );
}

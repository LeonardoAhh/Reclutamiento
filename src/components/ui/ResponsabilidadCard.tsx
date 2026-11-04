import { AssignmentCard } from '@/components/ui/AssignmentCard';

export interface ResponsabilidadCardProps {
  title: string;
  description?: string;
  area?: string;
  assignee?: { id: string; display_name?: string | null; username?: string | null };
  isNew?: boolean;
  currentUserId?: string;
  onOpen: () => void;
}

export function ResponsabilidadCard({
  title,
  description,
  assignee,
  isNew = false,
  currentUserId,
  onOpen,
}: ResponsabilidadCardProps) {
  return (
    <AssignmentCard
      title={title}
      summary={description}
      assignee={assignee}
      isNew={isNew}
      currentUserId={currentUserId}
      onOpen={onOpen}
    />
  );
}

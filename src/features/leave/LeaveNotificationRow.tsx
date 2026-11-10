import type { ReactNode } from 'react';

interface LeaveNotificationRowProps {
  title: string;
  subtitle: string;
  trailing: ReactNode;
}

export function LeaveNotificationRow({ title, subtitle, trailing }: LeaveNotificationRowProps) {
  return (
    <li className="leave-approval-notifications__item">
      <div className="leave-approval-notifications__content">
        <p className="leave-approval-notifications__title">{title}</p>
        <p className="leave-approval-notifications__period">{subtitle}</p>
      </div>
      {trailing}
    </li>
  );
}

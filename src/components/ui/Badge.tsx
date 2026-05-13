import './Badge.css';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'coral' | 'teal' | 'amber' | 'success' | 'error';
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span className={`badge badge--${variant}`}>
      {children}
    </span>
  );
}

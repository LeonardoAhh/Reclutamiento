import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useMotionTokens } from '@/hooks/useMotionTokens';

interface AccountSectionProps {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  /** Acción compacta alineada con el encabezado. */
  action?: ReactNode;
  className?: string;
  children?: ReactNode;
}

/** Tarjeta de sección de /account: encabezado h2, descripción opcional y contenido. */
export function AccountSection({ id, title, description, action, className, children }: AccountSectionProps) {
  const motionTokens = useMotionTokens('--transition-slow');
  return (
    <motion.section
      className={['account-card', className].filter(Boolean).join(' ')}
      aria-labelledby={`${id}-title`}
      initial={{ opacity: 0, y: motionTokens.distance }}
      animate={{ opacity: 1, y: 0 }}
      transition={motionTokens.transition}
    >
      <header className="account-card__header">
        <div className="account-card__heading">
          <h2 id={`${id}-title`} className="account-card__title">{title}</h2>
          {description && <p id={`${id}-description`} className="account-card__description">{description}</p>}
        </div>
        {action}
      </header>
      {children}
    </motion.section>
  );
}

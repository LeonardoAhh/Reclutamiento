import React from 'react';
import './ButtonUtility.css';

interface ButtonUtilityProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Opcional ícono que acompaña al texto (lado izquierdo por defecto) */
  icon?: React.ReactNode;
}

/**
 * Utility button - según design.md:
 * White surface, text ink, typography.button, tighter rounded.md (8px),
 * padding 4px 14px, 1px hairline border.
 */
export function ButtonUtility({ children, icon, className = '', ...props }: ButtonUtilityProps) {
  return (
    <button className={`btn-utility ${className}`} {...props}>
      {icon && <span className="btn-utility__icon">{icon}</span>}
      {children}
    </button>
  );
}

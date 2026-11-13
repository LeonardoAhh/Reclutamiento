import React from 'react';
import './ButtonUtility.css';

interface ButtonUtilityProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Opcional ícono que acompaña al texto (lado izquierdo por defecto) */
  icon?: React.ReactNode;
}

/**
 * Utility button - según desing.md:
 * Reuses the shared secondary button geometry, color and states.
 */
export function ButtonUtility({ children, icon, className = '', ...props }: ButtonUtilityProps) {
  return (
    <button className={`btn-secondary btn-utility ${className}`.trim()} {...props}>
      {icon && (
        <span className="btn-utility__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}

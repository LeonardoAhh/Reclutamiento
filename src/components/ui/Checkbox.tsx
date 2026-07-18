import * as React from "react";
import { Check } from 'lucide-react';
import './Checkbox.css';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className={['ui-checkbox', className].filter(Boolean).join(' ')}>
        <input
          type="checkbox"
          className="ui-checkbox__input"
          ref={ref}
          {...props}
        />
        <span className="ui-checkbox__indicator">
          <Check size={12} strokeWidth={3} />
        </span>
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

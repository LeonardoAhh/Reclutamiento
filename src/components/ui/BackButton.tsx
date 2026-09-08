import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "type"> {
  label?: ReactNode;
}

export const BackButton = forwardRef<HTMLButtonElement, BackButtonProps>(
  function BackButton({ label = "Volver", className = "", ...props }, ref) {
    const classes = ["btn-text", className].filter(Boolean).join(" ");

    return (
      <button ref={ref} type="button" className={classes} {...props}>
        <ArrowLeft size="var(--icon-size-sm)" aria-hidden="true" />
        <span>{label}</span>
      </button>
    );
  },
);

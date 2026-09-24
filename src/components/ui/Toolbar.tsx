import type { HTMLAttributes, ReactNode } from "react";
import "./Toolbar.css";

interface ToolbarProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  label: string;
  children: ReactNode;
}

interface ToolbarGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label?: string;
  children: ReactNode;
}

/** Agrupa controles de una vista sin alterar su estado ni su orden de foco. */
export function Toolbar({ label, children, className, ...props }: ToolbarProps) {
  return (
    <section
      {...props}
      className={["ui-toolbar", className].filter(Boolean).join(" ")}
      aria-label={label}
    >
      {children}
    </section>
  );
}

export function ToolbarGroup({
  label,
  children,
  className,
  ...props
}: ToolbarGroupProps) {
  return (
    <div
      {...props}
      className={["ui-toolbar__group", className].filter(Boolean).join(" ")}
      role={label ? "group" : undefined}
      aria-label={label}
    >
      {children}
    </div>
  );
}

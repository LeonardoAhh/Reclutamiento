import { useLanguage } from "@/contexts/LanguageContext";
import { Languages } from "lucide-react";
import type { ReactNode } from "react";

interface LanguageToggleProps {
  className?: string;
  iconOnly?: boolean;
  children?: ReactNode;
}

export function LanguageToggle({ className, iconOnly = false, children }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage();
  const nextLanguage = language === "es" ? "en" : "es";
  const label = language === "es"
    ? "Cambiar idioma a inglés"
    : "Switch language to Spanish";

  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      title={label}
      onClick={() => setLanguage(nextLanguage)}
    >
      {children ?? (iconOnly ? <Languages aria-hidden="true" /> : language.toUpperCase())}
    </button>
  );
}

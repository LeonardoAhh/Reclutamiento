import { useLanguage } from "@/contexts/LanguageContext";

interface SkipLinkProps {
  targetId: string;
}

export function SkipLink({ targetId }: SkipLinkProps) {
  const { language } = useLanguage();

  return (
    <a className="skip-link" href={`#${targetId}`}>
      {language === "en" ? "Skip to main content" : "Saltar al contenido principal"}
    </a>
  );
}

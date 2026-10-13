import { useLanguage } from "@/contexts/LanguageContext";
import "./ReferenceImageLink.css";

interface ReferenceImageLinkProps {
  src: string;
}

export function ReferenceImageLink({ src }: ReferenceImageLinkProps) {
  const { language } = useLanguage();
  const en = language === "en";

  return (
    <a
      className="activity-reference-image"
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={en ? "Open full image in a new tab" : "Abrir imagen completa en una pestaña nueva"}
    >
      <img src={src} alt="" />
    </a>
  );
}

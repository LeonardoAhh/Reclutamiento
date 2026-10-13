import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import "./ExpandableReferenceImage.css";

interface ExpandableReferenceImageProps {
  src: string;
}

export function ExpandableReferenceImage({ src }: ExpandableReferenceImageProps) {
  const [expanded, setExpanded] = useState(false);
  const { language } = useLanguage();
  const en = language === "en";

  return (
    <div className="activity-reference-image" data-expanded={expanded}>
      <button
        type="button"
        className="activity-reference-image__toggle"
        aria-expanded={expanded}
        aria-label={expanded
          ? (en ? "Fit image to panel" : "Ajustar imagen al panel")
          : (en ? "Show image at full size" : "Ver imagen a tamaño completo")}
        onClick={() => setExpanded((current) => !current)}
      >
        <img src={src} alt="" />
      </button>
    </div>
  );
}

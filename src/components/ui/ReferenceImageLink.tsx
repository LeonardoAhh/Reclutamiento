import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { getActivityImagePath, type ActivityImageStatus, type ActivityImageTab } from "@/pages/activityImageNavigation";
import "./ReferenceImageLink.css";

interface ReferenceImageLinkProps {
  src: string;
  activityId: string;
  tab: ActivityImageTab;
  status?: ActivityImageStatus;
}

export function ReferenceImageLink({ src, activityId, tab, status }: ReferenceImageLinkProps) {
  const { language } = useLanguage();
  const en = language === "en";

  return (
    <Link
      className="activity-reference-image"
      to={getActivityImagePath(activityId, tab, undefined, status)}
      aria-label={en ? "View full image" : "Ver imagen completa"}
    >
      <img src={src} alt="" />
    </Link>
  );
}

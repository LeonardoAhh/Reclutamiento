import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { signActivityProofUrl } from '@/lib/activityProofUrls';
import { Link } from 'react-router-dom';
import { getActivityImagePath, type ActivityImageStatus, type ActivityImageTab } from '@/pages/activityImageNavigation';
import './ReferenceImageLink.css';

interface ReferenceImageLinkProps {
  src: string;
  activityId: string;
  tab: ActivityImageTab;
  status?: ActivityImageStatus;
}

export function ReferenceImageLink({ src, activityId, tab, status }: ReferenceImageLinkProps) {
  const { language } = useLanguage();
  const en = language === 'en';
  const [preview, setPreview] = useState<{ source: string; status: 'ready' | 'error'; url: string | null } | null>(
    null,
  );

  useEffect(() => {
    let active = true;
    void signActivityProofUrl(src)
      .then((url) => {
        if (active) setPreview({ source: src, status: 'ready', url });
      })
      .catch(() => {
        if (active) setPreview({ source: src, status: 'error', url: null });
      });
    return () => {
      active = false;
    };
  }, [src]);

  return (
    <Link
      className="activity-reference-image"
      data-cuelume-navigate=""
      to={getActivityImagePath(activityId, tab, undefined, status)}
      aria-label={en ? 'View full image' : 'Ver imagen completa'}
    >
      {preview?.source === src && preview.status === 'ready' && <img src={preview.url ?? undefined} alt="" />}
      {preview?.source === src && preview.status === 'error' && (
        <span>{en ? 'Image unavailable' : 'Imagen no disponible'}</span>
      )}
    </Link>
  );
}

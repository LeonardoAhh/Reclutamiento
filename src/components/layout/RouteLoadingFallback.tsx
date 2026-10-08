import { useLocation } from 'react-router-dom';
import { BoneyardSkeleton } from '@/components/ui/BoneyardSkeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { getRouteBones } from '@/lib/routePages';

/**
 * Fallback de Suspense dentro del workspace: el sidebar y el header siguen
 * visibles mientras llega el código de la página. Usa el mismo snapshot
 * Boneyard de la ruta para que no haya un salto entre dos cargas distintas.
 */
export function RouteLoadingFallback() {
  const { pathname } = useLocation();
  const { language } = useLanguage();
  const label = language === 'en' ? 'Loading page…' : 'Cargando página…';
  const bones = getRouteBones(pathname);

  if (!bones) {
    return (
      <div role="status" aria-live="polite" aria-atomic="true">
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  const skeleton = (
    <BoneyardSkeleton name={bones.name} loading loadingLabel={label}>
      <div aria-hidden="true" />
    </BoneyardSkeleton>
  );

  // Reproduce el mismo marco en el que se capturó el snapshot.
  return bones.frame === 'container' ? <div className="container">{skeleton}</div> : skeleton;
}

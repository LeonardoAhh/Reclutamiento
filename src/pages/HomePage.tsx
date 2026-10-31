import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { BadgeDollarSign, ChartNoAxesCombined } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMotionTokens } from '@/hooks/useMotionTokens';
import { getConfiguracionHref } from '@/lib/configuracionNavigation';
import { toNaturalCase } from '@/lib/utils';
import { HomeCultureSection } from './home/HomeCultureSection';
import './HomePage.css';

const BirthplaceMap = lazy(() => import('./home/BirthplaceMap'));
const MAP_SCENE_MS = 5000;
const CULTURE_SCENE_MS = 15000;
const MAP_LOAD_TIMEOUT_MS = 12000;

type HomeScene = 'map' | 'culture';
type MapState = 'loading' | 'ready' | 'failed';

export function HomePage() {
  const { language } = useLanguage();
  const en = language === 'en';
  const { profile, username } = useAuth();
  const reduceMotion = useReducedMotion() ?? false;
  const entrance = useMotionTokens('--transition-slow');
  const [scene, setScene] = useState<HomeScene>('map');
  const [mapState, setMapState] = useState<MapState>('loading');
  const [mapInteracting, setMapInteracting] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);

  const onMapReady = useCallback(() => setMapState('ready'), []);
  const onMapLoadFailed = useCallback(() => setMapState('failed'), []);
  const onMapInteractionChange = useCallback((active: boolean) => setMapInteracting(active), []);

  useEffect(() => {
    const updateVisibility = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, []);

  useEffect(() => {
    if (reduceMotion || scene !== 'map' || mapState !== 'loading') return;
    const timeout = window.setTimeout(() => setMapState('failed'), MAP_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timeout);
  }, [reduceMotion, scene, mapState]);

  useEffect(() => {
    if (reduceMotion || scene !== 'map' || mapState !== 'failed') return;
    setScene('culture');
  }, [reduceMotion, scene, mapState]);

  const timerActive = !reduceMotion && pageVisible &&
    (scene === 'map' ? mapState === 'ready' && !mapInteracting : mapState !== 'failed');

  useEffect(() => {
    if (!timerActive) return;
    const timeout = window.setTimeout(() => {
      if (scene === 'map') {
        setScene('culture');
      } else {
        setMapState('loading');
        setMapInteracting(false);
        setScene('map');
      }
    }, scene === 'map' ? MAP_SCENE_MS : CULTURE_SCENE_MS);
    return () => window.clearTimeout(timeout);
  }, [scene, timerActive]);

  if (!profile) return null;

  const displayName = toNaturalCase(profile.display_name || username, {
    preserveAcronyms: false,
  });
  const firstName = displayName.split(/\s+/)[0] || displayName;
  const sceneLabel = scene === 'map'
    ? en ? 'Where we come from' : 'De dónde venimos'
    : en ? 'Our HR culture' : 'Nuestra cultura RH';

  return (
    <main className="home-page container" aria-labelledby="home-page-title">
      <header className="home-page__top-row">
        <h1 id="home-page-title" className="home-page__greeting">
          {en ? 'Hello' : 'Hola'}, {firstName}.
        </h1>
        <nav className="home-page__quick-links" aria-label={en ? 'Quick links' : 'Accesos directos'}>
          <Link
            className="home-page__quick-link"
            to={getConfiguracionHref('tabulador')}
            aria-label={en ? 'Pay Scale' : 'Tabulador'}
            data-cuelume-navigate=""
          >
            <BadgeDollarSign aria-hidden="true" />
            <span aria-hidden="true">{en ? 'Pay Scale' : 'Tabulador'}</span>
          </Link>
          {profile.role === 'admin' && (
            <Link
              className="home-page__quick-link"
              to={getConfiguracionHref('indicadores')}
              aria-label={en ? 'Metrics' : 'Indicadores'}
              data-cuelume-navigate=""
            >
              <ChartNoAxesCombined aria-hidden="true" />
              <span aria-hidden="true">{en ? 'Metrics' : 'Indicadores'}</span>
            </Link>
          )}
        </nav>
      </header>

      <div className="home-page__stage">
        {mapState === 'failed' && (
          <p className="home-page__map-error" role="status">
            {en ? 'The map could not be loaded. You can still read our HR culture.' : 'No se pudo cargar el mapa. Puedes seguir leyendo nuestra cultura RH.'}
          </p>
        )}
        {reduceMotion ? (
          <div className="home-page__reduced-scenes">
            <Suspense fallback={<div className="home-birthplace home-birthplace--loading" role="status"><span className="sr-only">{en ? 'Loading map' : 'Cargando mapa'}</span></div>}>
              <BirthplaceMap onReady={onMapReady} onLoadFailed={onMapLoadFailed} />
            </Suspense>
            <HomeCultureSection />
          </div>
        ) : (
          <>
            <p className="sr-only" role="status">{sceneLabel}</p>
            <AnimatePresence mode="wait" initial={false}>
              {scene === 'map' ? (
                <motion.div key="map" className="home-page__scene"
                  initial={{ opacity: 0, y: entrance.distance }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -entrance.distance }}
                  transition={entrance.transition}
                >
                  <Suspense fallback={<div className="home-birthplace home-birthplace--loading" role="status"><span className="sr-only">{en ? 'Loading map' : 'Cargando mapa'}</span></div>}>
                    <BirthplaceMap onReady={onMapReady} onLoadFailed={onMapLoadFailed}
                      onInteractionChange={onMapInteractionChange} />
                  </Suspense>
                </motion.div>
              ) : (
                <motion.div key="culture" className="home-page__scene"
                  initial={{ opacity: 0, y: entrance.distance }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -entrance.distance }}
                  transition={entrance.transition}
                >
                  <HomeCultureSection />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </main>
  );
}

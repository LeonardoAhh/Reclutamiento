import { useEffect } from 'react';
import { useAnimate, useReducedMotion } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { DESKTOP_MEDIA_QUERY } from '@/lib/layout';

export function useLoginStoryAnimation() {
  const [scope, animate] = useAnimate();
  const reduceMotion = useReducedMotion();
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const enabled = isDesktop && reduceMotion === false;

  useEffect(() => {
    if (!enabled) return;
    const tokens = getComputedStyle(document.documentElement);
    const duration = Number.parseFloat(tokens.getPropertyValue('--duration-brand-reveal')) / 1000;
    if (!Number.isFinite(duration)) {
      throw new Error('Login animation requires a valid duration token');
    }
    const fadeDuration = duration / 2;
    const playback = animate([
      ['.login-story__mark', { opacity: [1, 0] }, { at: fadeDuration, duration: fadeDuration }],
      ['.login-story__orb', { opacity: [0, 1] }, { at: duration, duration: fadeDuration }],
    ]);
    return () => playback.cancel();
  }, [animate, enabled]);

  return { scope, isDesktop };
}

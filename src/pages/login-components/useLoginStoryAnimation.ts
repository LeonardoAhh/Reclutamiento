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
    const curve = tokens.getPropertyValue('--ease-standard').match(/cubic-bezier\(([^)]+)\)/)?.[1]?.split(',') ?? [];
    const easing: [number, number, number, number] = [Number(curve[0]), Number(curve[1]), Number(curve[2]), Number(curve[3])];
    if (!Number.isFinite(duration) || !easing.every(Number.isFinite)) {
      throw new Error('Login animation requires valid duration and easing tokens');
    }
    const fadeDuration = duration / 2;
    const expressionFade = fadeDuration / 2;
    const robotStart = duration + fadeDuration;
    const playback = animate([
      ['.login-story__mark', { opacity: [1, 0] }, { at: fadeDuration, duration: fadeDuration }],
      ['.login-story__robot', { opacity: [0, 1], y: ['var(--design-spacing-md)', '0px'] }, { duration: fadeDuration }],
      ['.login-story__robot-motion', {
        x: ['0px', 'var(--design-spacing-lg)', 'calc(-1 * var(--design-spacing-lg))', '0px'],
        y: ['0px', 'calc(-1 * var(--motion-float-distance))', '0px', '0px'],
      }, { at: robotStart, duration: fadeDuration * 3, ease: easing }],
      ['[data-expression="wave"]', { opacity: [1, 0] }, { at: robotStart, duration: expressionFade }],
      ['[data-expression="think"]', { opacity: [0, 1] }, { at: robotStart, duration: expressionFade }],
      ['[data-expression="think"]', { opacity: [1, 0] }, { at: robotStart + fadeDuration, duration: expressionFade }],
      ['[data-expression="success"]', { opacity: [0, 1] }, { at: robotStart + fadeDuration, duration: expressionFade }],
      ['[data-expression="success"]', { opacity: [1, 0] }, { at: robotStart + fadeDuration * 2, duration: expressionFade }],
      ['[data-expression="wave"]', { opacity: [0, 1] }, { at: robotStart + fadeDuration * 2, duration: expressionFade }],
    ]);
    return () => playback.cancel();
  }, [animate, enabled]);

  return { scope, enabled };
}

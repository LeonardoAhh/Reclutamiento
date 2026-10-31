import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import * as echarts from 'echarts/core';
import { EffectScatterChart, MapChart, ScatterChart } from 'echarts/charts';
import { AriaComponent, GeoComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMotionTokens } from '@/hooks/useMotionTokens';
import { motionTransition } from '@/lib/motionTokens';
import { TYPEWRITER_INTERVAL_MS } from '@/lib/constants';
import { TypewriterTitle } from '@/components/ui/TypewriterTitle';
import { BIRTHPLACE_COUNTS } from './birthplaceData';
import { BirthplaceMapTooltip } from './BirthplaceMapTooltip';
import { useBirthplaceMapTooltip } from './useBirthplaceMapTooltip';
import './BirthplaceMap.css';

echarts.use([MapChart, ScatterChart, EffectScatterChart, GeoComponent, AriaComponent, CanvasRenderer]);

const MAP_URL = `${import.meta.env.BASE_URL}maps/mexico-states.json`;

function cssToken(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

type BirthplaceMapProps = {
  onReady?: () => void;
  onLoadFailed?: () => void;
  onInteractionChange?: (active: boolean) => void;
};

export default function BirthplaceMap({ onReady, onLoadFailed, onInteractionChange }: BirthplaceMapProps) {
  const { language } = useLanguage();
  const en = language === 'en';
  const chartElement = useRef<HTMLDivElement>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const entrance = useMotionTokens('--transition-slow');
  const { tooltip, showTooltip, hideTooltip } = useBirthplaceMapTooltip();

  useEffect(() => {
    const element = chartElement.current;
    if (!element) return;

    const controller = new AbortController();
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const scheme = window.matchMedia('(prefers-color-scheme: dark)');
    let chart: ReturnType<typeof echarts.init> | undefined;
    let active = true;

    function updateChart() {
      if (!chart) return;
      const ink = cssToken('--color-ink');
      const border = cssToken('--color-control-border');
      const surface = cssToken('--color-canvas-elevated');
      const primary = cssToken('--color-primary');
      const primaryText = cssToken('--color-primary-text');
      const onPrimary = cssToken('--color-on-primary');
      const font = cssToken('--font-body');
      const still = motion.matches;

      chart.setOption({
        backgroundColor: 'transparent',
        animation: !still,
        animationDuration: motionTransition('--transition-slow').duration * 1000,
        aria: { enabled: true },
        textStyle: { fontFamily: font },
        geo: {
          map: 'mexico-home',
          roam: true,
          zoom: 1.08,
          silent: true,
          itemStyle: { areaColor: 'transparent', borderColor: border, borderWidth: 1 },
        },
        series: [
          {
            type: 'map',
            map: 'mexico-home',
            geoIndex: 0,
            data: BIRTHPLACE_COUNTS.map(({ name, count }) => ({ name, value: count })),
            itemStyle: { areaColor: 'transparent', borderColor: border, borderWidth: 1 },
            emphasis: {
              label: { show: true, color: onPrimary, fontFamily: font },
              itemStyle: { areaColor: primary, borderColor: ink, borderWidth: 1 },
            },
          },
          {
            type: still ? 'scatter' : 'effectScatter',
            coordinateSystem: 'geo',
            data: BIRTHPLACE_COUNTS.map(({ name, count, coordinates }) => ({
              name: name === 'México' ? 'Estado de México' : name,
              value: [...coordinates, count],
            })),
            symbolSize: (value: number[]) => Math.max(Math.sqrt(value[2]) * 3, 8),
            rippleEffect: { brushType: 'stroke', scale: 2.5, period: 4 },
            itemStyle: { color: primaryText, borderColor: surface, borderWidth: 1 },
          },
        ],
      }, true);
    }

    const resizeObserver = new ResizeObserver(() => chart?.resize());
    resizeObserver.observe(element);
    const themeObserver = new MutationObserver(updateChart);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-color-scheme'],
    });
    motion.addEventListener('change', updateChart);
    scheme.addEventListener('change', updateChart);

    async function loadMap() {
      try {
        if (!echarts.getMap('mexico-home')) {
          const response = await fetch(MAP_URL, { signal: controller.signal });
          if (!response.ok) throw new Error('Map unavailable');
          const mapData: unknown = await response.json();
          if (!active) return;
          echarts.registerMap('mexico-home', mapData as Parameters<typeof echarts.registerMap>[1]);
        }
        if (!active) return;
        chart = echarts.init(element, undefined, { renderer: 'canvas' });
        chart.on('mouseover', showTooltip);
        chart.on('click', showTooltip);
        chart.on('georoam', hideTooltip);
        chart.getZr().on('globalout', hideTooltip);
        updateChart();
        setReady(true);
        onReady?.();
      } catch {
        if (active && !controller.signal.aborted) {
          setLoadFailed(true);
          onLoadFailed?.();
        }
      }
    }
    void loadMap();

    return () => {
      active = false;
      controller.abort();
      resizeObserver.disconnect();
      themeObserver.disconnect();
      motion.removeEventListener('change', updateChart);
      scheme.removeEventListener('change', updateChart);
      chart?.dispose();
    };
  }, [showTooltip, hideTooltip, onReady, onLoadFailed]);

  return (
    <section className="home-birthplace" aria-labelledby="home-birthplace-title">
      <motion.header
        className="home-birthplace__header"
        initial={entrance.reduce ? false : { opacity: 0, y: entrance.distance }}
        animate={{ opacity: 1, y: 0 }}
        transition={entrance.transition}
      >
        <h2 id="home-birthplace-title">
          <TypewriterTitle
            key={language}
            sequences={[{ text: en ? 'Where we come from' : 'De dónde venimos' }]}
            typingSpeed={TYPEWRITER_INTERVAL_MS}
            startDelay={0}
            autoLoop={false}
            naturalVariance={false}
            reserveSpace
            showCursor={false}
          />
        </h2>
      </motion.header>
      {loadFailed ? (
        <p className="home-birthplace__fallback" role="status">
          {en ? 'The map could not be displayed.' : 'No se pudo mostrar el mapa.'}
        </p>
      ) : (
        <motion.div
          className="home-birthplace__chart"
          initial={entrance.reduce ? false : { opacity: 0, y: entrance.distance }}
          animate={{ opacity: ready ? 1 : 0, y: ready ? 0 : entrance.distance }}
          transition={entrance.transition}
          aria-busy={!ready}
          onMouseLeave={hideTooltip}
          onPointerEnter={() => onInteractionChange?.(true)}
          onPointerLeave={() => onInteractionChange?.(false)}
          onPointerCancel={() => onInteractionChange?.(false)}
        >
          <div
            ref={chartElement}
            className="home-birthplace__canvas"
            role="img"
            aria-label={en ? 'Map of Mexico showing employees by state of birth' : 'Mapa de México con colaboradores por estado de nacimiento'}
          />
          <BirthplaceMapTooltip data={tooltip} onClose={hideTooltip} />
        </motion.div>
      )}
    </section>
  );
}

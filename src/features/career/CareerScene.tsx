import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import * as THREE from 'three';
import { CAREER_ROLES } from './types';
import type { CareerRoleId } from './types';

interface CareerSceneProps {
  nodesRef: RefObject<HTMLOListElement | null>;
  selected: CareerRoleId;
  paused: boolean;
}
interface Connector { id: CareerRoleId; d: string }
interface Diagram { width: number; height: number; connectors: Connector[] }
interface SceneApi {
  update: (selected: CareerRoleId, paused: boolean) => void;
  updateTheme: () => void;
}

export function CareerScene({ nodesRef, selected, paused }: CareerSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<SceneApi | null>(null);
  const selection = useRef({ selected, paused });
  const [state, setState] = useState<'loading' | 'ready' | 'fallback'>('loading');
  const [diagram, setDiagram] = useState<Diagram>({ width: 1, height: 1, connectors: [] });
  const reducedMotion = useReducedMotion();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const host = hostRef.current;
    const list = nodesRef.current;
    if (!host || !list) return;
    const rootStyles = getComputedStyle(document.documentElement);
    const pixels = (token: string) => {
      const value = rootStyles.getPropertyValue(token).trim();
      return Number.parseFloat(value) * (value.endsWith('rem') ? Number.parseFloat(rootStyles.fontSize) : 1);
    };
    const nodes = CAREER_ROLES.map(role => list.querySelector<HTMLButtonElement>(`[data-role="${role.id}"]`));
    let renderer: THREE.WebGLRenderer | null = null;
    const canvas = document.createElement('canvas');
    if (!window.matchMedia('(forced-colors: active)').matches) {
      try {
        const context = canvas.getContext('webgl2', { alpha: true, antialias: true });
        if (context) renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true });
      } catch { renderer = null; }
    }
    if (renderer) {
      // Se limita la densidad al máximo óptico de dos muestras por píxel CSS.
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      canvas.setAttribute('aria-hidden', 'true');
      host.appendChild(canvas);
    }
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera();
    const radius = pixels('--design-spacing-xs') / 2;
    const geometry = new THREE.SphereGeometry(radius, 16, 12);
    const material = new THREE.MeshStandardMaterial({ color: rootStyles.getPropertyValue('--color-primary').trim() });
    const ambient = new THREE.AmbientLight(rootStyles.getPropertyValue('--color-scene-light').trim());
    const light = new THREE.DirectionalLight(rootStyles.getPropertyValue('--color-scene-light').trim());
    light.position.set(1, 1, 1);
    scene.add(ambient, light);
    const particles = CAREER_ROLES.slice(1).map(() => {
      const particle = new THREE.Mesh(geometry, material);
      scene.add(particle); return particle;
    });
    let curves: THREE.CubicBezierCurve3[] = [];
    let frame = 0;
    let elapsed = 0;
    let lastFrame: number | null = null;
    let inView = true;
    let active = selection.current;
    const cycle = Number.parseFloat(rootStyles.getPropertyValue('--transition-decorative-float'));
    const draw = () => renderer?.render(scene, camera);
    const positionParticles = () => {
      curves.forEach((curve, index) => {
        const particle = particles[index];
        const progress = ((elapsed / cycle) + index / curves.length) % 1;
        particle.position.copy(curve.getPoint(progress));
        particle.visible = true;
      });
    };
    const tick = (now: number) => {
      if (!renderer || active.paused || reducedMotion !== false || !inView || document.hidden) {
        frame = 0; lastFrame = null; return;
      }
      if (lastFrame !== null) elapsed += now - lastFrame;
      lastFrame = now;
      positionParticles(); draw();
      frame = requestAnimationFrame(tick);
    };
    const restart = () => {
      cancelAnimationFrame(frame); frame = 0; lastFrame = null;
      positionParticles(); draw();
      if (renderer && !active.paused && reducedMotion === false && inView && !document.hidden) {
        frame = requestAnimationFrame(tick);
      }
    };
    const measure = () => {
      const rect = host.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const points = nodes.map(node => {
        if (!node) return null;
        const nodeRect = node.getBoundingClientRect();
        return { x: nodeRect.left + nodeRect.width / 2 - rect.left,
          y: nodeRect.top + nodeRect.height / 2 - rect.top };
      });
      const connectors: Connector[] = [];
      curves = [];
      points.slice(1).forEach((point, index) => {
        const previous = points[index];
        if (!point || !previous) return;
        const midX = (point.x + previous.x) / 2;
        connectors.push({ id: CAREER_ROLES[index + 1].id,
          d: `M ${previous.x} ${previous.y} C ${midX} ${previous.y}, ${midX} ${point.y}, ${point.x} ${point.y}` });
        const vector = (x: number, y: number, z = 0) => new THREE.Vector3(x - rect.width / 2, rect.height / 2 - y, z);
        curves.push(new THREE.CubicBezierCurve3(vector(previous.x, previous.y),
          vector(midX, previous.y, radius), vector(midX, point.y, radius), vector(point.x, point.y)));
      });
      setDiagram({ width: rect.width, height: rect.height, connectors });
      camera.left = -rect.width / 2; camera.right = rect.width / 2;
      camera.top = rect.height / 2; camera.bottom = -rect.height / 2;
      camera.near = 0; camera.far = Math.max(rect.width, rect.height);
      camera.position.z = camera.far / 2; camera.updateProjectionMatrix();
      renderer?.setSize(rect.width, rect.height, false); restart();
    };
    apiRef.current = { update: (selectedId, isPaused) => {
      active = { selected: selectedId, paused: isPaused };
      const selectedIndex = CAREER_ROLES.findIndex(role => role.id === selectedId);
      particles.forEach((particle, index) => particle.scale.setScalar(index + 1 === selectedIndex ? 2 : 1));
      restart();
    }, updateTheme: () => {
      const styles = getComputedStyle(document.documentElement);
      material.color.set(styles.getPropertyValue('--color-primary').trim());
      draw();
    } };
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    nodes.forEach(node => { if (node) observer.observe(node); });
    const visibility = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; restart(); });
    visibility.observe(host);
    const onVisibility = () => restart();
    document.addEventListener('visibilitychange', onVisibility);
    const lost = (event: Event) => {
      event.preventDefault(); cancelAnimationFrame(frame);
      renderer?.dispose(); renderer = null; canvas.remove(); setState('fallback');
    };
    canvas.addEventListener('webglcontextlost', lost);
    measure(); setState(renderer ? 'ready' : 'fallback');
    return () => {
      apiRef.current = null; cancelAnimationFrame(frame); observer.disconnect(); visibility.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', lost);
      geometry.dispose(); material.dispose();
      renderer?.dispose(); renderer?.forceContextLoss(); canvas.remove();
    };
  }, [nodesRef, reducedMotion]);

  useEffect(() => {
    apiRef.current?.updateTheme();
  }, [resolvedTheme]);

  useEffect(() => {
    selection.current = { selected, paused };
    apiRef.current?.update(selected, paused);
  }, [selected, paused]);

  return (
    <div className="career-scene" data-scene-state={state}
      data-paused={paused || reducedMotion !== false} aria-hidden="true">
      <svg className="career-scene__connectors" viewBox={`0 0 ${diagram.width} ${diagram.height}`} focusable="false">
        {diagram.connectors.map(connector => <g key={connector.id}>
          <path className="career-scene__line" d={connector.d} />
          {state !== 'ready' && <path className="career-scene__flow" d={connector.d} />}
        </g>)}
      </svg>
      <div className="career-scene__canvas" ref={hostRef} />
    </div>
  );
}

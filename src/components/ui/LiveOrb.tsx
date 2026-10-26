// Adapted from 23rd Live Orb (MIT): https://github.com/radiumcoders/23rd.dev/tree/main/registry/live-orb
import { useEffect, useRef, useState } from 'react';
import {
  createLiveOrb,
  fallbackFaceStyle,
  resolveDark,
  resolveVariant,
  watchTheme,
  type LiveOrbInstance,
} from './live-orb-vanilla';
import './LiveOrb.css';

interface LiveOrbProps {
  size?: number;
}

export function LiveOrb({ size = 280 }: LiveOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const instanceRef = useRef<LiveOrbInstance | null>(null);
  const [hasGl, setHasGl] = useState(false);
  const [dark, setDark] = useState(() => resolveDark());

  useEffect(() => {
    const sync = () => setDark(resolveDark());
    sync();
    return watchTheme(sync);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    instanceRef.current = createLiveOrb(canvas, { onHasGl: setHasGl });
    return () => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, []);

  const resolved = resolveVariant(undefined, undefined, undefined, undefined, dark);

  return (
    <div className="live-orb" role="img" aria-label="Orbe animado" style={{ width: size, height: size }}>
      {!hasGl && (
        <div className="live-orb__fallback" aria-hidden="true" style={fallbackFaceStyle(resolved)}>
          <span className="live-orb__eye live-orb__eye--left" style={{ backgroundColor: resolved.eye }} />
          <span className="live-orb__eye live-orb__eye--right" style={{ backgroundColor: resolved.eye }} />
        </div>
      )}
      <canvas ref={canvasRef} className="live-orb__canvas" aria-hidden="true" />
    </div>
  );
}

import { useMemo, useRef, useEffect } from 'react';
import './BlackHole.css';

interface BlackHoleProps {
  /** Activa la secuencia de absorción (al iniciar sesión correctamente). */
  absorbing?: boolean;
}

/**
 * Agujero negro hiperrealista — 100% CSS, sin imágenes.
 * Estilo "Interstellar / Gargantua": disco de acreción con Doppler beaming,
 * doble anillo de fotones, lente gravitacional, grano de película,
 * paralaje con el cursor y secuencia de absorción.
 */
export function BlackHole({ absorbing = false }: BlackHoleProps) {
  const cosmosRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);

  // Partículas que espiralan hacia el horizonte de eventos
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => {
        const angle = (360 / 18) * i + (Math.random() * 22 - 11);
        const radius = 200 + Math.random() * 220;
        const duration = 4.5 + Math.random() * 5;
        const delay = -Math.random() * duration;
        const size = 1 + Math.random() * 2;
        return { id: i, angle, radius, duration, delay, size };
      }),
    [],
  );

  // Paralaje con el cursor (rAF-throttled)
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    let raf = 0;
    let tx = 0;
    let ty = 0;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
      if (!raf) raf = requestAnimationFrame(apply);
    };

    const apply = () => {
      raf = 0;
      if (tiltRef.current) {
        tiltRef.current.style.transform = `rotateX(${(-ty * 7).toFixed(2)}deg) rotateY(${(tx * 9).toFixed(2)}deg)`;
      }
      if (cosmosRef.current) {
        cosmosRef.current.style.transform = `translate3d(${(-tx * 26).toFixed(1)}px, ${(-ty * 26).toFixed(1)}px, 0)`;
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className={`bh${absorbing ? ' bh--absorbing' : ''}`} aria-hidden="true">
      {/* Cosmos (estrellas + nebulosa) con paralaje */}
      <div className="bh__cosmos" ref={cosmosRef}>
        <div className="bh__nebula" />
        <div className="bh__stars bh__stars--far" />
        <div className="bh__stars bh__stars--mid" />
        <div className="bh__stars bh__stars--near" />
      </div>

      {/* Escena del agujero negro */}
      <div className="bh__stage">
        <div className="bh__tilt" ref={tiltRef}>
          <div className="bh__system">
            <div className="bh__bloom" />

            {/* Disco de acreción detrás del horizonte */}
            <div className="bh__disk bh__disk--back" />
            <div className="bh__disk bh__disk--turb" />

            {/* Doppler beaming (un lado más brillante) */}
            <div className="bh__doppler" />

            {/* Anillo de Einstein que arquea sobre/bajo el horizonte */}
            <div className="bh__halo" />

            {/* Horizonte de eventos + doble anillo de fotones */}
            <div className="bh__core">
              <div className="bh__photon-ring" />
              <div className="bh__photon-ring bh__photon-ring--inner" />
            </div>

            {/* Disco frente al horizonte (mitad inferior) */}
            <div className="bh__disk bh__disk--front" />

            {/* Partículas absorbidas */}
            <div className="bh__particles">
              {particles.map((p) => (
                <span
                  key={p.id}
                  className="bh__particle"
                  style={
                    {
                      '--angle': `${p.angle}deg`,
                      '--radius': `${p.radius}px`,
                      '--dur': `${p.duration}s`,
                      '--delay': `${p.delay}s`,
                      '--size': `${p.size}px`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
          </div>

          {/* Onda de choque de la secuencia de absorción */}
          <div className="bh__shock" />
        </div>
      </div>

      {/* Grano de película (ruido procedural SVG) */}
      <div className="bh__grain" />

      {/* Destello de absorción a pantalla completa */}
      <div className="bh__flash" />

      {/* Viñeta */}
      <div className="bh__vignette" />
    </div>
  );
}

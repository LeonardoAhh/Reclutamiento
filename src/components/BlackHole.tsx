import { useMemo } from 'react';
import './BlackHole.css';

/**
 * Agujero negro hiperrealista — 100% CSS, sin imágenes.
 * Disco de acreción estilo "Interstellar" con lente gravitacional,
 * campo de estrellas con parallax y partículas siendo absorbidas.
 */
export function BlackHole() {
  // Partículas que espiralan hacia el horizonte de eventos
  const particles = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => {
        const angle = (360 / 16) * i + (Math.random() * 24 - 12);
        const radius = 220 + Math.random() * 200;
        const duration = 5 + Math.random() * 5;
        const delay = -Math.random() * duration;
        const size = 1 + Math.random() * 2;
        return { id: i, angle, radius, duration, delay, size };
      }),
    [],
  );

  return (
    <div className="bh" aria-hidden="true">
      {/* Capas de estrellas con parallax */}
      <div className="bh__stars bh__stars--far" />
      <div className="bh__stars bh__stars--mid" />
      <div className="bh__stars bh__stars--near" />

      {/* Nebulosa de fondo, tenue */}
      <div className="bh__nebula" />

      {/* Escena del agujero negro con perspectiva 3D */}
      <div className="bh__stage">
        <div className="bh__system">
          {/* Disco de acreción detrás del horizonte (mitad superior visible) */}
          <div className="bh__disk bh__disk--back" />

          {/* Halo de lente gravitacional que arquea sobre el horizonte */}
          <div className="bh__lens" />

          {/* Horizonte de eventos + anillo de fotones */}
          <div className="bh__core">
            <div className="bh__photon-ring" />
          </div>

          {/* Disco de acreción frente al horizonte (mitad inferior) */}
          <div className="bh__disk bh__disk--front" />

          {/* Resplandor / bloom */}
          <div className="bh__bloom" />

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
      </div>

      {/* Viñeta para fundir bordes */}
      <div className="bh__vignette" />
    </div>
  );
}

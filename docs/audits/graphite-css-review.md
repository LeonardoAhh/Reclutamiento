# Revisión del CSS global Graphite UI

## Alcance y método

Se revisó `src/styles/global.css` contra `AGENTS.md`, `desing.md` y los consumidores del repositorio. El inventario completo de tokens y clases está en [graphite-css-inventory.md](./graphite-css-inventory.md). Sus conteos son literales: una clase generada dinámicamente o un token leído mediante un nombre construido en tiempo de ejecución exige revisión adicional.

Se compararon los estilos calculados de la versión anterior y la actual con Chromium local, en claro y oscuro, usando muestras aisladas de enlaces con clases de botón y campos normales, inválidos, de error y de éxito. Se usó movimiento reducido para evitar que una transición intermedia falseara la comparación. No se ejecutaron acciones contra Supabase ni producción.

## Cambios aplicados

- Los selectores generales de enlace ahora usan `:where()`. Los botones renderizados como enlaces conservan su color de texto en hover.
- El hover de campos omite los estados inválido, error y éxito; estos mantienen su borde semántico.
- Se retiraron ocho declaraciones idénticas del bloque oscuro. Se conservaron los alias que deben resolverse en el propio elemento `:root[data-color-scheme="dark"]`.
- El comentario del botón primario ya indica azul. El pie de modal usa `flex-start`, equivalente al resultado de `stretch` en flexbox.

## Estado por hallazgo

| ID | Estado | Archivos tocados | Verificación o razón |
|---|---|---|---|
| 0 | Hecho | Inventario | 479 custom properties y 103 clases con referencias literales; se identificaron lecturas de CSS en TypeScript. |
| 1.1 | Hecho | `global.css` | Chromium: los enlaces `.btn-primary`, `.btn-danger` y `.btn-secondary` ya no toman el azul del enlace en hover. |
| 1.2–1.3 | Pendiente | Ninguno | `.card--dark` no tiene consumidor JSX/TSX/HTML confirmado; cambiar alias globales alteraría otros componentes. |
| 1.4 | Hecho | `global.css` | Chromium: `aria-invalid`, `.input-error` y `.input-success` conservan su borde en hover, en ambos temas. |
| 1.5 | Descartado | Ninguno | `.btn-sm` sí tiene consumidores. Su tamaño actual coincide con el botón base; falta una decisión de diseño para diferenciarlo. |
| 1.6 | Pendiente | Ninguno | `.toggle-switch` no tiene consumidor confirmado; no se introdujo un cambio visual en un control sin uso. |
| 2.1 | Parcial | `global.css` | Se eliminaron solo ocho valores repetidos; la comparación de tokens calculados no mostró cambios. Los alias dependientes del tema permanecen. |
| 2.2 | Pendiente | Ninguno | Algunos roles usan `px` y otros `rem`; la equivalencia a tamaño raíz de 16px no basta para unificar sus contratos. |
| 2.3 | Pendiente | Ninguno | Las utilidades tienen consumidores; agruparlas entre reglas distantes puede cambiar el orden de la cascada. |
| 2.4 | Descartado | Ninguno | `.form-error` y `.form-error-text` no son idénticas; las reglas consecutivas de inputs tienen responsabilidades distintas. |
| 2.5 | Pendiente | Ninguno | Las bases de botones circulares comparten geometría pero sus diferencias de estado requieren comparación visual específica. |
| 2.6 | Pendiente | Ninguno | La regla global de movimiento reducido no equivale a `animation: none` para decoraciones y bucles. |
| 2.7 | Pendiente | Ninguno | Los alias de espaciado, radios, sombras y colores tienen usos y funciones semánticas; no se eliminaron solo por compartir valor. Las capas con valor 1000 necesitan decisión de superposición. |
| 2.8 | Pendiente | Ninguno | Se conservan canales RGB por compatibilidad; un cambio a color relativo necesita matriz de navegadores y comparación visual. |
| 3.1 | Pendiente | Ninguno | `candidateAccessCard.ts` lee tokens numéricos de CSS; cambiar unidades exige adaptar y comprobar su render de canvas. |
| 3.2–3.4 | Pendiente | Ninguno | `@layer`, división del archivo y traslado de tokens de feature son migraciones de alcance mayor con riesgo de cascada. |
| 3.5 | Parcial | `global.css` | Corregido el comentario de color primario; `desing.md` es el nombre real y no se renombró. |
| 3.6–3.9 | Pendiente | Ninguno | Hover condicionado al puntero, toggle, propiedades lógicas y animaciones de modal requieren comprobación de interacciones y layout completos. |
| 3.10 | Hecho | `global.css` | `justify-content: stretch` en flexbox se sustituyó por `flex-start`. |
| 3.11–3.13 | Pendiente | Ninguno | El tema se aplica antes de la hoja mediante `public/theme.js`; fallback, métricas de fuente y prefijos globales necesitan propuesta separada. |
| 3.14 | Pendiente | Ninguno | El inventario marca candidatos sin referencias literales, pero no prueba ausencia de uso dinámico o externo. No se borraron tokens públicos. |

## Verificación y límites

- `npm.cmd run build`: correcto (TypeScript y Vite).
- PostCSS pudo analizar `global.css`.
- El repositorio no define comandos `lint` ni `test` en `package.json`; no hay suite visual propia identificada.
- CSS fuente normalizado a saltos LF: **75,265 → 75,023 bytes** (−242 bytes). El archivo de trabajo usa CRLF, por lo que su tamaño bruto no es comparable con el blob de Git.
- No se hizo una inspección visual de todas las pantallas autenticadas. `forced-colors`, modales reales, toggle y pase de candidato requieren una pasada funcional antes de futuras migraciones; sus reglas no fueron modificadas.
- Los cambios visuales intencionales se limitan al color del texto de enlaces con estilo de botón en hover y al borde de campos con error o éxito en hover.

## Siguiente paso recomendado

Añadir una prueba visual pequeña de primitivas en ambos temas y estados, incluida `forced-colors`. Después revisar con el equipo si `.btn-sm` y `.toggle-switch` deben mantenerse; una vez definidos esos contratos, abordar la escala tipográfica y el despiece del CSS en una propuesta independiente.

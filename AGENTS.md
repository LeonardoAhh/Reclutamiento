# AGENTS.md — Reglas obligatorias del proyecto

Este archivo aplica a cualquier IA, agente o desarrollador que modifique el proyecto raíz. Las palabras **DEBE**, **NO DEBE**, **PROHIBIDO** y **OBLIGATORIO** expresan requisitos no negociables.

## 1. Alcance y jerarquía

- Estas reglas aplican a todo `/app`, excepto `rutas-app`.
- **PROHIBIDO analizar, editar, formatear, mover o regenerar cualquier archivo dentro de `rutas-app`**, salvo solicitud explícita del usuario.
- La fuente de verdad visual es [`desing.md`](./desing.md). Se conserva ese nombre exacto porque así existe en el repositorio.
- Orden de precedencia para decisiones del proyecto:
  1. Solicitud explícita y actual del usuario.
  2. Este `AGENTS.md`.
  3. `desing.md`.
  4. Patrones ya implementados en el proyecto.
- Una solicitud visual **no autoriza** cambiar lógica de negocio, datos, permisos, rutas, contratos ni integraciones.
- Ante una ambigüedad que pueda alterar comportamiento, datos o alcance, se DEBE preguntar antes de implementar.

## 2. Preflight obligatorio antes de editar

Antes de crear o modificar una página, proceso o componente, se DEBE:

1. Identificar la ruta, componente y archivos exactos afectados.
2. Leer `desing.md` y esta guía.
3. Inspeccionar los componentes, utilidades y tokens existentes equivalentes.
4. Identificar qué lógica, contratos de datos, estados y acciones deben permanecer intactos.
5. Definir primero el comportamiento móvil y después tablet/PC.
6. Revisar los estados: carga, vacío, error, sin coincidencias, deshabilitado y éxito cuando apliquen.
7. Elegir la solución menos invasiva que resuelva completamente el problema.

**PROHIBIDO improvisar una estética, introducir una librería o iniciar un refactor amplio sin completar este preflight.**

## 3. Preservación funcional

Salvo petición explícita del usuario, NO se debe:

- Cambiar consultas, mutaciones, autenticación, permisos, RLS, Supabase, APIs o persistencia.
- Cambiar reglas de negocio, cálculos, filtros existentes o significado de los datos.
- Renombrar rutas, tablas, campos, eventos o claves de almacenamiento.
- Eliminar, ocultar o degradar acciones y estados existentes.
- Convertir datos reales en mocks o placeholders.
- Añadir dependencias externas para resolver algo que el sistema actual ya puede hacer.

Para rediseños, los mismos datos deben conservar el mismo significado; únicamente cambia su presentación.

## 4. Sistema visual obligatorio

### 4.1 Colores

- Usar siempre tokens (`var(--color-*)` / `{colors.*}`), nunca hex, rgb, hsl o colores nombrados directos.
- `{colors.primary}` es el **único color estructural**: CTA principal, links, selección activa y focus.
- La paleta sticker (`accent-pink`, `accent-teal`, `accent-orange`, `accent-purple`, etc.) es exclusivamente decorativa: ilustraciones, iconos o dots pequeños.
- **PROHIBIDO** usar colores sticker para botones, tabs, navegación, filtros, campos o estructura.
- Los colores semánticos deben ser puntuales y proporcionales. Un error o incidencia puede usar un indicador pequeño; no se debe pintar toda la estructura sin necesidad.
- La página usa `{colors.canvas-soft}`; `{colors.surface}` se reserva para cards, inputs y paneles.

### 4.2 Tipografía

- Usar los tokens de jerarquía existentes, incluyendo peso, line-height y tracking.
- PROHIBIDO introducir `font-size`, `font-weight`, `line-height` o `letter-spacing` arbitrarios.
- Los headings mantienen jerarquía semántica y visual; no se elige un heading por su tamaño.
- Body copy conserva peso regular; el peso fuerte se reserva para títulos, valores y énfasis real.

### 4.3 Espaciado, tamaño y geometría

- Usar exclusivamente la escala de spacing del sistema (`var(--spacing-*)`).
- Usar exclusivamente los radios del sistema (`var(--rounded-*)`).
- Inputs: `{rounded.xs}`. Botones utilitarios/nav: `{rounded.md}`. CTA de marketing: `{rounded.full}`.
- **Nunca usar un input pill.**
- Las cards de contenido usan `{rounded.lg}` y hairline.
- Elevación: hairline + sombras por token; nunca sombras pesadas inventadas.
- PROHIBIDOS los “magic numbers” de layout. Si una dimensión nueva se repite, debe convertirse en token semántico.
- Excepciones permitidas: `0`, proporciones (`fr`, porcentajes, `aspect-ratio`), conteos de grid, el hairline documentado y breakpoints documentados.
- Evitar estilos inline. Solo se permiten cuando el valor depende realmente del runtime —por ejemplo, posición calculada de un portal— y no puede expresarse mediante clase/token.

## 5. Responsive mobile-first

- El estilo base SIEMPRE corresponde a móvil.
- Tablet y desktop se agregan progresivamente con los breakpoints definidos en `desing.md` o ya estandarizados por el proyecto.
- No diseñar primero PC para después “encogerlo”.
- Todo contenedor flex/grid susceptible de encogerse debe considerar `min-width: 0`.
- Grids fluidos deben usar `minmax(0, 1fr)` cuando corresponda.
- Texto dinámico debe envolver o truncarse de forma intencional, nunca romper el layout.
- PROHIBIDO depender de scroll horizontal para formularios, filtros, cards o contenido principal.
- En móvil, controles interactivos deben respetar un mínimo de 44×44px; usar preferentemente `--touch-target-min`.
- Safe areas y barras fijas no deben tapar contenido ni acciones.

### 5.1 Alineación obligatoria en tablet y PC

Para toolbars, filtros, formularios y filas de acciones:

- Labels equivalentes deben compartir tipografía, line-height, margen y altura visual.
- Inputs, selects, segmented controls y botones hermanos deben compartir la misma altura exterior.
- La altura exterior incluye padding y border: **no sumar `min-height` del botón más padding del contenedor y asumir que seguirá alineado**.
- Controles con label se alinean por la fila del control (`align-items: end`) y no por el centro del bloque completo.
- Acciones sin label deben reservar o compensar correctamente la fila del label, o alinearse al borde inferior del control.
- Títulos laterales en una toolbar deben alinearse con la fila de controles, no flotar entre label y campo.
- Gaps horizontales y verticales deben provenir de la misma escala de spacing.
- Antes de cerrar un cambio se debe revisar visualmente la alineación a ancho móvil, tablet, desktop y wide.
- Si un grupo se ve alineado “casi”, se considera **NO terminado**.

## 6. Accesibilidad y semántica

- Cumplir WCAG 2.2 AA como mínimo.
- Preferir HTML nativo: `button`, `a`, `label`, `input`, `select`, `fieldset`, `legend`, `table`, `ul/ol`, `section`, `article`, `header`.
- PROHIBIDO convertir `div` o `article` en botón si puede existir un `<button>` real.
- Todo campo debe tener label accesible; placeholder no reemplaza label.
- Todo botón de icono debe tener nombre accesible.
- Estados expandibles deben exponer `aria-expanded` y, cuando exista el panel, `aria-controls`.
- Selecciones tipo toggle deben exponer `aria-pressed`, `aria-selected` o el patrón nativo adecuado.
- Mantener navegación por teclado, orden de foco lógico y focus visible mediante token.
- Los estados dinámicos relevantes deben anunciarse sin duplicar regiones `aria-live` innecesarias.
- No depender solo del color para comunicar estado; incluir texto, forma o label.
- Verificar contraste, especialmente `{colors.ink-faint}` sobre `{colors.canvas-soft}`.

## 7. Reutilización y arquitectura

- Antes de crear un componente, buscar uno equivalente en `desing.md`, `src/components/ui` y la feature relacionada.
- Reutilizar patrones como `feature-card`, `button-utility`, `badge-pill`, inputs, modales y empty states.
- Si un patrón visual o lógico aparece dos veces o puede repetirse, extraerlo a componente/utilidad con responsabilidad única.
- No duplicar CSS para “pisar” una regla anterior. Corregir o consolidar la fuente original.
- Las clases deben describir función, no apariencia accidental.
- Mantener estilos de una feature dentro de su alcance; evitar selectores globales nuevos salvo que sean tokens o primitivas reales.

## 8. Calidad de código

- TypeScript estricto: PROHIBIDO introducir `any` evitable, casts ciegos o acceso inseguro a datos.
- Usar type guards para datos `unknown`.
- Sin imports, variables, funciones, selectores o estilos muertos.
- Sin duplicación de lógica ni markup extenso cuando puede componerse.
- Nombres descriptivos; componentes pequeños y con responsabilidad única.
- Keys e IDs deben ser únicos y estables; no usar índices si existe identidad real.
- No silenciar errores para “hacer funcionar” una pantalla.
- No realizar refactors ajenos a la solicitud actual.

## 9. Estados y UX

Toda feature con datos debe contemplar, cuando aplique:

- Carga con skeleton o status accesible.
- Estado inicial con instrucción breve y accionable.
- Estado vacío real.
- Estado sin coincidencias por filtros, con una forma visible de limpiarlos.
- Error con mensaje claro y sin destruir datos disponibles.
- Contenido largo, nombres extensos, valores faltantes y múltiples resultados.

Los días, fechas, conteos y estados relevantes deben ser visibles en la interfaz; no esconder información esencial únicamente en `title`, tooltip o hover.

## 10. Convenciones de páginas y modales

- Páginas: un solo título principal, sin subtítulo decorativo en el header.
- Modales: header limpio, sin decoración ni información secundaria innecesaria.
- Modales de eliminar: compactos, nunca fullscreen.
- En móvil, un modal fullscreen solo se usa para procesos largos cuando el patrón existente lo justifique.
- No mezclar Sheet, Modal y página para el mismo flujo sin una razón funcional explícita.

## 11. Política de decisión segura

Cuando `desing.md` no cubra un caso:

1. Buscar un patrón equivalente ya implementado.
2. Elegir la variante más simple, neutral y coherente.
3. Mantener intacta la lógica.
4. No introducir colores, animaciones, dependencias o patrones nuevos por gusto personal.
5. Si dos opciones cambian sustancialmente la UX, preguntar al usuario.

**Nunca “mejorar” áreas no solicitadas como efecto colateral. Nunca tomar una decisión visual llamativa sin respaldo del sistema.**

## 12. Checklist obligatorio antes de declarar terminado

La persona o IA responsable DEBE confirmar:

- [ ] Se trabajó únicamente en el alcance solicitado y no se tocó `rutas-app`.
- [ ] Se leyó y respetó `desing.md`.
- [ ] No cambió lógica, datos, contratos o integraciones sin autorización.
- [ ] No existen colores, spacing, tipografía, radios o sombras fuera de tokens.
- [ ] La implementación es mobile-first y escala correctamente.
- [ ] No hay overflow, clipping ni texto roto.
- [ ] Labels y controles están perfectamente alineados en PC.
- [ ] Controles hermanos tienen la misma altura exterior.
- [ ] Touch targets, foco, teclado, semántica y ARIA son correctos.
- [ ] Se reutilizaron componentes/patrones existentes antes de crear nuevos.
- [ ] No hay duplicación, código muerto, estilos inline evitables ni IDs inestables.
- [ ] Carga, vacío, filtros sin resultados y error tienen salida clara.
- [ ] La información esencial permanece visible sin depender de hover/tooltip.
- [ ] El diff no contiene cambios accidentales fuera del alcance.

Si cualquier punto falla, el trabajo NO está terminado.
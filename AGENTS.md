# Instrucciones del proyecto

## 1. Alcance
- No analizar ni modificar archivos dentro de la carpeta `rutas-app`.

## 2. Fuente de verdad del diseño
- Antes de crear o modificar cualquier proceso, página o componente, leer y analizar `design.md`.
- Todo el trabajo de UI se basa en ese documento: paleta, tipografía, spacing, radios, elevación y componentes ya definidos ahí.

## 3. Reglas para nuevos procesos, páginas y componentes

### Accesibilidad
- WCAG 2.2 AA como mínimo: contraste de texto (cuidado con `{colors.ink-faint}` sobre `{colors.canvas-soft}`, es el par más bajo en contraste del sistema), navegación por teclado, focus visible, roles/labels ARIA donde aplique.
- Respetar el mínimo de 44×44px en touch targets, como indica la sección de Responsive del doc.

### UX/UI — semántica y coherencia
- `{colors.primary}` es el **único** color estructural: se reserva para CTA principal, links y estado activo/focus. Nunca usar la paleta de "stickers" (`accent-pink`, `accent-teal`, `accent-orange`, etc.) para pintar acciones o estructura — esos colores son solo decorativos (ilustraciones, íconos, dots).
- No mezclar formas: CTAs de marketing van en `{rounded.full}` (pill), botones utilitarios/nav en `{rounded.md}` (8px), inputs siempre en `{rounded.xs}` (4px) — nunca pill en un input.
- Elevación tipo Notion: hairline (`{colors.hairline}`) + sombra "barely-there" por capas (Level 1/2 del doc), nunca `box-shadow` pesado de una sola capa.
- El fondo cálido `{colors.canvas-soft}` es la base de página; blanco puro (`{colors.surface}`) solo para cards/inputs, para mantener el contraste figura/fondo.

### Reutilización
- Antes de crear un componente nuevo, revisar si ya existe un patrón equivalente en la sección "Components" del doc (`feature-card`, `button-utility`, `badge-pill`, etc.) o en las variantes `ex-*` (pensadas para re-skinear a otros verticales).
- Si un patrón visual se repite o va a repetirse, extraerlo a componente reutilizable.

### Código
- Sin código muerto (imports, funciones, variables sin uso).
- Sin duplicación — reutilizar utilidades/componentes existentes.
- Buenas prácticas generales: nombres descriptivos, responsabilidad única por componente, tipado estricto.

### Sin hardcodear (design tokens)
- **Tipografía**: usar los tokens de la tabla de Hierarchy (`{typography.display-1}`, `{typography.heading-1}`, `{typography.body-md}`, etc.), incluyendo su tracking negativo en tamaños grandes — no valores sueltos de `font-size`/`letter-spacing`.
- **Espaciado**: usar la escala de 8px (`{spacing.xxs}` a `{spacing.xxl}`), no px arbitrarios.
- **Colores**: siempre vía token (`{colors.primary}`, `{colors.ink}`, `{colors.accent-*}`...), nunca hex/rgb directo en el código.
- **Radios**: usar la escala (`{rounded.xs}` a `{rounded.full}`) según el tipo de componente, no valores custom.

### Mobile-first
- Todo nuevo proceso, página o componente se diseña y construye mobile-first: primero el layout y comportamiento en mobile, luego se escala hacia tablet/desktop usando los breakpoints definidos en `design.md`.

### Ante dudas
- Si hay duda sobre un patrón, color, spacing o comportamiento, volver a analizar `design.md` antes de decidir.
- Si `design.md` no cubre el caso, buscar primero si ya existe algo similar implementado en el proyecto actual antes de crear un patrón nuevo desde cero.

### Convenciones de páginas y modales
- Páginas: solo título, sin subtítulo.
- Modales: header limpio (sin elementos decorativos ni información secundaria innecesaria).
- Modales de eliminar/delete: nunca full screen — siempre modal compacto, no ocupan toda la pantalla.

## 4. Regla general
- `design.md` es la fuente de verdad. Ante ambigüedad o conflicto, prevalece lo definido ahí.
- No tocar rutas-app a menos de que el usuario lo solicite, es un micro proyecto que no necesitamos modificar.

# PRD — Reclutamiento (React + Vite + Supabase)

## Planteamiento original
App de control de plantilla, vacantes y pipeline de candidatos (Supabase backend, React/Vite/TS frontend, PWA). El usuario pide diseños **mobile-first** diferenciados de PC, sin borrar datos ni lógica, sin fonts/colores hardcodeados (tokens de `global.css`), buenas prácticas y cohesión.

## Decisiones del usuario
- KPIs móvil: tabs por grupo (Semana, Vacantes, Candidatos, Plantilla, Bajas); gráfica hero colapsable en sección secundaria; sin blur "Incognito" en móvil; PC se queda como está.
- Modales/forms de creación (Nuevo Empleado, Nueva Vacante, Nuevo Candidato): un diseño en PC (actual) y otro en móvil (wizard por pasos). El usuario prueba en su entorno local (no compartió credenciales Supabase).

## Implementado
### 2026-06-11
- **KpisPage** (`src/pages/KpisPage.tsx` + `.css`): vista móvil con tabs por grupo (`KPI_GROUPS`, `CARD_GROUP_BY_ID`), grid 2 col compacto, valores directos sin blur, botón "Detalle" (ojo) en cards con modal, gráfica semanal colapsable (`kpis-chart-toggle`). Desktop intacto (hero chart + grid 3/4 col + Incognito/KpiReveal). Lógica de datos 100% conservada.
- **FormWizard** (`src/components/ui/FormWizard.tsx` + `.css`, nuevo): asistente por pasos para formularios largos en móvil — progreso segmentado, validación por paso, footer Atrás/Siguiente/Submit, tokens-only, inputs 16px (sin zoom iOS), safe-areas.
- **EmployeeSheet**: alta en móvil con wizard 3 pasos (Identidad → Posición → Transporte). PC y modo baja sin cambios.
- **CandidateModal**: alta/edición en móvil con wizard 3 pasos (Contacto → Posición → Proceso) dentro del modal fullscreen (`candidate-modal--wizard`). PC y delete sin cambios.
- **VacancySheet**: alta/edición en móvil con wizard 3 pasos (Posición → Seguimiento → Fechas y detalles + historial). PC (Modal) y delete sin cambios.
- Entorno: `vite.config.ts` con `server { host, port 3000, allowedHosts }`; dep `react-is` agregada (peer de recharts).
- **EmployeeSheet en PC → Modal centrado** (alta y baja), igual que Vacantes/Candidatos; clase `employee-sheet employee-modal` (max-width 560px).
- **Unificación total a Modal (sin Sheets en los 3 formularios de creación)**: en móvil los 3 usan modal fullscreen (`modal-fullscreen-mobile`) con wizard (`modal-wizard-mobile` + `modal-wizard-form`, clases genéricas en `FormWizard.css`). Delete = modal con `modal-footer`. EmployeeSheet/VacancySheet ya no importan `Sheet`.
- **Fix banner de actualización PWA cortado en móvil** (`PWAStatus.css`): Framer Motion pisaba el `transform: translateX(-50%)` del centrado; ahora centra con `left/right: 0 + margin-inline: auto` (sin transform).

### 2026-01 — Fix barra de estado iOS en tema oscuro
- En iOS Safari el safe-area superior (notch / barra de estado) toma su color del `<html>`, no del `<body>`. Sin `background-color` en `html`, la zona se pintaba blanca en tema oscuro (Android funcionaba porque Chrome respeta el `theme-color` meta dinámico).
- `src/styles/global.css`: `html` ahora hereda `background-color: var(--color-canvas)` con la misma transición que el body.
- `src/hooks/useTheme.ts` y script inline de `index.html`: actualizan `document.documentElement.style.backgroundColor` y el meta `theme-color` con los colores reales del canvas (`#0a0a0a` dark / `#ffffff` light), no con los antiguos `#1c1b16` / `#f7f6f2` que no coincidían.
- `index.html`: `apple-mobile-web-app-status-bar-style` cambiado a `black-translucent` para que en modo PWA standalone el contenido se extienda bajo la barra de estado y adopte el color del `<html>`.

### 2026-01 — Theme toggle al Header (emblema único + Framer Motion)
- Se sacó el ítem "Theme" del `UserMenu` dropdown y se eliminó el import de `useTheme`/`Sun`/`Moon` allí.
- `src/components/ui/ThemeToggle.tsx` reescrito: motion.button con `role="switch"`, `whileHover`/`whileTap` (scale + rotate), emblema SVG "split disc + satellite" que rota 180° por spring al alternar tema. Diseño abstracto, NO usa íconos clásicos de sol/luna.
- `src/components/ui/ThemeToggle.css` reescrito 100% con tokens (`--control-height`, `--rounded-full`, `--color-ink/canvas/hairline/surface-soft`, `--shadow-focus`, `--transition-fast`). Tap target grande en mobile (`--control-height-lg`). Respeta `prefers-reduced-motion`.
- `Header.tsx`: `<ThemeToggle />` colocado antes del `<UserMenu />` dentro de `.app-header__actions` (ya tiene `gap: var(--spacing-xs)`). Visible en mobile y desktop.
- `tsc -b --noEmit` y `vite build` OK.

### 2026-01 — Bottom tab bar removida → todos los accesos al UserMenu
- `src/App.tsx`: removido `<BottomTabBar />` del `ProtectedShell`. Los componentes siguen en `src/components/layout/BottomTabBar.{tsx,css}` para posible restauración futura, simplemente no se montan.
- `src/components/layout/UserMenu.tsx` reescrito: dropdown consolidado con 7 rutas (KPIs, Candidates, Dashboard, Vacancies, Downsizing, Employees, Rutas) + sign out. Sección "Navigation" con label. Detección de ruta activa via `useLocation` (exacto para `/`, prefijo para el resto). `aria-current="page"` + indicador visual (dot a la derecha + bg tinted + bold) en el item activo. Cierre automático al cambiar pathname. Cada item con `data-testid="user-menu-nav-*"`.
- `src/components/layout/UserMenu.css`: dropdown más ancho (260–320px) con `max-height: calc(100dvh - var(--spacing-xxl))` y scroll interno + `overscroll-behavior: contain` para que en mobile no scrollee la página detrás. Nuevos estilos `.user-menu__section-label`, `.user-menu__list`, `.user-menu__item--active`, `.user-menu__item-dot`. 100% tokens.
- `src/styles/global.css`: eliminado el `padding-bottom: calc(var(--tab-bar-height) + var(--safe-area-bottom))` del body en mobile (ahora solo `--safe-area-bottom`); token `--tab-bar-height` queda en 0px porque `PWAStatus.css` y `CommentModal.css` aún lo referencian para offset. Reglas `::view-transition-*(theme-bottom-tab)` removidas (huérfanas).
- `tsc -b --noEmit` y `vite build` OK.

### 2026-01 — Transición global de tema (circular reveal + stagger)
- `useTheme.ts`: ahora envuelve el `applyTheme` en `document.startViewTransition(...)` cuando el navegador soporta View Transitions API (Chrome 111+, Safari 18+) y el usuario no tiene `prefers-reduced-motion`. Acepta `origin: {x, y}` (centro del botón clickeado) y lo escribe en CSS vars `--theme-origin-x/y` antes de iniciar la transición.
- `ThemeToggle.tsx`: calcula el centro del botón con `getBoundingClientRect()` y lo pasa a `toggleTheme(origin)`.
- `global.css`: tokens nuevos `--ease-apple` (cubic-bezier(0.32, 0.72, 0, 1)), `--duration-theme-out` 220ms, `--duration-theme-in` 320ms, `--duration-theme-stagger` 60ms, `--theme-origin-x/y` (default 50vw/50vh).
- Pseudo-elementos `::view-transition-old(root)` y `::view-transition-new(root)` animan un `clip-path: circle(0% → 150%)` desde el origen → revela circular tipo Vercel/Linear.
- Stagger expandido a todas las capas únicas: `.app-header` (42ms), `.user-menu__dropdown` (60ms), `*__hero` de las 7 páginas con hero (72ms), `main.container` (96ms), `.bottom-tab-bar` (108ms). Cada `view-transition-name` apunta a elementos de los que sólo hay uno montado a la vez → cero colisiones.
- Graceful degradation: navegadores sin VT API (iOS 17 y anteriores) aplican el tema sin animación; las transiciones CSS de color del body/html siguen funcionando.

## Pendiente / Backlog
- P1: Verificación visual e2e por el usuario en local (este entorno no tiene `.env` de Supabase → app no carga datos aquí).
- P2: Extender patrón mobile-first al resto de modales (importers, report modals) si el usuario lo pide.
- P2: Revisión responsive de filtros (CandidateFilters, VacancyFilters).

## Notas técnicas
- Sin `.env` en este pod: `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` faltan (ver `.env.example`); login imposible aquí.
- Supervisor `frontend` espera `/app/frontend` (no existe); Vite se corre manualmente: `cd /app && yarn dev` (puerto 3000).
- Breakpoint móvil del sistema: 768px (`useIsMobile`, `useMediaQuery`).
- `tsc -b --noEmit` limpio tras todos los cambios.

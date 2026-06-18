# PRD — Reclutamiento (React + Vite + Supabase)

## Planteamiento original
App de control de plantilla, vacantes y pipeline de candidatos (Supabase backend, React/Vite/TS frontend, PWA). El usuario pide diseños **mobile-first** diferenciados de PC, sin borrar datos ni lógica, sin fonts/colores hardcodeados (tokens de `global.css`), buenas prácticas y cohesión.

## 2026-06-18 (sesión 3) — Navbar móvil minimalista (estilo pill iOS)
- **Bottom navbar móvil** (`BottomTabBar.tsx/.css`, montada en `App.tsx > ProtectedShell`, solo ≤767px): píldora flotante centrada **sólida (sin liquid glass)** con 2 accesos principales (KPIs, Candidatos) — activo = pill relleno en `--color-primary` — + botón circular **Menú** (FAB) que abre un bottom-sheet con el resto (Dashboard, Reporte Diario, Vacantes, Bajas, Empleados, Rutas) + sesión activa + Cerrar sesión. Esc/click-outside/scroll-lock/safe-area, touch ≥44px.
- `.bottom-nav-spacer` reserva alto al final del scroll para no tapar contenido.
- **UserMenu oculto en móvil** (`UserMenu.css`): la navegación ya vive en la BottomTabBar; en desktop el menú de avatar sigue igual. Header móvil = brand + ThemeToggle.
- `npm run build` OK.


## 2026-06-18 (sesión 2) — Reporte Diario: pulido mobile-first + Supabase + fixes
- **Dedup empleados**: el export duplicaba cada empleado (360 reales → 720). `helpers.parseReporteJSON` ahora deduplica por `numero_empleado+área+turno` (fusiona días). Corrige KPIs, calendario, áreas e incidencias.
- **KPI dashboard** (`reporte-kpi-dashboard.tsx`): pasado a clases (`.reporte-kpi__*`); el inline `repeat(2,1fr)` pisaba la clase y se quedaba en 2 col + valor `display-lg` gigante. Ahora compacto: móvil 2 col, PC 4 col en una fila; valor `heading-md/lg`.
- **Incident-tabs y Área-detalle**: tabla en PC, tarjetas con expand inline en móvil. El modal de área ahora muestra **tipo de incidencia** (badge color por código) + #emp/depto/puesto al expandir. Áreas ordenadas **A-Z**.
- **Comparativa mensual** (`reporte-comparison.tsx`): rediseñada de tarjetas gigantes a **tabla compacta** (PC) + tarjetas expand-inline (móvil) — escala bien con 12+ meses.
- **Reportes guardados** (`reportes-guardados-dialog.tsx`): rediseñado a lista compacta (`.reporte-saved__*`).
- **Modales**: quitado botón "Cerrar" redundante (queda solo la X) en área, comparación y employee-detail.
- **Header**: quitados botones Retardos/Ausentismo; agregado botón **"Guardar mes"** (conecta `handleSaveToDb`); chip de archivo truncado.
- **Spacing de página**: `.reporte-page { padding-block: xl/xxl/section }` — los `py-[var(--spacing-*)]` de Tailwind no se generaban → header y fondo pegados. Corregido.
- **Tarjetas base**: `.reporte-card`/`.reporte__card` ya no fuerzan `flex-direction:column` (rompía botones en fila).
- **Supabase**: `019_reportes_diarios.sql` (1 registro por mes = historial, RLS authenticated). Correr en SQL Editor.
- Validado con `REPORTE JUNIO.json` real (360 emp, 347 inc). `npm run build` (tsc -b + vite) **OK**.


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

### 2026-06-18 — Reporte Diario mobile-first + Supabase historial
- **`reporte-diario/index.tsx`**: header, barra de día, dropzone vacía, overlays y errores migrados de estilos inline hardcodeados a clases semánticas tokens-only (mobile-first). Header en columna en móvil / fila en PC. Quitados px mágicos (1, 4, 20, padding:2…).
- **`ReporteDiario.css` reescrito**: fuente única de verdad, mobile-first, 100% tokens. Define todas las clases usadas por `index.tsx` + dialog de guardados, conserva la familia BEM `.reporte__*` de los subcomponentes, y agrega calendario responsive + incident-tabs responsive + botón primario.
- **Calendario responsive** (`reporte-calendar.tsx` + CSS): el grid 7 columnas usaba inline `repeat(7,1fr)` sin `minmax(0,…)` → en móvil se cortaban días (5,12,19,26 fuera de viewport). Refactor a clases (`reporte-cal__*`) con `repeat(7, minmax(0,1fr))`, sizing escalado por breakpoint (320/480/768), heat-borders como modifiers (`--crit/--warn/--ok`). Verificado sin overflow en 360 y 390px.
- **Incident-tabs sin saturar en móvil** (`reporte-incident-tabs.tsx`): tabla completa en ≥768px; en móvil tarjetas con **expand inline** (acordeón) — muestra nombre+área+turno y al tocar revela #empleado/depto/área. `aria-expanded`/`aria-controls`, roles tablist/tabpanel.
- **Tokens agregados** a `global.css`: `--color-warning-tint`, `--color-primary-tint` (light+dark), `--spacing-2xl: 48px` (se usaban sin definir).
- **Supabase — guardar e historizar**: el hook `useReporteDiario` ya esperaba la tabla `reportes_diarios` pero **no existía migración**. Creada `supabase/migrations/019_reportes_diarios.sql` (1 registro por `mes` UNIQUE → upsert onConflict mes = historial; `data` jsonb + columnas resumen + `uploaded_by` default `auth.uid()` + trigger `updated_at`; RLS permisiva `authenticated`, mismo patrón que `bajas`/`empleados`). README de migraciones actualizado.
- **Botón "Guardar mes"**: `handleSaveToDb` existía pero **no estaba conectado a ningún botón**. Agregado botón primario en el header (`save-report-btn`, label dinámico "Guardar mes"/"Actualizar mes" según exista el mes). Tras guardar aparece en "Reportes guardados" + "Comparativa mensual".
- Validado con el JSON real `REPORTE JUNIO.json` (720 empleados, 694 incidencias, días 01–16): parser OK (ignora fila header `mes`, mapea `área` con acento), render móvil+PC correcto, `tsc --noEmit` limpio.

## Pendiente / Backlog
- P0 (usuario): en Supabase correr `019_reportes_diarios.sql` (y `005_auth_profiles.sql` si no está) en SQL Editor; setear `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` en `.env` local. Luego subir JSON → "Guardar mes" → historial.
- P1: Verificación visual e2e por el usuario en local (este entorno no tiene `.env` de Supabase → app no carga datos aquí).
- P2: Extender patrón mobile-first al resto de modales (importers, report modals) si el usuario lo pide.
- P2: Revisión responsive de filtros (CandidateFilters, VacancyFilters).

## Notas técnicas
- Sin `.env` en este pod: `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` faltan (ver `.env.example`); login imposible aquí.
- Supervisor `frontend` espera `/app/frontend` (no existe); Vite se corre manualmente: `cd /app && yarn dev` (puerto 3000).
- Breakpoint móvil del sistema: 768px (`useIsMobile`, `useMediaQuery`).
- `tsc -b --noEmit` limpio tras todos los cambios.

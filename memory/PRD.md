# PRD — Reclutamiento (React + Vite + Supabase)

## Planteamiento original
App de control de plantilla, vacantes y pipeline de candidatos (Supabase backend, React/Vite/TS frontend, PWA). El usuario pide diseños **mobile-first** diferenciados de PC, sin borrar datos ni lógica, sin fonts/colores hardcodeados (tokens de `global.css`), buenas prácticas y cohesión.

## 2026-06-19 (sesión 8) — Vacantes automática + fix navbar
- **Vacantes 100% automática**: nueva `Vacantes.tsx` deriva las vacantes de `bajas` + `empleados` (ya no usa `vacancy_requests`). Lógica en `lib/autoVacancies.ts`: toda baja = vacante; empareja por area+seccion+puesto; cubre con el ingreso más reciente ≥ fecha_baja; 1 a 1; cobertura manual (interna) no consume ingreso. Resumen con count-up, filtro de estado, búsqueda; el usuario asigna reclutador (persistido) y puede marcar cobertura manual.
- **Persistencia reclutador**: nuevo campo `Baja.cubierta_reclutador` + `setBajaReclutador` en `useBajas`. REQUIERE columna en Supabase: `alter table bajas add column if not exists cubierta_reclutador text;`
- **Fix navbar (iOS Safari)**: la navbar fija "saltaba" al hacer scroll por el cambio de `env(safe-area-inset-bottom)` al colapsar la barra del navegador. Solución con VisualViewport API en `BottomTabBar.tsx` (se pega al fondo visible real). En PWA instalada no afecta.
- NOTA: los KPIs de SLA/time-to-fill que leían `vacancy_requests` quedarán en 0 (tabla vacía). Pendiente: re-cablearlos al nuevo modelo si se desea.
- `tsc` + `npm run build` OK.


- **Count-up KPIs (2)**: `AnimatedNumber.tsx` anima 0→valor al entrar en viewport (parsea "95%", "+3", decimales). Integrado en `StatCard` → cubre todos los KPIs. Respeta reduced-motion.
- **Stagger reveals (3)** + **scroll-reveal (5)**: `lib/motion.ts` (variants) + `Reveal.tsx` (`Reveal`/`RevealList`/`RevealItem`, `whileInView once`). Aplicado: chart-section (scroll-reveal) y grid móvil de KPIs (stagger por tab).
- **Modal entrance (nod a #1)**: `Modal.tsx` ahora entra con spring (overlay fade + content scale/slide). Shared-element real fila→modal queda pendiente (requiere trabajo cuidadoso por el portal).
- **Realtime (14)**: `useCandidates` refactor → `refetch({silent})` + suscripción `postgres_changes` a `candidates`/`candidate_notes`. Refresca en vivo entre dispositivos/pestañas. REQUIERE habilitar **Realtime** en esas tablas en Supabase (Database → Replication). Si no, degrada silencioso.
- **Accesibilidad global**: `<MotionConfig reducedMotion="user">` en `main.tsx` → todas las animaciones (nuevas y existentes) respetan la preferencia del sistema.
- `tsc` + `npm run build` OK.


- **Migración completa de `sonner` → `sileo`** (0 referencias a sonner en `src`, paquete desinstalado).
- **Setup core**:
  - `src/components/ui/AppToaster.tsx`: `<Toaster position="top-center" />` con tema sincronizado al `data-theme` del documento (MutationObserver), `offset.top` con `env(safe-area-inset-top)` (mobile-first). Montado en `App.tsx` (visible también en login).
  - `src/styles/sileo.css`: overrides cohesivos al design system → estados mapeados a tokens (`success #10b981`, `error #ef4444`, `warning #f59e0b`, `info/action #14b8a6`), `font-family: var(--font-body)`, sin `capitalize` (español), ancho responsive `calc(100vw - 1.75rem)` en ≤480px, contraste de descripción subido (a11y). Importado tras `sileo/styles.css` en `main.tsx`.
  - `src/lib/notify.ts`: reexporta `sileo` + helper `notifyResult()` para flujos `{ ok, message }` (success/error toast sin romper el return al caller).
- **Notificaciones agregadas en flujos críticos** (antes silenciados con `console.warn`):
  - Login: éxito + error.
  - Pipeline (candidatos): alta/edición, cambio de estado, contratación (incl. parcial), eliminación, nota.
  - Vacantes: alta/edición, cambio de estado, eliminación.
  - Bajas: import (con conteo insertadas/omitidas), cubrir/descubrir vacante.
  - Empleados: edición, eliminación, incapacidad (registrada/finalizada).
  - Reporte Diario: migrados los toasts existentes.
- **a11y**: sileo expone `aria-live="polite"` en el viewport.
- `npm run build` OK. NOTA: sileo emite warnings de consola `<circle> attribute cx/cy undefined` en el primer frame de medición del toast (motion); es cosmético en consola, no afecta el render. Validación visual final la hace el usuario en preview de Vercel.


## 2026-06-18 (sesión 6 cont.) — UX Dashboard + tokens
- **AreaDetailModal**: eliminado tab "Todas" (default = primera sección); resumen superior **rediseñado** (cobertura hero con % grande + barra redondeada; métricas en tiles con tinte rojo/ámbar). Fix de hueco en móvil (`coverage` pasó de `flex:1 1 240px` a `flex:0 0 auto`).
- **Header (PC)**: menús de grupo abren **solo con click** (quitado hover open/close que buggeaba la selección).
- **Transición de ruta**: eliminado `RouteTransitionLoader` (overlay que parpadeaba el navbar al navegar). Login/logout splash intacto.
- **Tokens faltantes definidos** en `global.css :root`: `--type-caption-md-*`, `--type-display-md-*`, `--type-body-lg-size`, `--text-xs/sm`, `--tracking-*`, `--rounded-xs/xl/pill`, `--radius-sm/md`, `--space-*`, `--spacing-2xs`, alias de color (`--color-danger/amber/border/surface/text-*`...), `--shadow-*` (=none, sistema hairline-only), `--header-height`, `--ease-apple`, `--duration-theme-*`. Los restantes (`--bar-*`, `--item/stop-delay`, `--theme-origin-*`) se inyectan en runtime.
- `npm run build` OK en todos los cambios.

## 2026-06-18 (sesión 6) — Fix DEFINITIVO scroll modales móvil (WeeklyHiresModal)
- **Modal afectado**: `WeeklyHiresModal` ("Ingresos · Semanas X y Y"), que usa `ExpandableSection`.
- **Causa raíz (verificada con Playwright)**: `.expandable-section` tiene `overflow: hidden`. Como hijo flex del `.modal-body` (flex column con alto fijo), su **tamaño mínimo automático = 0** (regla CSS: flex items con overflow≠visible tienen min-size 0), así que flexbox **APLASTA** las secciones para que quepan en el alto del modal → contenido recortado, el cuerpo nunca desborda → `scrollHeight == clientHeight` → **sin scroll**. (El `min-height:0` de sesiones previas NO lo resolvía; lo empeoraba.)
- **Fix** (`global.css`, `@media max-width:767px`): `.modal-content.modal-fullscreen-mobile .modal-body > * { flex-shrink: 0 }`. Los hijos conservan su alto natural → el cuerpo desborda y scrollea. Reproducción aislada: sin fix `scrollableBy=0`; con fix `scrollableBy=1535` (scroll completo). No rompe AreaDetail/scrollers internos (mantienen grow:1).
- También se mantiene `min-height:0` en `.ttf-history-modal__content` (robustez del scroller interno de TTF).
- `npm run build` OK. Pendiente: usuario despliega y valida en iOS.


## 2026-06-18 (sesión 5) — Dashboard AreaDetailModal móvil + Login safe-area
- **AreaDetailModal mobile-first** (`AreaDetailModal.tsx/.css`): en móvil la tabla saturada (se cortaba a la derecha) se reemplaza por **tarjetas** (`.area-detail-modal__cards`) con nombre del puesto, sección (en tab "Todas"), flags (urgente/excedente), métricas Real/Aut. y Vacantes, badge de estado y botón de comentario. Tabla intacta en desktop. Helpers reutilizables `renderEstado/renderFlags/commentButton/commentsFor`.
- **Tab "Todas" repetitivo**: ahora sólo se muestra cuando hay **2+ secciones**; con una sola sección se omite (era idéntico a esa sección). Default `activeTab=ALL_TAB` sigue mostrando todo.
- **Login bajo barra de estado (PWA)** (`Login.css`): el panel superior móvil no reservaba safe-area; `padding-top: max(var(--spacing-lg), var(--safe-area-top))`. El `app-header` ya lo respetaba.
- **Scroll de modales fullscreen**: el fix de `min-height:0` (sesión 4, en `global.css`) está verificado (scroll OK en preview). Si el usuario "sigue sin scroll" es porque la **PWA reinstalada trae la build publicada vieja → requiere DEPLOY**.
- `npm run build` OK.


## 2026-06-18 (sesión 4) — Navbar: badge + pill animado · fix scroll modal
- **Pill deslizante (iOS)**: el highlight activo de la navbar usa `framer-motion` `layoutId="bottom-nav-pill"` (`.bottom-nav__pill` absoluto detrás del contenido); anima entre KPIs/Candidatos. Respeta `prefers-reduced-motion` (`useReducedMotion`).
- **Badge (puntito) en el botón Menú**: `.bottom-nav__badge`. `BottomTabBar` lo calcula desacoplado leyendo `sessionStorage["reporteDiarioCache"]` → si el reporte tiene **incidencias del día de hoy** o **no está guardado en Supabase** (mes ausente en `fetchSummaries`). Recalcula al montar, al cambiar de ruta y con el evento `window 'reporte-diario:changed'` que dispara `index.tsx` cuando cambian `rows`/`savedSummaries`.
- **Fix scroll modales fullscreen móvil** (`global.css`): `.modal-content.modal-fullscreen-mobile > .modal-body` faltaba `min-height: 0` → el body crecía y se recortaba (clásico bug flex) en vez de hacer scroll. Afectaba p.ej. `WeeklyHiresModal`. Añadido `min-height:0` + `-webkit-overflow-scrolling:touch`. Aplica a todos los modales fullscreen.
- `npm run build` OK.


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

## KPIs Vacantes — fix de inconsistencia (jun 2026)
- Causa: la página mezclaba dos definiciones de "vacante". El KPI "Vacantes abiertas" usaba el faltante de plantilla (`calculatePositionCoverage` → 21), distinto del conteo de la lista de bajas sin cubrir (22).
- Decisión del usuario: "Vacantes abiertas" = conteo de la LISTA (bajas sin cubrir, `vacancies.filter(status==='abierta').length`), para que siempre cuadre con las tarjetas/tabla de abajo. "Cob. autorizada %" = Ocupados ÷ Plantilla autorizada (sin backups), ya implementado así.
- Cambio en `src/pages/Vacantes.tsx`: nuevo `vacantesAbiertas` memo desde `vacancies`; se quitó `vacantesAbiertas` del `summary` de cobertura. Build + `tsc --noEmit` limpios.

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

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

## Pendiente / Backlog
- P1: Verificación visual e2e por el usuario en local (este entorno no tiene `.env` de Supabase → app no carga datos aquí).
- P2: Extender patrón mobile-first al resto de modales (importers, report modals) si el usuario lo pide.
- P2: Revisión responsive de filtros (CandidateFilters, VacancyFilters).

## Notas técnicas
- Sin `.env` en este pod: `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` faltan (ver `.env.example`); login imposible aquí.
- Supervisor `frontend` espera `/app/frontend` (no existe); Vite se corre manualmente: `cd /app && yarn dev` (puerto 3000).
- Breakpoint móvil del sistema: 768px (`useIsMobile`, `useMediaQuery`).
- `tsc -b --noEmit` limpio tras todos los cambios.

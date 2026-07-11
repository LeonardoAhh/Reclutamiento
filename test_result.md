# Testing Protocol
- Frontend-only app (React + Vite + TS, Supabase backend externo). NO hay backend FastAPI local.
- El agente de testing NO debe editar código de la app; solo reportar.
- Este pod usa /app/.env con placeholders de Supabase (gitignored): la app arranca pero el login real no funciona aquí. Validación con datos la hace el usuario en Vercel.

## user_problem_statement
Bug reportado: en producción aparecen errores de consola "Error: <circle> attribute cy: Expected length, 'undefined'" y "Error: <circle> attribute r: Expected length, 'undefined'". Además, al expirar el JWT la app se queda "zombie" (no muestra datos y no redirige a login).

## Fixes aplicados (a verificar)
1. LoaderOverlay.tsx (CoreGraphic, visible en /login): las partículas ya no animan atributos cx/cy del <circle>; ahora animan transform x/y en un <motion.g>. Debe eliminar los errores de circle en consola.
2. KpiHeroChart.tsx: dot/activeDot de recharts ahora son render-functions con guard de coordenadas finitas (requiere sesión para verse; no verificable sin credenciales).
3. useAuth.tsx: revalidación de sesión en focus/visibilitychange/online → si el JWT expiró y no se puede refrescar, signOut local + toast → AuthGuard redirige a /login (no verificable sin credenciales reales).

## Instrucciones de test (frontend)
- Abrir http://localhost:3000/login, esperar ≥10s (las partículas del loader animan en loop), capturar consola.
- CRITERIO PRINCIPAL: cero errores "circle attribute ... Expected length".
- Verificar que la página de login renderiza correctamente (form usuario/contraseña visible).

backend:
  - task: "N/A - no hay backend local"
    implemented: false
    working: "NA"
    file: ""
    stuck_count: 0
    priority: "low"
    needs_retesting: false
    status_history: []

frontend:
  - task: "Fix errores consola <circle> cy/r undefined (CoreGraphic login)"
    implemented: true
    working: true
    file: "src/components/ui/LoaderOverlay.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Partículas ahora animan transform x/y en motion.g en vez de atributos cx/cy del circle."
      - working: true
        agent: "testing"
        comment: "✓ VERIFICADO: CERO errores de consola '<circle> attribute ... Expected length'. Test ejecutado en /login con 12s de animación continua de partículas. Formulario de login renderiza correctamente. Total: 0 errores, 0 warnings, 0 page errors. El fix es exitoso."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1

test_plan:
  current_focus: []
  stuck_tasks: []
  test_all: false

agent_communication:
  - agent: "main"
    message: "Verificar en /login que NO aparezcan errores 'circle attribute' en consola tras 10s de animación del loader. App corre en localhost:3000 (vite dev)."
  - agent: "testing"
    message: "✓ Fix verificado exitosamente. CERO errores de <circle> en consola tras 15s de prueba (12s animación + 3s interacción). Formulario de login renderiza correctamente. No se requieren más cambios para este bug."

## Incorporate User Feedback
- El usuario NO quiere pruebas largas ni exploratorias: verificación puntual del error de consola reportado.



## Tarea actual — auditoría `/features`
- Alcance: `/app/src/pages/Configuracion.tsx` y subpáginas Búsqueda, Documentos, Indicadores, Rutas, Tabulador y Toulouse.
- Implementado: navegación reutilizable; jerarquía semántica; tabs ARIA con teclado; targets táctiles de 48px; estilos visuales por tokens/clases; eliminación de estilos inline visuales y CSS muerto; mejoras mobile-first y estados accesibles.
- Validación local: `yarn tsc -b` y `yarn vite build` pasan.
- Prueba UI solicitada: revisar `/features` en 390px, 768px y 1440px; verificar menú móvil y cada subpágina, navegación por teclado, ausencia de overflow global y consola sin errores.
- Limitación de entorno: Supervisor es READONLY y apunta erróneamente a `/app/frontend` con `yarn start`; el proyecto está en `/app` y usa `yarn dev`. Si la preview no abre, reportar bloqueo de infraestructura sin editar configuración ni código.



## Bug actual — build de reporte diario
- Error reportado: `TS2552 Cannot find name 'getStatusTone'` en `reporte-area-summary.tsx:64`.
- Corrección: restaurado helper tipado `getStatusTone` y eliminado helper anterior incompatible.
- Verificación solicitada al agente: únicamente TypeScript/build; sin pruebas UI ni exploratorias.

  - task: "Fix TS2552 Cannot find name 'getStatusTone' en reporte-area-summary.tsx"
    implemented: true
    working: true
    file: "src/components/reporte-diario/reporte-area-summary.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Restaurado helper tipado getStatusTone en línea 29, usado correctamente en línea 52."
      - working: true
        agent: "testing"
        comment: "✓ VERIFICADO: TypeScript compilation (yarn tsc -b) PASS sin errores. Vite build PASS sin errores TS2552. La función getStatusTone está correctamente definida y el error de compilación ha sido resuelto."



## Bug Búsqueda — doble botón de limpiar
- Causa: control nativo de `input[type="search"]` + botón personalizado.
- Corrección: ocultar únicamente los controles WebKit nativos; conservar el botón accesible propio.
- Verificación: puntual, sin exploración adicional.



## Bug Sileo — contraste y consistencia en ambos temas
- Reporte del usuario: "revisar sileo, que funcione bien en ambos temas, sin bugs".
- Diagnóstico:
  - `--sileo-state-info` y `--sileo-state-action` estaban ligados a `--color-primary`, que cambia entre `#0075de` (light) y `#4ca3f4` (dark). La píldora de sileo se INVIERTE respecto al tema del contexto (fill `#1a1a1a` en light, `#f2f2f2` en dark), por lo que el badge/title del toast quedaba con contraste muy bajo (<3:1) en ambos temas.
  - Título por defecto (sin `data-state`) no tenía color explícito de inversión → podía heredar mal.
  - Botón de acción sin `focus-visible` (a11y).
- Corrección (`src/styles/sileo.css`):
  - Overrides scoped por `[data-sileo-viewport][data-theme='light'|'dark']` con paletas fijas de alto contraste (≥4.5:1) para success/error/warning/info/action en cada tema.
  - Color inverso explícito del título por defecto (`:not([data-state])`).
  - `focus-visible` outline para `[data-sileo-button]`.
  - Ancho móvil calc con fallback `var(--spacing-lg, 16px)`.
- Verificación solicitada: puntual, únicamente Sileo. Abrir `/login`, alternar tema (light ⇄ dark) desde el header/menú y disparar toasts desde consola:
    `sileo.success({ title: 'Guardado', description: 'Cambios aplicados' })`
    `sileo.error({ title: 'Error', description: 'Reintenta más tarde' })`
    `sileo.info({ title: 'Nueva versión', description: 'Actualiza para ver mejoras' })`
    `sileo.warning({ title: 'Cuidado', description: 'Revisa los datos' })`
    `sileo.action({ title: 'Deshacer', description: 'Se eliminó el registro', button: { label: 'Deshacer', onClick: () => {} } })`
  Criterios:
    1. En light: píldora oscura con textos e íconos legibles (colores brillantes).
    2. En dark: píldora clara con textos e íconos legibles (colores saturados oscuros).
    3. Sin errores en consola.
    4. Al cambiar de tema con toast visible, el `data-theme` del viewport se actualiza y los colores del toast también.

  - task: "Sileo: contraste y consistencia en light/dark"
    implemented: true
    working: "NA"
    file: "src/styles/sileo.css"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Overrides scoped por [data-sileo-viewport][data-theme] con paletas de alto contraste para cada estado en ambos temas. Focus-visible en botón de acción."

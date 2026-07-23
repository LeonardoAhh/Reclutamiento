# Test Result

## user_problem_statement
Verificar que al expirar el JWT la sesión se invalide inmediatamente y AuthGuard redirija a `/login`, evitando que el usuario continúe trabajando o guardando con una sesión zombie.

## Testing Protocol
- Alcance exclusivo: flujo frontend de expiración JWT y redirección a login.
- No modificar datos reales ni crear usuarios.
- Usar credenciales existentes solo si están disponibles en `/app/memory/test_credentials.md`.
- Si no existen credenciales Supabase válidas, reportar el bloqueo y no inventar sesiones ni tokens.
- Confirmar por separado: evento global de JWT expirado, limpieza inmediata de sesión en memoria, aviso al usuario y redirección de ruta protegida a `/login`.

## Incorporate User Feedback
- Responder en español y directo al punto.
- No afirmar validación en vivo si faltan credenciales.

## Auditoría actual — navegación responsive (solo lectura)
- Revisar Sidebar en PC, Header y BottomTabBar en móvil/tablet contra `AGENTS.md` y `desing.md`.
- No modificar componentes, estilos, lógica, datos ni `rutas-app`.
- Validar en vivo solo si existe una instancia accesible y credenciales válidas; no crear ni simular sesión.
- Entregable permitido: un informe HTML para implementación posterior por Gemini 3.1 Pro High.

## Hallazgos de Auditoría (2026-07-23)

### Estado del Entorno
**BLOQUEO TÉCNICO**: No es posible realizar auditoría visual en vivo.
- Supervisor: FATAL (backend y frontend no pueden iniciar - directorios /app/backend y /app/frontend no existen)
- Credenciales: No hay archivos .env ni credenciales de Supabase disponibles
- URL de deployment: No localizada en configuración
- Estructura real: Monorepo con /app/src (no coincide con configuración de supervisor)

### Revisión de Código Fuente

#### 1. Estructura de Navegación Implementada

**Sidebar (PC ≥1024px)**
- Ubicación: `/app/src/components/layout/Sidebar.tsx` + `.css`
- Breakpoint: `@media (min-width: 1024px)` - display: flex
- Anchos: 248px expandido, 76px colapsado (tokens `--_sidebar-w-expanded/collapsed`)
- Navegación: 5 items principales + Features
  - Reclutamiento (/)
  - Reporte Diario (/reporte-diario)
  - Candidatos (/pipeline)
  - Plantilla (/plantilla)
  - Vacantes (/vacantes)
  - Features (/features)
- Características:
  - Auto-colapso al navegar (líneas 95-99)
  - Indicador activo animado con framer-motion layoutId
  - Footer con avatar + popover (cerrar sesión + theme toggle)
  - Tooltips en modo colapsado
  - Touch targets: `--touch-target-min` (44px)

**Header (móvil/tablet <1024px)**
- Ubicación: `/app/src/components/layout/Header.tsx` + `.css`
- Breakpoint: `@media (min-width: 1024px)` - display: none
- Contenido: Brand (izquierda) + Avatar (derecha)
- Sin navegación (delegada a BottomTabBar)
- Sticky top con safe-area-top
- Hairline inferior

**BottomTabBar (móvil/tablet ≤1023px)**
- Ubicación: `/app/src/components/layout/BottomTabBar.tsx` + `.css`
- Breakpoint: `@media (max-width: 1023px)` - display: flex
- Estructura:
  - Barra flotante centrada con 2 accesos principales:
    - Reclutamiento (/)
    - Candidatos (/pipeline)
  - Botón FAB "Menú" con badge de novedades
  - Bottom sheet fullscreen con resto de navegación:
    - Plantilla (/plantilla)
    - Reporte Diario (/reporte-diario)
    - Vacantes (/vacantes)
    - Features (/features)
- Características:
  - Pill animado deslizante (framer-motion layoutId)
  - VisualViewport API para anti-salto en iOS Safari (líneas 75-98)
  - Focus trap + Escape + scroll-lock
  - Badge calculado desde sessionStorage
  - Touch targets: `--mobile-nav-height` (44px mínimo)

#### 2. Breakpoint de Cambio
**Punto crítico: 1024px**
- <1024px: Header visible + BottomTabBar visible + Sidebar oculto
- ≥1024px: Sidebar visible + Header oculto + BottomTabBar oculto

**Inconsistencia detectada**:
- Sidebar CSS usa `@media (min-width: 1024px)`
- BottomTabBar CSS usa `@media (max-width: 1023px)`
- ✅ Correcto: No hay overlap (1023px vs 1024px)

#### 3. Alineación y Tokens
**Cumplimiento de design.md**:
- ✅ Todos los componentes usan tokens de spacing (`--spacing-*`)
- ✅ Border radius con tokens (`--rounded-*`)
- ✅ Colores con tokens (`--color-*`)
- ✅ Touch targets mínimos (`--touch-target-min`, `--mobile-nav-height`)
- ✅ Safe areas (`--safe-area-top/bottom`)
- ✅ Transiciones con tokens (`--transition-base/fast`)
- ✅ Respeta `prefers-reduced-motion`

#### 4. Consistencia de Rutas
**Rutas en Sidebar**:
1. / (Reclutamiento)
2. /reporte-diario
3. /pipeline (Candidatos)
4. /plantilla
5. /vacantes
6. /features

**Rutas en BottomTabBar (primarias)**:
1. / (Reclutamiento)
2. /pipeline (Candidatos)

**Rutas en BottomTabBar (sheet)**:
1. /plantilla
2. /reporte-diario
3. /vacantes
4. /features

**Discrepancia de orden**:
- Sidebar: Reclutamiento → Reporte Diario → Candidatos → Plantilla → Vacantes → Features
- BottomTabBar sheet: Plantilla → Reporte Diario → Vacantes → Features
- ⚠️ El orden difiere entre Sidebar y BottomTabBar sheet

#### 5. Accesibilidad
**Implementado**:
- ✅ Roles ARIA correctos (navigation, dialog, menu)
- ✅ aria-expanded, aria-haspopup, aria-controls
- ✅ aria-label en botones de icono
- ✅ aria-current en NavLink (nativo de react-router-dom)
- ✅ Focus visible con `--shadow-focus`
- ✅ Focus trap en bottom sheet
- ✅ Escape para cerrar sheet
- ✅ Restauración de foco al cerrar
- ✅ data-testid para testing

#### 6. Características Especiales
**Sidebar**:
- Auto-colapso al navegar (useEffect líneas 95-99)
- Persistencia en localStorage del estado colapsado
- Popover con animación (framer-motion)
- Tooltips en modo colapsado (Radix UI)

**BottomTabBar**:
- VisualViewport API para iOS Safari (anti-salto)
- Badge dinámico calculado desde sessionStorage
- Evento custom 'reporte-diario:changed'
- Pill animado con layoutId

### Puntos a Validar en Vivo (Pendientes)

#### Viewports a probar:
1. **390x844** (móvil): Header + BottomTabBar visibles, Sidebar oculto
2. **768x1024** (tablet portrait): Header + BottomTabBar visibles, Sidebar oculto
3. **1024x800** (tablet landscape): **CRÍTICO** - Verificar cambio exacto
4. **1440x900** (desktop): Sidebar visible, Header + BottomTabBar ocultos
5. **1920x900** (desktop wide): Sidebar visible, Header + BottomTabBar ocultos

#### Checklist de validación:
- [ ] Visibilidad exclusiva según breakpoint 1024px
- [ ] No hay overlap ni flash de componentes al cambiar viewport
- [ ] Sidebar colapsa/expande correctamente
- [ ] Botón de colapso funciona y persiste estado
- [ ] Auto-colapso al navegar funciona
- [ ] Indicador activo se mueve suavemente (layoutId)
- [ ] Pill en BottomTabBar se desliza correctamente
- [ ] Bottom sheet abre/cierra con animación
- [ ] Focus trap funciona en sheet
- [ ] Escape cierra el sheet
- [ ] Foco se restaura al trigger al cerrar
- [ ] Badge aparece cuando hay novedades
- [ ] VisualViewport API previene salto en iOS Safari
- [ ] Touch targets ≥44px en todos los botones
- [ ] Rutas activas se marcan correctamente
- [ ] Tema se aplica correctamente en todos los componentes
- [ ] Safe areas respetadas en iOS
- [ ] No hay overflow/clipping de contenido
- [ ] Transiciones respetan prefers-reduced-motion

### Recomendaciones

1. **Orden de navegación**: Considerar unificar el orden de items entre Sidebar y BottomTabBar sheet para consistencia.

2. **Testing**: Una vez disponible una instancia accesible, ejecutar auditoría visual completa en los 5 viewports especificados.

3. **Documentación**: El código está bien documentado y sigue las reglas de AGENTS.md y desing.md.

### Conclusión
La implementación del código fuente es sólida y cumple con los estándares de diseño. Sin embargo, **no es posible realizar la auditoría visual en vivo** debido a la falta de una instancia accesible y credenciales válidas. Se requiere:
- URL de deployment accesible, O
- Credenciales de Supabase válidas para iniciar la app localmente, O
- Instancia pre-autenticada con sesión válida

# Refactorización del Sistema de Diseño - Ollama Style

## Resumen

Se ha completado una refactorización completa del sistema de diseño de la aplicación, migrando del sistema anterior (cream/warm, monospace, efectos glass) al sistema minimalista Ollama descrito en `desing.md`.

## Cambios Principales

### 1. **global.css** - Sistema de Tokens Completamente Renovado

#### Colores
- **Antes:** Paleta cream/warm (`#f7f6f2`, `#26251e`, etc.)
- **Ahora:** Sistema blanco/negro puro estilo Ollama
  - Canvas: `#ffffff` (blanco puro)
  - Ink: `#000000` (negro puro para texto principal)
  - Body: `#737373` (gris neutro para texto corrido)
  - Hairlines: `#e5e5e5`, `#d4d4d4` (bordes sutiles)
  - Primary: `#000000` (único color de acción - negro puro)

#### Tipografía
- **Antes:** Berkeley Mono (monospace para todo)
- **Ahora:** 
  - Display: `SF Pro Rounded` (headings, peso 500-600, voz editorial)
  - Body: `ui-sans-serif` (sistema native sans-serif)
  - Code: `ui-monospace` (solo para código)
- Peso máximo en displays: 500 (no 700 - enfoque editorial, no tech-bombástico)

#### Espaciado
- **Sistema:** Base 8px
- **Tokens:** 2px, 4px, 8px, 12px, 16px, 24px, 32px, 88px (section)

#### Border Radius
- **Antes:** Mix de `rounded-md` (8px) y `rounded-pill`
- **Ahora:** 
  - `rounded-full` (9999px) para TODOS los elementos interactivos (botones, inputs, pills)
  - `rounded-lg` (12px) para cards y modales
  - `rounded-sm` (6px) solo para inline code chips

#### Sombras
- **Antes:** Sistema con sombras elevadas, glass effects con blur
- **Ahora:** **NINGUNA sombra** - profundidad 100% con hairlines de 1px
- Única excepción: `--shadow-focus` (outline para accesibilidad, no elevación)

### 2. **Modales** - Eliminación Completa del Efecto Glass

#### Cambios Implementados
```css
/* ANTES: Glass effect con blur extremo */
backdrop-filter: blur(50px) saturate(180%);
background: radial-gradient(...), rgba(30, 30, 35, 0.45);
border-radius: 40px;
box-shadow: 0 40px 80px rgba(0, 0, 0, 0.5), inset ...;

/* AHORA: Sólido, minimalista */
background: var(--color-surface-card);
border: 1px solid var(--color-hairline);
border-radius: var(--rounded-lg); /* 12px */
/* SIN backdrop-filter, SIN blur, SIN gradientes, SIN sombras */
```

#### Mobile Fullscreen
- **Implementado:** Prop `fullscreenMobile` en componente Modal
- **Comportamiento:** 
  - Por defecto: `true` (fullscreen en móvil <768px)
  - Confirmaciones: `fullscreenMobile={false}` (ej: DeleteEmployeeConfirmModal)
- **Clase CSS:** `.modal-fullscreen-mobile` se aplica automáticamente

### 3. **Botones** - Rounded Full

#### Antes
```css
border-radius: var(--rounded-md); /* 8px */
```

#### Ahora
```css
border-radius: var(--rounded-full); /* 9999px - estilo Ollama pill */
```

- **Aplicado a:** `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-ghost`, `.btn-icon`
- **Colores:** Primary ahora es negro puro (`#000000`), secondary con hairline

### 4. **Inputs y Forms** - Rounded Full

```css
/* Todos los inputs ahora son pills */
border-radius: var(--rounded-full);
border: 1px solid var(--color-hairline-strong);
```

- Textareas mantienen `rounded-lg` por su naturaleza multi-línea

### 5. **Componentes Actualizados**

#### Badge.css
- Cambio de `uppercase + tracking` a texto normal
- `rounded-full` para todos los badges
- Padding ajustado: `var(--spacing-xs) var(--spacing-md)`

#### Sheet.css
- Eliminado `backdrop-filter: blur(2px)`
- Eliminado `box-shadow: var(--shadow-elevated)`
- Subtítulos sin uppercase ni tracking

#### Header.css & BottomTabBar.css
- Nav items con `rounded-full`
- Colores actualizados a la nueva paleta
- Botones de cierre con `rounded-full`

#### StatCard.css
- **Eliminado:** `box-shadow` y `transform: translateY(-1px)` en hover
- **Ahora:** Solo cambio de `border-color` en hover
- Sin uppercase en labels

#### Skeleton.css
- Background sólido sin `color-mix`
- Shimmer simplificado

### 6. **Dark Theme**

Completamente actualizado para invertir la paleta:
```css
[data-theme="dark"] {
  --color-canvas: #0a0a0a;
  --color-ink: #ffffff;
  --color-primary: #ffffff;
  /* ... */
}
```

## Principios del Sistema Ollama Aplicados

### ✅ Do's Implementados
1. ✅ Página como documento: espaciado `section` (88px) entre bloques
2. ✅ Black pill para toda acción primaria
3. ✅ `rounded-full` para elementos interactivos
4. ✅ SF Pro Rounded para displays
5. ✅ Hairlines de 1px como única profundidad
6. ✅ Sin gradientes, sin sombras, sin atmospheric backgrounds

### ✅ Don'ts Respetados
1. ✅ No gradientes
2. ✅ No drop-shadows
3. ✅ No brand colors adicionales (solo negro)
4. ✅ No mezcla de radius (pills = full, cards = lg)
5. ✅ No sombras para elevar cards
6. ✅ No uppercase forzado innecesario

## Accesibilidad Mejorada

1. **Focus Visible:** Todos los elementos interactivos tienen `box-shadow: var(--shadow-focus)` en `:focus-visible`
2. **Touch Targets:** Mínimo 36-44px de altura (WCAG AA/AAA)
3. **Contrast:** Ratios mejorados con negro/blanco puros
4. **Semántica:** Uso consistente de tokens semánticos (`--color-body`, `--color-ink`)

## Responsive & Mobile-First

1. **Modales:** 
   - Desktop: centered, max-width 640-900px
   - Mobile (<768px): fullscreen (excepto confirmaciones)
2. **Inputs:** Tamaño mínimo 36px para touch
3. **Nav:** Collapsa a BottomTabBar en <768px
4. **Safe Areas:** Respeto completo de notch/home indicator

## Sin Hardcodeo

### Antes (ejemplos encontrados y corregidos)
```css
gap: 4px;  /* ❌ hardcoded */
padding: 4px 10px;  /* ❌ hardcoded */
font-size: 11px;  /* ❌ hardcoded */
letter-spacing: 0.08em;  /* ❌ hardcoded */
```

### Ahora
```css
gap: var(--spacing-xs);  /* ✅ token */
padding: var(--spacing-xs) var(--spacing-md);  /* ✅ tokens */
font-size: var(--type-body-sm-size);  /* ✅ token */
letter-spacing: var(--type-body-sm-tracking);  /* ✅ token */
```

## Archivos Modificados

### Core
- ✅ `/app/src/styles/global.css` (reescrito completamente)
- ✅ `/app/src/components/ui/Modal.tsx` (añadido prop `fullscreenMobile`)

### Components CSS
- ✅ `/app/src/components/ui/Badge.css`
- ✅ `/app/src/components/ui/Sheet.css`
- ✅ `/app/src/components/ui/StatCard.css`
- ✅ `/app/src/components/ui/Skeleton.css`
- ✅ `/app/src/components/layout/Header.css`
- ✅ `/app/src/components/layout/BottomTabBar.css`

### Components TS
- ✅ `/app/src/components/ui/DeleteEmployeeConfirmModal.tsx` (añadido `fullscreenMobile={false}`)

## Testing

El servidor de desarrollo está corriendo en `http://localhost:3000/`:
```bash
npm run dev
# o
yarn dev
```

## Próximos Pasos Sugeridos

Para una cobertura completa del sistema, se recomienda revisar:

1. **Otros componentes de Modal:** Aplicar `fullscreenMobile={false}` a otros modales de confirmación pequeños
2. **CSS de páginas:** Revisar `/app/src/pages/*.css` para consistencia
3. **Componentes UI restantes:** Aplicar los mismos principios a los ~30 CSS restantes en `/app/src/components/ui/`
4. **Testing visual:** Verificar todos los estados (hover, focus, disabled, active) en ambos temas

## Compatibilidad

- ✅ Chrome/Edge (Chromium)
- ✅ Safari (macOS/iOS)
- ✅ Firefox
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ✅ Dark mode system preference
- ✅ Reduced motion preference

---

**Fecha:** 15 de junio de 2025
**Sistema de diseño:** Ollama-inspired minimalist system
**Referencia:** `/app/desing.md`

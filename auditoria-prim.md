# Auditoría de primitivas UI — `src/components/ui` + primitivas de `global.css`

> Referencias: `AGENTS.md` (§7 tokens, §9 tipografía, §10 espaciado/radios, §13 accesibilidad, §14 reutilización, §15 arquitectura) y `desing.md`.
> Método: revisión estática de TSX y CSS, más cálculo de contraste WCAG con los valores reales de los tokens.
> Severidad: 🔴 Crítico · 🟠 Alto · 🟡 Medio · ⚪ Bajo

---

## 0. Lo más importante

1. 🔴 **Los estados hover y highlight no se ven.** En la paleta Original, `--color-surface-soft` es el mismo color que `--color-surface` y `--color-canvas` (claro: todo `#fff`; oscuro: `#262626`). Afecta a DropdownMenu, CustomSelect, Sheet, SearchField, Calendar, ExpandableSection, ButtonUtility, Tabs y Badge.
2. 🔴 **Botones de icono y botones de cierre circulares**, cuando la especificación pide 10px para todos los botones.
3. 🔴 **Contraste insuficiente en el tooltip de tendencias**: `.trend-tooltip__title--danger` da 1.98:1 en tema claro.
4. 🔴 **`ExpandableSection` tiene una `transition` inválida**: el navegador la descarta y la sección pierde su animación.
5. 🔴 **`CoverageBar` tiene una animación infinita sin `prefers-reduced-motion`**, además de valores literales y ninguna semántica de progreso.
6. 🟠 **Hay dos escalas de espaciado con los mismos nombres y valores distintos.** Por ejemplo, `--spacing-sm` vale 8px y `--design-spacing-sm` vale 12px.
7. 🟠 **Hay componentes de feature dentro de `components/ui`**, e incluso el nombre de una persona dentro del CSS de una primitiva.
8. 🟠 **27 componentes de `components/ui` no tienen ningún import detectado.**

---

## 1. Problemas que afectan a varias primitivas

### S1 🔴 `--color-surface-soft` es igual al fondo, así que los estados no se distinguen
- Origen: `global.css:44-47` (claro, todo resuelve a `#fff`) y `global.css:705-707` (oscuro, todo resuelve a `#262626`).
- Las demás paletas tampoco lo separan lo suficiente (por ejemplo, `#fcfcfc` frente a `#fff`).
- Dónde se usa como hover o highlight:
  - `DropdownMenu.css:21,119`
  - `CustomSelect.css:75,174`
  - `Sheet.css:144`
  - `SearchField.css:59,91`
  - `ButtonUtility.css:26`
  - `Calendar.css:66`
  - `ExpandableSection.css:34,78`
  - `StatCard.css:19`
- Dónde se usa como fondo de contenedor:
  - `Tabs.css:22`: el riel del segmented no se ve.
  - `Badge.css:11,30`: el badge neutral regular queda sin borde visible.
  - `Avatar.css:11`
- En total son 115 usos en todo el repositorio.
- Recomendación: para estados interactivos usa `--color-surface-hover`, como ya hacen los botones (`global.css:1904`). Después dale a `surface-soft` un valor propio o elimínalo.

### S2 🟠 El color de texto en hover no cambia, porque `--color-body` es igual a `--color-ink`
- Casos:
  - `Tabs.css:58 → 80`
  - `DropdownMenu.css:10 → 22`
  - `DropdownMenu.css:101 → 120`
- Sumado a S1, el trigger y los items de DropdownMenu **no muestran ningún cambio visual** al pasar el puntero en la paleta Original.

### S3 🔴 Controles circulares que deberían tener 10px de radio
- La especificación lo dice en `desing.md:9`, `:17`, `:220` y `:292`: todos los botones, incluidos los de icono, llevan 10px.
- Casos:
  - `global.css:1990` `.btn-icon`
  - `global.css:2018` `.step-nav-control`
  - `global.css:2362` `.modal-close` y `.modal-back-btn`
  - `Sheet.css:132` `.sheet-close`
- `global.css:2053` `.btn-icon__count` es un badge, así que debería usar `--rounded-xs` (4px).
- Revisa además fuera de las primitivas: `TeamManagement.css:27`, `SidebarQuickActions.css:37`, `CandidateGroupTabs.css:48`.
- Excepciones legítimas que no hay que cambiar:
  - Avatar.
  - Status dots.
  - El círculo del icono de éxito en AppToaster (documentado en `desing.md:236`).
  - El scrollbar.

### S4 🟠 Dos escalas de espaciado con el mismo nombre y distinto valor (§7.4)
| Token | Escala legacy (px) | Escala `--design-spacing-*` (rem) |
|---|---|---|
| `xs` | 4px | 8px |
| `sm` | 8px | 12px |
| `md` | 12px | 16px |

- Definiciones: `global.css:381-387` y `global.css:394-403`.
- Primitivas que mezclan las dos escalas:
  - FormWizard (12 usos legacy)
  - ExpandableSection (6)
  - BirthDateField (5)
  - KpiCard (3)
  - Popover, SearchField, StatCard (2 cada una)
  - ButtonUtility, CoverageBar, AnimatedSubmitButton (1 cada una)
- Recomendación: migrar a `--design-spacing-*` y eliminar la escala legacy.

### S5 🟡 Cada superficie flotante usa un token de fondo distinto
- Popover usa `--color-surface`.
- DropdownMenu usa `--color-canvas-elevated`.
- CustomSelect usa `--color-surface`.
- HoverCard usa `--color-surface-card`.
- Sheet usa `--color-canvas-elevated`.
- Recomendación: un único token semántico, por ejemplo `--color-floating-surface`.

### S6 🟡 La animación de entrada no tiene la misma duración en todos los menús
- CustomSelect y Tooltip usan `--transition-fast` (150ms).
- DropdownMenu y Popover usan `--transition-base` (250ms).
- Además, DropdownMenu y Popover dejan `will-change` activo de forma permanente (`DropdownMenu.css:52`, `Popover.css:15`).

### S7 🟡 Los estados inválido, deshabilitado y placeholder no coinciden entre campos
| Estado | `.form-group` | CustomSelect y SearchField |
|---|---|---|
| Inválido (borde) | `--color-error` (`global.css:1740`) | `--color-error-text` |
| Deshabilitado (fondo) | `surface-soft` | CustomSelect usa `canvas-soft` |
| Placeholder | `--color-faint` | SearchField usa `--color-muted` |

- Hay además dos formas de marcar el error para lo mismo: la clase `.input-error` y `.input-success` (`global.css:1785-1793`) y el atributo `[aria-invalid]`. Conviene dejar solo `aria-invalid`.

### S8 🟡 Roles tipográficos incompletos o mezclados
`desing.md:140` exige roles completos (tamaño, peso, line-height y tracking del mismo rol). Casos que lo incumplen:
- `CustomSelect.css:184`: aplica el peso de `body-strong` sobre `body-md`.
- `Tooltip.css:125-126`: usa solo una parte de `label-sm`.
- `CoverageBar.css:11-12`: tamaño de rol con peso literal 600.
- `StatCard.css:28-31` y `:53-55`: faltan line-height y tracking.
- `Avatar.css:15-17`: usa `--font-bold` con un tamaño de feature, sin line-height ni tracking.
- `KpiCard.css:101-102`.

### S9 🟡 Textos sin traducir dentro de las primitivas
- `SearchField.tsx:29`: `'Limpiar búsqueda'` está fijo en español.
- `Badge.tsx:82-177`: "Plantilla", "Backup", "Incapacidad", "Próximo ingreso", "Proceso", "Ingreso" y "Sin proceso" están fijos y no usan `useLanguage`.
- `CustomSelect.tsx:61,145`, `Modal.tsx:56` y `Sheet.tsx:53`: cada uno resuelve el idioma con un ternario `language === 'en' ? …` propio. "Cerrar/Close" aparece duplicado en Modal y Sheet.
- Recomendación: un diccionario compartido de textos de UI.

### S10 🟠 Código de feature dentro de primitivas (§14.2 lo prohíbe; §15 prohíbe selectores globales que no sean de primitiva)
- **`Badge.css:169` `.reclutador-badge--person-daniela`**: el nombre de una persona dentro del CSS de una primitiva.
- `Badge.css:71-85`: estados de dominio (`pending`, `in_progress`, `new`, `completed`) definidos en la primitiva.
- `Tooltip.css:108-167`: `.trend-tooltip`, específico de una feature.
- `SearchField.css:28`: acopla la primitiva al layout del header (`.app-header__title:has(...)`).
- `global.css:1764-1783`: `.phone-input-wrapper` y `.phone-validation-icon`, específicos de un campo de teléfono.
- Componentes de dominio que viven en `components/ui`: CandidateModal, VacancyModal, EmployeeSheet, RequisicionSheet, TurnosUpdater, BajasImporter, CandidateAccessCard, RecruitmentHero, ReclutadorBadge, VacanteCard, WeeklyHiresModal, PurgeEmployeesModal, entre otros. Deberían moverse a su feature.

### S11 🟠 Componentes sin consumidor (§14.2 exige al menos un consumidor real; §40 prohíbe código muerto)
No encontré ningún import estático de estos componentes:

AnimatedIcons, AssignVacancyModal, CandidateNotesModal, CommentModal, **CoverageBar**, CreateSupportModal, CubrirVacanteSheet, DeleteEmployeeConfirmModal, EmployeeSheet, **HoverCard**, JsonImporter, KpiHeroChart, KpiReveal, **LightboxModal**, NoCitadoRowActions, **PageLoader**, PurgeEmployeesModal, RecruitmentHero, ReferenceAttachment, **Reveal**, **StatCard**, SupportSection, VacancyModal, VacancySheet, VacancyStatusBadge, VacancyTypeBadge, VacanteCard.

> ⚠️ Antes de borrar nada, confírmalo con una búsqueda global en VS Code: podría haber imports dinámicos.

### S12 🟠 Superficies invertidas sin remapear tokens
- El tooltip solo remapea `--color-body-strong` (`Tooltip.css:31`).
- `.card--dark`, en cambio, también remapea foco, link y `primary-text` (`global.css:2088-2092`).
- Consecuencia en tema claro: contenido con `--color-muted` dentro de un tooltip da 2.37:1, y con `--color-primary-text` da 2.06:1. Ambos fallan.
- `.stat-card--dark` no remapea nada.
- Recomendación: un único scope `.surface-inverted` que reutilicen las tres.

### S13 🟠 Problemas de contraste que dependen de la paleta
- **Toggle activado** (fondo primary, sin borde, `global.css:2749`): Supabase claro 1.54:1 y Supabase oscuro 2.5:1. WCAG 1.4.11 pide al menos 3:1.
- El tab segmented activo y los extremos del rango en Calendar usan el mismo relleno primary y heredan el mismo problema.
- El Checkbox sí cumple, porque usa `--color-primary-border`.
- En Chemp, Claude-Amber y Supabase, `--color-focus` es el color primary con offset 0. Sobre un botón primario, el anillo de foco se confunde con el propio botón.

### S14 🟡 Hover sin `@media (hover: hover)`
- En pantallas táctiles el hover se queda "pegado" después de tocar.
- Es especialmente visible en el `translateY` de KpiCard y en StatCard.

### S15 🟡 Propiedades físicas en lugar de lógicas (no se adaptan a RTL)
- `CustomSelect.css:41`
- `ExpandableSection.css:29,84-85`
- `KpiCard.css:21`
- `CoverageBar.css:15`
- `FormWizard.css:72-73,121-123`
- `FormWizard.css:85`: `translateX(8px)` literal, además sin soporte RTL.
- Toggle: `global.css:2753`.

---

## 2. Revisión por primitiva

### Botones (`global.css:1828-2063`)
**Lo que está bien:** todo con tokens, altura mínima de 44px, estado disabled, escala al presionar y cursores correctos.

**Problemas:**
- 🔴 `.btn-icon` es circular (ver S3). Según la especificación (`desing.md:292`), además debería usar fondo `canvas-elevated`.
- 🟠 La especificación no coincide con la implementación:
  - `desing.md:280` y `:286` describen secondary y ghost-sm con `rounded.md` (12px) y ghost con fondo y borde.
  - La implementación usa 10px y el ghost es transparente y sin borde (`1939-1943`).
  - La propia especificación se contradice: en `:9` y `:220` dice "todos 10px". Decide un criterio y actualiza el documento.
- 🟡 El hover de `.btn-danger` solo añade sombra (`1929-1931`), distinto al resto de botones.
- 🟡 No existe un estado `loading` común (§14.2). Solo lo tiene AnimatedSubmitButton.
- 🟡 No hay un componente `<Button variant size>`: las clases se concatenan como strings, y `ButtonUtility` duplica `.btn-secondary`.

### Campos de formulario (`global.css:1668-1820`)
**Lo que está bien:** labels, `aria-invalid`, tamaño mínimo de fuente para iOS y delegación del foco.

**Problemas:**
- 🟠 La especificación de `text-input` (`desing.md:302`) pide `rounded.md` (12px) y `canvas-elevated`. La implementación usa `--radius-field` (10px). El documento choca con su propia línea `:211`.
- 🟡 Doble forma de marcar el error: `.input-error` y `aria-invalid` (ver S7).
- 🟡 Selectores de teléfono dentro de `global.css` (ver S10).
- ⚪ El estado disabled se atenúa dos veces: con opacidad y con color `muted`.

### Toggle switch (`global.css:2697-2767`)
**Lo que está bien:** área táctil de 44px, foco delegado, riel apagado con `control-border` y soporte de `forced-colors`.

**Problemas:**
- 🟠 Contraste en las paletas Supabase (ver S13).
- 🟡 El texto usa `--color-foreground`, otro alias más de `body`.
- 🟡 La transición del thumb no se desactiva con `prefers-reduced-motion`.
- 🟡 El `translateX` no se adapta a RTL.

### Checkbox
**Lo que está bien:** área táctil de 44px, indicador de 4px y estado checked con tokens.

**Problemas:**
- 🟡 Usa el icono `CircleCheckBig` (un check dentro de un círculo) dentro de un cuadro de 4px. Encaja mejor `Check`.
- 🟡 Faltan los estados indeterminate, hover e inválido (§14.2).
- ⚪ `border-radius: --rounded-md` en el input invisible no tiene efecto.
- ⚪ La interfaz `CheckboxProps` está vacía.

### CustomSelect
**Lo que está bien:** Radix, ARIA reenviado al trigger, foco interno visible y `prefers-reduced-motion`.

**Problemas:**
- 🟠 El hover del trigger y el highlight de las opciones no se ven (ver S1).
- 🟡 Usa 3 `!important` y `margin-right` físico para compensar el scroll-lock (`8-19`).
- 🟡 Media queries con sintaxis de rango (`width >= 768px`), mientras que el resto del proyecto usa `min-width`.
- 🟡 `export interface Option` tapa el constructor global `Option` del DOM. Renómbrala, por ejemplo, a `SelectOption`.
- 🟡 `CustomSelectProps` no se exporta (§14.2).
- 🟡 Mezcla los paquetes `lucide` y `lucide-react`.
- 🟡 El atributo `title` en el trigger no es una forma accesible de mostrar una ayuda.

### Tabs
**Lo que está bien:** Radix con el patrón ARIA completo, `forced-colors` y foco visible.

**Problemas:**
- 🟠 El hover no se nota (ver S2), y el riel del segmented no se ve (ver S1).
- 🟡 El tab segmented activo usa relleno primary sólido. `desing.md:266` reserva el primary sólido para acciones principales.
- ⚪ El indicador del variant underline mide 1px: poca presencia visual.

### DropdownMenu
**Lo que está bien:** variante destructiva con `error-tint`, label con `caption-up` y `prefers-reduced-motion`.

**Problemas:**
- 🔴 En la paleta Original el hover y el highlight no producen ningún cambio visual (S1 + S2).
- 🟡 El borde de hover usa `--color-hairline-soft`, que da 1.24:1 sobre blanco.
- 🟡 Duración de animación y `will-change` (ver S6).

### Popover
- 🟡 Mezcla las dos escalas de espaciado (`11`, `27`).
- 🟡 `PopoverTitle` siempre renderiza un `<h2>`, cuando el nivel de encabezado debería depender del contexto.
- 🟡 Fondo y `will-change` (ver S5 y S6).

### Tooltip
**Lo que está bien:** Radix, ancho máximo con token, `prefers-reduced-motion` y contraste de la superficie documentado.

**Problemas:**
- 🔴 `.trend-tooltip__title--danger` usa `--color-warning-text`: 1.98:1 en tema claro (`139-141`). Además, un estado "danger" está pintado con el color de "warning".
- 🟠 Falta el remapeo de tokens de superficie invertida (ver S12).
- 🟠 `Badge.tsx:66-78`: el badge solo-icono envuelve un `<span>` no enfocable en el Tooltip, así que con teclado nunca se abre.

### SearchField
**Lo que está bien:** label `sr-only`, foco delegado al contenedor y tamaño mínimo de fuente para iOS.

**Problemas:**
- 🟡 Texto fijo (ver S9) y escala de espaciado legacy (`40`, `71`).
- 🟡 El botón de borrar usa `--rounded-md` (12px) dentro de un campo de 10px (`48-49`). Las esquinas no coinciden.
- 🟡 Acoplamiento al header (`28`) y `SearchFieldProps` no se exporta.

### Sheet / FormSheet
**Lo que está bien:** RTL, safe areas, tamaños `xs`–`xl`, `prefers-reduced-motion` y variantes edge y floating.

**Problemas:**
- 🔴 El botón de cierre es circular (ver S3) y su hover no se ve (ver S1).
- 🟡 La descripción usa `--color-body` (es decir, el mismo color que `ink`), mientras que Popover usa `muted`. La jerarquía no es igual en todos los overlays.

### Modal (`global.css:2110+`)
**Lo que está bien:** API con variantes explícitas (`size`, `placement`, `presentation`) y Radix.

**Problemas:**
- 🔴 Los botones de cierre y de volver son circulares (ver S3).

### Pagination
**Lo que está bien:** posición sticky con token de capa y safe area.

**Problemas:**
- 🟡 El input de página no tiene estados hover, inválido ni disabled.
- 🟡 Su fondo es `canvas-elevated`, distinto al resto de campos.

### Badge
**Problemas:**
- 🟠 La variante regular usa padding `xxs sm` (`8`); la especificación pide `xxs xs` (`desing.md:295`).
- 🟠 La variante regular tiene borde transparente (`9`); la especificación pide 1px hairline. Junto con S1, el badge neutral no tiene ningún límite visible.
- 🟡 Las variantes heredadas `default`, `coral`, `teal` y `amber` se mapean a tonos que no corresponden a su nombre (`Badge.tsx:12-15`, `33-36`). Por ejemplo, `coral` da un badge neutral.
- 🟡 El tamaño del status dot reutiliza un token de espaciado (`117`, `137`). Mejor un token propio, como `--status-dot-size`.
- 🟡 Estados de dominio y el nombre de una persona en el CSS (ver S10); textos fijos (ver S9).

### Avatar
- 🟡 Rol tipográfico incompleto (ver S8).

### ButtonUtility
- 🟠 Es una primitiva paralela a `.btn-secondary` (§14.2 lo prohíbe).
- 🟠 **No pone `type="button"` por defecto** (`ButtonUtility.tsx:16`). Dentro de un formulario, al pulsarlo se envía el formulario sin querer.
- 🟡 El comentario JSDoc está desactualizado (`10-13`: dice "8px, 4px 14px").
- 🟡 Le faltan los estados disabled y focus, y el hover añade sombra.

### CoverageBar *(sin consumidor)*
- 🔴 Tiene un shimmer infinito sin `prefers-reduced-motion` (`45`) y una transición de 2000ms escrita con valor literal (`29`).
- 🟠 Valores literales: `font-weight: 600` (`12`), `42px` (`14`) y `text-align: right` (`15`).
- 🟠 En el TSX, la altura llega como `height=8` en px por inline style, y `color` acepta cualquier string.
- 🟠 No tiene `role="progressbar"` (o `<meter>`) ni `aria-value*`.
- 🟡 Anima `width`, que fuerza recálculo de layout, en lugar de `transform`.

### StatCard *(sin consumidor)*
- 🟡 La prop `accentColor` y la variable `--stat-accent` no se usan en el CSS (`StatCard.tsx:17,24`).
- 🟡 La variante `cream` no tiene CSS.
- 🟡 `1px` y `line-height: 1.3` escritos con valor literal.
- 🟡 Tiene hover aunque no es interactiva.
- 🟡 Duplica a KpiCard.

### KpiCard
- 🟠 Mete `<div>` y `<p>` dentro de un `<button>`, lo cual es HTML inválido (`KpiCard.tsx:30-44`). Además duplica el mismo markup en las dos ramas del componente.
- 🟠 El hover con `translateY(-2px)` se aplica también al `<article>` no interactivo (`KpiCard.css:15-18`). No respeta `prefers-reduced-motion`.
- 🟠 Usa sombra, pero el comentario de `global.css:2067` define las cards "sin sombra". Además `--shadow-md` es igual a `--shadow-sm`, así que en hover la sombra no cambia.
- 🟡 El `data-testid` se repite entre tarjetas con el mismo tono.

### ExpandableSection
- 🔴 `transition: grid-template-rows var(--transition-base) ease` (`61`) es inválida, porque el token ya incluye un easing. El navegador descarta la declaración y no hay animación.
- 🟡 Bordes con propiedades físicas, `1px` literal y hover que no se ve (ver S1).

### Calendar
- 🟡 Los extremos del rango seleccionado son circulares (`118`). Confirma si es intencional; la especificación no lo menciona.
- 🟡 El hover no se ve (ver S1).

### FormWizard
- 🟡 `translateX(8px)` literal y sin soporte RTL (`85`).
- 🟡 Paddings con propiedades físicas.
- 🟡 12 usos de la escala de espaciado legacy.

### LoadingSkeleton / BoneyardSkeleton
- 🟡 Easing `ease-in-out` escrito con valor literal.
- 🟡 El bloque usa `hairline` al 40% de opacidad sobre blanco: en tema claro prácticamente no se ve.

### HoverCard *(sin consumidor)*
- 🟡 Fondo `surface-card` (ver S5).

### BirthDateField
- 🟡 `calc(100vw - …)` (`18`): `100vw` incluye el ancho del scrollbar y puede provocar desbordamiento.

### AppToaster
**Lo que está bien:** `forced-colors`, `prefers-reduced-motion` y el círculo de éxito documentado en la especificación.

---

## 3. Correcciones a las fases anteriores
- **Fase 2, apartado B: retiro el hallazgo.** `#B6B6B6` sobre `#404040` da **5.11:1**, así que cumple AA. Mi estimación anterior (~3:1) era incorrecta.
- **Fases 2 y 3:** LightboxModal, ReferenceAttachment, VacancyModal y HoverCard **no tienen consumidor**. Lo que dije de ellos solo importa si decides conservarlos.

---

## 4. Orden sugerido de corrección
- [ ] 1. S1: cambiar hover y highlight a `--color-surface-hover`. Resuelve de golpe DropdownMenu, CustomSelect, Sheet, Calendar, SearchField y Tabs.
- [ ] 2. S3: botones de icono y cierre a `--radius-control`; `.btn-icon__count` a `--rounded-xs`.
- [ ] 3. Arreglar el contraste de `.trend-tooltip__title--danger` y crear el scope `.surface-inverted` (S12).
- [ ] 4. Arreglar la `transition` de ExpandableSection y añadir `prefers-reduced-motion` a CoverageBar, al toggle y a KpiCard.
- [ ] 5. Poner `type="button"` por defecto en ButtonUtility, o eliminarlo y usar `.btn-secondary`.
- [ ] 6. KpiCard: sustituir `<div>`/`<p>` por `<span>` dentro del botón y aplicar el hover solo a la variante interactiva.
- [ ] 7. S13: añadir borde o ajustar el primary en las paletas Supabase para toggle, tab segmented y Calendar; revisar el anillo de foco cuando `focus` es igual a primary.
- [ ] 8. S4: unificar el espaciado en `--design-spacing-*` y eliminar la escala legacy.
- [ ] 9. Badge: alinear padding y borde con la especificación, quitar las variantes heredadas, los estados de dominio y la clase con el nombre de una persona.
- [ ] 10. S7 y S8: unificar los estados de los campos y completar los roles tipográficos.
- [ ] 11. S9: diccionario compartido de textos de UI.
- [ ] 12. S10 y S11: mover los componentes de feature fuera de `components/ui` y borrar los que no tienen consumidor (después de confirmarlo).
- [ ] 13. Resolver las contradicciones de `desing.md` (radios de secondary, ghost y text-input) y actualizar el documento.
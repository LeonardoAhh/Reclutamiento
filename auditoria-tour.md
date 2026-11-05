# Auditoría — Primitiva `ProductTour` (Tour de producto)

**Archivos revisados**
- `src/components/ui/ProductTour.tsx` (lógica)
- `src/components/ui/ProductTourPopover.tsx` (tarjeta)
- `src/components/ui/ProductTourOverlay.tsx` (fondo oscurecido y anillo)
- `src/components/ui/ProductTour.css`
- `src/features/onboarding/productTourUtils.ts` · `productTourSteps.ts` · `useProductTourKeyboard.ts`

**Leyenda:** 🔴 Crítico · 🟠 Alto · 🟡 Medio · ⚪ Bajo

**Términos usados**
- **Scrim:** la capa oscura que cubre la pantalla. Tiene un **hueco** sobre el elemento que se está señalando.
- **Spotlight:** el anillo de color alrededor del elemento señalado.
- **Popover:** la tarjeta del Tour (título, texto, contador y botones).

---

## 0. Resumen

| # | Problema | Captura | Severidad |
|---|---|---|---|
| F1 | El hueco del scrim y el anillo se dibujan con medidas distintas: se ve una franja oscura entre el elemento y el anillo | 1, 2, 3 | 🔴 |
| F2 | Las esquinas del hueco son curvas Bézier y no coinciden con el `border-radius` del elemento | 1, 3 | 🟠 |
| F3 | El menú de cuenta queda por encima del scrim y se ve entero sin oscurecer, aunque solo se señala "My profile" | 2 | 🔴 |
| F4 | Se dibujan dos anillos a la vez (el foco del elemento y el spotlight) | 2, 3 | 🟠 |
| F5 | El elemento se mide mientras el menú todavía se está animando, así que la posición queda desfasada | 2 | 🟠 |
| F6 | La flecha de la tarjeta toca el anillo, porque usan la misma separación de 4px | 1 | 🟡 |
| R1 | La tarjeta pierde el límite de alto: en pantallas bajas o con zoom se sale de la pantalla | — | 🔴 |
| R2 | Los pasos centrados (bienvenida y final) usan `translateY(-50%)`, que Radix no tiene en cuenta al reposicionar | — | 🟠 |
| R3 | Los márgenes internos no son uniformes (4px y 8px) y el botón Next queda pegado a la esquina | 1, 2, 3 | 🟡 |

---

## 1. Por qué el foco no queda alineado con el contenido

### F1 🔴 El hueco y el anillo no comparten la misma geometría
- El **hueco** se corta exactamente en el borde del elemento (`ProductTourOverlay.tsx:9-17`, sin margen).
- El **anillo** usa `outline-offset: var(--design-spacing-xxs)` (`ProductTour.css:19`), es decir, se dibuja 4px **por fuera**.
- Resultado: queda una franja de 4px de scrim entre el elemento y el anillo. El anillo parece flotar separado del contenido, que es lo que se ve en las tres capturas.
- Además el anillo mide `--border-width` (1px) y usa `--color-primary-border`, en vez de los tokens de foco (`--focus-ring-width` de 2px y `--color-focus`).

**Solución:** un solo rectángulo que usen las dos capas.
1. Crea un token de margen, por ejemplo `--tour-spotlight-padding: var(--design-spacing-xxs)`.
2. Calcula el rectángulo ampliado: `left - pad`, `top - pad`, `width + 2·pad`, `height + 2·pad`, con radio `radius + pad`.
3. El hueco y el anillo usan **ese mismo** rectángulo.
4. El anillo pasa a `outline-offset: 0` (o `box-shadow: inset 0 0 0 var(--focus-ring-width) var(--color-focus)`).

### F2 🟠 Las esquinas del hueco no son arcos reales
- `ProductTourOverlay.tsx:11-17` dibuja cada esquina con `Q` (curva cuadrática). Una curva cuadrática **no es un arco circular**, mientras que `border-radius` sí lo es. Por eso las esquinas del hueco y del anillo no coinciden.
- `productTourUtils.ts:44` lee solo `borderTopLeftRadius`. Las cards de Account tienen esquinas distintas entre arriba y abajo (`AccountPage.css:211-212`), así que el resto de esquinas sale mal.

**Solución:**
- Usa arcos SVG `A r r 0 0 1 x y`, o mejor, una `<mask>` con un `<rect x y width height rx>`: `rx` reproduce exactamente un radio CSS circular.
- Si las cuatro esquinas pueden ser distintas, mide cada una (`borderTopRightRadius`, `borderBottomLeftRadius`, etc.).

### F3 🔴 El menú se pinta por encima del scrim (captura 2)
- Orden de capas actual:
  - scrim: `--layer-floating-action` = 1400 (`ProductTour.css:3`)
  - menú de cuenta: `--layer-menu` = 1470
- Como el menú está por encima, se ve **completo y sin oscurecer**, y "My profile" no destaca.

**Solución:**
- Crea `--layer-tour-scrim`, entre `--layer-menu` (1470) y `--layer-tooltip` (1480), por ejemplo 1475.
- Mantén el spotlight y la tarjeta en `--layer-tooltip`.
- El item se sigue viendo y se puede pulsar a través del hueco, porque `pointer-events` solo bloquea la zona oscura.

### F4 🟠 Doble anillo cuando el elemento recibe el foco
- `ProductTour.tsx:271` enfoca el elemento señalado (el avatar o "My profile"). Eso activa su `:focus-visible`: un outline de 2px con offset 0, además del highlight de Radix en el item del menú.
- A la vez se dibuja el spotlight a +4px. Resultado: **dos anillos concéntricos** que no coinciden.

**Solución (elige una):**
- **(a)** Haz que el spotlight coincida exactamente con el anillo de foco: mismo grosor, color y offset 0, con `--tour-spotlight-padding` en 0 para esos pasos.
- **(b)** Marca el elemento con `data-tour-active` y suprime su `outline` mientras el spotlight está visible. El spotlight pasa a ser el indicador de foco y debe cumplir 3:1.

### F5 🟠 Se mide el elemento a mitad de la animación del menú
- `waitForTarget` (`productTourUtils.ts:11-38`) se resuelve en cuanto el nodo **existe** en el DOM. En ese momento el menú todavía está en su animación de entrada (escala y desplazamiento de DropdownMenu).
- `ResizeObserver` (`ProductTour.tsx:257`) **no se dispara con `transform`**, así que la medida desfasada se queda.

**Solución:** antes de medir, espera a que terminen las animaciones del elemento y de su contenedor flotante.

~~~ts
const host = target.closest('[data-radix-popper-content-wrapper]') ?? target;
await Promise.allSettled(host.getAnimations({ subtree: true }).map((a) => a.finished));
await new Promise(requestAnimationFrame);
~~~

Haz lo mismo en el primer `updateBounds` de cada paso.

### F6 🟡 La flecha toca el anillo (captura 1)
- La tarjeta se separa con `FLOATING_SURFACE_SIDE_OFFSET` = 4px (`lib/floatingSurface.ts:6`), y el anillo también está a 4px. La punta de la flecha cae justo encima del anillo.
- Además, `stroke` en `.product-tour__arrow` (`ProductTour.css:134-138`) pinta los tres lados del triángulo. El lado que toca la tarjeta deja una línea visible sobre su borde.

**Solución:**
- `sideOffset` = padding del spotlight + `--focus-ring-width` + separación de superficie.
- Trazo solo en los lados de la flecha, o desplaza la flecha `-var(--border-width)` para que tape el borde de la tarjeta.

---

## 2. Responsive

### R1 🔴 La tarjeta no tiene límite de alto
- `ProductTour.css:31-33` sobrescribe el Popover base con `max-block-size: none` y `overflow: visible`. Eso anula `--radix-popover-content-available-height` (`Popover.css:5-6`).
- Con zoom al 200%, en móvil en horizontal o con textos traducidos más largos, la tarjeta se sale de la pantalla y no se puede desplazar.

**Solución:**
- Mantén `overflow: visible` en la tarjeta (la flecha lo necesita).
- Pon `max-block-size: var(--radix-popover-content-available-height)` y `grid-template-rows: auto minmax(0, 1fr) auto`.
- Haz desplazable solo el cuerpo: `.product-tour__body { overflow: auto }`.

### R2 🟠 Los pasos centrados se posicionan con `translateY(-50%)`
- `ProductTour.css:44-46` sube la tarjeta un 50%, pero Radix calcula las colisiones **sin** contar ese desplazamiento. En pantallas bajas Radix puede pasarla a `side="top"` y el `-50%` la saca por arriba.
- Además, el ancla de los pasos centrados se pone en 50%/50% con tamaño 0 (`ProductTour.tsx:284-291`).

**Solución:** para los pasos centrados, no uses un popover anclado. Usa un contenedor `position: fixed; inset: 0; display: grid; place-items: center`, o `avoidCollisions={false}` junto con `align`/`side` neutros.

### R3 🟡 Márgenes internos no uniformes
| Zona | Padding actual |
|---|---|
| Header | inline 8px · block 0 (la altura la marca el botón de 44px) |
| Body | 8px |
| Footer | block **4px** · inline 8px |

- Con botones de 44px y solo 4px de padding vertical, **Next queda pegado al borde inferior** (las tres capturas).
- Radios anidados: la tarjeta tiene 12px (`--radius-menu`) y el botón 10px con un margen de solo 4px. El radio interior correcto sería 12 − 4 = 8px, o hay que aumentar el margen.
- El icono de la X está centrado en un área de 44px, así que su borde derecho queda unos 14px más adentro que el borde derecho de Next. La columna derecha no se ve alineada.

**Solución:**
- Un solo token de margen interior, por ejemplo `--tour-inset: var(--design-spacing-sm)` (12px), para header, body y footer.
- Alineación óptica de la X: `margin-inline-end: calc((var(--icon-size-sm) - var(--touch-target-min)) / 2)`. Así el glifo queda alineado con Next sin reducir el área táctil.

### R4 🟡 `100vw` en el ancho
- `ProductTour.css:30` usa `calc(100vw - …)`, que incluye el ancho del scrollbar. Además es redundante, porque el Popover base ya limita el ancho con `--radix-popover-content-available-width`.
- Basta con `inline-size: var(--tour-popover-inline-size)` y dejar que el límite del Popover haga el resto.

### R5 ⚪ El breakpoint se decide en JavaScript
- `useIsMobile(768)` (`ProductTourPopover.tsx:36`) decide `side` y `align`. Está alineado con el breakpoint documentado, pero si se gira el dispositivo con un paso abierto, la tarjeta no se recoloca hasta que se vuelve a montar.

---

## 3. Accesibilidad

- 🟠 **El fondo no queda inerte:** la tarjeta usa el rol `dialog` de Radix, pero no tiene `aria-modal="true"` y el resto de la app no está `inert`. Quien usa lector de pantalla puede salir del Tour con los atajos del lector. Hay que marcar el resto de la app como inerte (excepto el elemento señalado) y añadir `aria-modal`.
- 🟠 **Las flechas del teclado se capturan en toda la página** (`useProductTourKeyboard.ts:29-37`, en fase de captura con `preventDefault`):
  - En el paso 3 el DropdownMenu está abierto y **pierde la navegación con flechas**.
  - En RTL, "siguiente" debería ser ArrowLeft.
  - Solución: atender las flechas solo si el foco está dentro de la tarjeta, y respetar `dir`.
- 🟡 **Contador:** `aria-label` sobre un `<span>` genérico (`ProductTourPopover.tsx:71`) no se anuncia de forma fiable. Usa texto oculto con `sr-only` ("Paso 4 de 5") y deja "4/5" con `aria-hidden`.
- 🟡 **Jerarquía de texto:** el contador y la descripción usan `--color-body`, que es igual a `ink`, el mismo color que el título. El contador debería usar `--color-muted`.
- 🟡 **`forced-colors`:** el `fill` del SVG del scrim y el outline del spotlight no tienen estilo para alto contraste. Añade `@media (forced-colors: active) { .product-tour__spotlight { outline-color: Highlight } }`.
- ✅ Bien resuelto: devolución del foco al cerrar, Esc, `scrollIntoView` sin animación suave, título y descripción enlazados con `aria-labelledby`/`aria-describedby`, botones con `type="button"` y el error de guardado con `<output>`.

---

## 4. Valores literales y tokens

| Dónde | Valor | Propuesta |
|---|---|---|
| `ProductTour.css:18` | anillo con `--border-width` (1px) | `--focus-ring-width` |
| `ProductTour.css:18` | color `--color-primary-border` | `--color-focus` |
| `ProductTour.css:19` | offset de 4px separado del hueco | `--tour-spotlight-padding` compartido con el hueco |
| `ProductTour.css:3` | capa `--layer-floating-action` | `--layer-tour-scrim` (nuevo) |
| `ProductTour.css:30` | `100vw` | eliminar (ver R4) |
| `ProductTour.css:110` | padding de 4px | `--tour-inset` |
| `productTourUtils.ts:21` | timeout `2000` ms | constante con nombre, por ejemplo `TOUR_TARGET_TIMEOUT_MS` |
| `ProductTour.tsx:100, 243, 271` | `stepIndex === 2` y `activateStep(3)` | identificar los pasos por `id` en lugar de por posición (hoy se rompe al añadir o reordenar un paso) |
| Radix `Arrow` | tamaño por defecto 10×5 | `width` y `height` con token |

---

## 5. Arquitectura (§14.2 y §15)

- 🟠 `ProductTour` vive en `components/ui`, pero importa de `pages/account-translations`, `components/layout/navigation` y `features/onboarding`. No es una primitiva genérica: es una feature.
  - Mueve `ProductTour.tsx` a `features/onboarding/`.
  - Deja en `ui` solo dos piezas genéricas: un `Spotlight` (hueco + anillo) y un `TourPopover` (header, body y footer), sin conocer el dominio.
- 🟡 `--tour-popover-inline-size` está en `global.css:522`. Si `ProductTour` pasa a ser una feature, sus tokens deberían vivir con ella.

---

## 6. Orden sugerido de corrección
- [ ] 1. **F1 + F2:** geometría única (rectángulo ampliado con `--tour-spotlight-padding`) para el hueco y el anillo, hueco con `<mask>` y `<rect rx>`, anillo con los tokens de foco.
- [ ] 2. **F3:** token `--layer-tour-scrim` por encima de `--layer-menu`.
- [ ] 3. **F5:** esperar a `getAnimations().finished` y a un `requestAnimationFrame` antes de medir.
- [ ] 4. **F4:** elegir un solo indicador de foco (opción a o b).
- [ ] 5. **R1 + R2:** recuperar el límite de alto con un body desplazable; los pasos centrados como contenedor fijo centrado.
- [ ] 6. **R3 + F6:** `--tour-inset` uniforme, alineación óptica de la X y `sideOffset` que deje libre el anillo.
- [ ] 7. Accesibilidad: `aria-modal` y fondo inerte, flechas solo dentro de la tarjeta, contador accesible.
- [ ] 8. Pasos identificados por `id`, constantes con nombre y mover `ProductTour` a `features/onboarding`.
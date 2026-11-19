# Auditoría global de UI/UX, estilos y tokens — Reclutamiento

> Revisión **estática** de `src/styles/global.css`, páginas y componentes contra `desing.md` (fuente de verdad visual) y `AGENTS.md` (convenciones de código).
> **No se modificó ningún archivo del proyecto.** Este reporte es el único entregable. Aplica los cambios a mano en VS Code.
> Convención de conflicto: en lo visual manda `desing.md`; en convenciones de código manda `AGENTS.md`.

---

## 1. Resumen ejecutivo

### Conteo por severidad

| Severidad | Nº hallazgos (grupos) | Qué incluye |
|---|---|---|
| 🔴 Alta | 6 | Tokens referenciados pero inexistentes (color roto), botón sin nombre accesible, `<main>`/`<h1>` faltante, tablas sin patrón responsive confirmado |
| 🟡 Media | 11 | `px` hardcodeados, radios `50%`/`9999px` en marcas, rol tipográfico `caption-md` sin definir en escala, mezcla físico/lógico, media queries desktop-first, estilos inline masivos, overrides de primitivas `.btn-*` |
| 🟢 Baja | 9 | Fallbacks literales en `var()`, `!important` evitables, duraciones/opacidades sin token, clases CSS muertas, selectores base duplicados entre archivos, sintaxis de breakpoint inconsistente |

### Conteo por categoría (volumen bruto detectado)

| Categoría | Nº aprox. | Archivos afectados |
|---|---|---|
| Tokens inexistentes (referencia rota) | 10 tokens | 8 archivos |
| `px` hardcodeados (≠ `0`/`1px`) | ~90 reales | 40 archivos |
| Bordes `1px`/`2px`/`3px` literales (en vez de `--border-width`) | ~85 | 30 archivos |
| Rol `--type-caption-md-*` (13px) usado sin estar en la escala de `desing.md` | 51 usos | 13 archivos |
| `var()` con fallback literal (`, 12px`, `, 2px`) | 30 | 10 archivos |
| `font-weight` vía alias legacy `--font-bold/medium/semibold` | 9 | 4 archivos |
| `control-height-sm` (32px) usado como tamaño de avatar/marca | 7 | 3 archivos |
| `!important` evitables (no print / no reduced-motion) | ~20 | 6 archivos |
| Duraciones/animaciones literales (`0.8s`, `2s`, `200ms`…) | 7 | 4 archivos |
| Opacidades literales (`0.5`, `0.6`, `0.85`…) | ~14 | 10 archivos |
| `border-radius: 50% / 9999px` literal (no token) | 4 | 3 archivos |
| Clases CSS muertas (definidas, nunca usadas) | ~231 | ~30 archivos |
| Clases usadas sin definir (prefijos dinámicos aparte) | revisables | varios |
| Selectores base duplicados entre 2 archivos | 36 | pares de archivos |
| Estilos inline con layout (no solo runtime) | 55 bloques | `Asistencia.tsx`, `reporte-*` |
| Media queries desktop-first (`max-width`/`width <=`) | ~70 | muchos |
| Mezcla de media queries legacy `min-width:` y rango `width >=` | — | `global.css` y otros |
| `<button>` icon-only sin nombre accesible | 99 candidatos | muchos |
| `<button>` sin `type` | 3 | `Asistencia.tsx`, `JsonImporter.tsx` |

> **Nota metodológica:** los números «bruto» cuentan ocurrencias; varios se resuelven con pocos cambios (p. ej. definir un token). Prioriza por la sección **8. Checklist de aplicación**.

### Tabla de tokens nuevos / correcciones de token propuestos

Todos van en `src/styles/global.css`, dentro del bloque `:root` (claro) y, cuando aplique, en los bloques de tema/paleta. Nombrados por **función semántica**.

| Token propuesto | Valor claro | Valor oscuro | Reemplaza al literal / token roto | Justificación (desing.md / AGENTS.md) |
|---|---|---|---|---|
| **(usar existente)** `--color-mute` | ya existe `#374151` | ya existe | `var(--color-muted)` (roto) | §7.4: un único token por significado; `--color-muted` no existe, es typo de `--color-mute` |
| **(usar existente)** `--color-ink` | ya existe `#333` | ya existe | `var(--color-body)` (roto) | `desing.md` body = headings = `--color-ink`; `--color-body` no está definido |
| `--color-error-tint` | `rgb(var(--color-error-rgb) / 10%)` | igual | literal roto en `reporte-insights.tsx` | §8: tintes semánticos localizados; ya existe `--color-vacancy-tint` como patrón |
| `--color-success-tint` | `var(--color-success-subtle)` (alias) | — | roto en `reporte-insights.tsx` | Reutilizar subtle existente; evitar segundo token con mismo fin |
| `--color-warning-tint` | `var(--color-warning-subtle)` (alias) | — | roto en `reporte-insights.tsx` | idem |
| `--color-secondary` | definir como `var(--color-primary)` o eliminar del array de avatar | — | roto en `lib/avatar.ts` | Avatar fallback debe usar una de las 5 familias semánticas (desing.md §Badges & Avatars) |
| `--color-accent-amber` | `var(--color-warning)` (alias) o token propio | — | roto en `KpiHeroChart.tsx`, `constants.ts` | Color de serie/categoría localizado; hoy resuelve a vacío |
| `--border-width-strong` | `2px` | — | fallback `2px` en `OverviewVacancyChart.css` | §10: dimensión repetida y estable → token |
| **(eliminar uso)** `--focus-ring-offset` | usar `0` literal (excepción §7.3) o definir `--focus-ring-offset: 0` | — | roto en 14 reglas `outline-offset` | `desing.md`: foco 2px, **offset 0**; el token no existe → hoy se ignora |
| `--chart-dash-long` | `8px 4px` (coherente con `--chart-dash-short: 4px 4px`) | — | roto en `KpiHeroChart.tsx` | §7.4: progresión coherente de familia `--chart-dash-*` |

> **Decisión pendiente para el responsable:** ¿`caption-md` (13px / 0.8125rem, ya existe como `--type-caption-md-*`) debe **formalizarse** en `desing.md` como rol oficial, o **migrarse** a `caption-sm` (12px) / `body-sm`? Hoy se usa 51 veces pero **no aparece en la tabla de jerarquía de `desing.md`**. Ver hallazgo **4.3**.

---

## 2. Conflictos entre `desing.md` y `AGENTS.md` (anotados, sin resolver en código)

| Tema | `desing.md` | `AGENTS.md` | Resolución aplicada en el reporte |
|---|---|---|---|
| Color primario | `--color-primary = #1E40AF` (§Colors) | §8 dice «azul #2563EB de la escala aprobada» | **Manda `desing.md`** → `#1E40AF` (coincide con `global.css`). Corregir el texto de `AGENTS.md §8`, no el CSS. |
| WCAG | §13 cita «WCAG 2.1 AA» (plan) y `AGENTS.md §13` «WCAG 2.2 AA» | — | Usar **2.2 AA** (más estricto), piso 8.1.1 del proyecto. |

---

## 3. Hallazgos en `src/styles/global.css`

### 3.1 🟢 `font-size: 100%` literal en `html` — aceptable, documentar
`global.css:992`. Es una excepción válida (§7.3, respeta zoom del navegador). **No cambiar.** Se lista solo para que no se marque como falso positivo en futuras auditorías.

### 3.2 🟡 Rol `h2` mapeado a `--type-display-lg-*` que es alias de `heading-lg`
`global.css:1078-1083`.
```css
h2 {
  font-size: var(--type-display-lg-size);   /* = heading-lg (2rem) */
  ...
}
```
No es un error de token, pero `--type-display-lg-*` es un **alias redundante** de `--type-heading-lg-*` (mismo valor y función). §7.4 prohíbe dos tokens con el mismo valor y fin.
**Corrección (consolidar alias):** usar directamente el rol canónico y marcar el alias para retiro.
```css
h2 {
  font-size: var(--type-heading-lg-size);
  font-weight: var(--type-heading-lg-weight);
  line-height: var(--type-heading-lg-line);
  letter-spacing: var(--type-heading-lg-tracking);
}
```
Repetir la sustitución en `.type-display-lg` (`global.css:1204`) y luego eliminar las 4 líneas `--type-display-lg-*` del `:root`. Verifica antes que ningún consumidor dependa del nombre `display-lg` (hay 2 usos en TSX: `text-display-lg` en `Asistencia.tsx` → ver 5.x).

### 3.3 🟢 `!important` en bloque `prefers-reduced-motion` y `forced-colors`
`global.css:1051-1054`, `2745-2754`. **Aceptable** (§23 permite `!important` solo donde es técnicamente necesario para ganar a animaciones de features y colores forzados del sistema). **No cambiar.**

### 3.4 🟡 Sintaxis de media query inconsistente en el propio `global.css`
`global.css` usa `@media (min-width: 768px)` (legacy) mientras la mayoría del proyecto migró a `@media (width >= 768px)`. 9 ocurrencias legacy en `global.css`.
**Corrección (homologar a sintaxis de rango, la dominante):**
```css
/* actual */
@media (min-width: 768px) { ... }
/* corregido */
@media (width >= 768px) { ... }
```
Aplicar a las 8–9 media queries de `global.css`. Mantener los comentarios `stylelint-disable media-feature-range-notation` o quitarlos si ya se homologa todo.

### 3.5 🟢 `.type-display-xl` definido pero con 12 referencias — OK
Sin acción.

---

## 4. Hallazgos transversales de TOKENS (afectan muchos archivos)

### 4.1 🔴 Tokens de color referenciados pero INEXISTENTES (color roto)
Estos `var()` resuelven a **vacío** → el navegador ignora la propiedad o cae a `inherit`, produciendo color incorrecto o invisible. **Alta** porque afecta legibilidad/contraste.

| Token roto | Dónde | Línea aprox. | Corrección |
|---|---|---|---|
| `--color-muted` | `components/reporte-diario/reporte-insights.tsx` | 69, 74, 76 | `var(--color-mute)` |
| `--color-muted` | `lib/constants.ts` (`COMMENT_TYPE_COLORS.otro`) | 982 | `var(--color-mute)` |
| `--color-muted` | `components/ui/KpiHeroChart.tsx` (`PALETTE.axis`) | 68 | `var(--color-mute)` |
| `--color-body` | `features/recognition/RecognitionIndicators.css` | 53, 76 | `var(--color-ink)` |
| `--color-secondary` | `lib/avatar.ts` (array `AVATAR_COLORS`) | 4 | ver tabla tokens (usar familia semántica o `--color-primary`) |
| `--color-accent-amber` | `lib/constants.ts`:979, `KpiHeroChart.tsx`:65 | — | definir alias `--color-accent-amber: var(--color-warning);` o token propio |
| `--color-error-tint` | `reporte-insights.tsx` | 93 | definir token (ver tabla) |
| `--color-success-tint` | `reporte-insights.tsx` | 116 | definir alias a `--color-success-subtle` |
| `--color-warning-tint` | `reporte-insights.tsx` | 54, 98 | definir alias a `--color-warning-subtle` |

**Ejemplo de fix en `reporte-insights.tsx`** (código actual → corregido):
```jsx
/* actual */
color: "var(--color-muted)",
background: "var(--color-error-tint)",
background: "var(--color-success-tint)",
background: "var(--color-warning-tint)",
```
```jsx
/* corregido */
color: "var(--color-mute)",
background: "var(--color-error-tint)",    /* tras definir el token en global.css */
background: "var(--color-success-tint)",  /* alias de --color-success-subtle */
background: "var(--color-warning-tint)",  /* alias de --color-warning-subtle */
```
**Definición a añadir en `global.css` `:root`:**
```css
/* Tintes de estado para superficies de insight (localizados, semánticos) */
--color-error-tint: var(--color-error-subtle);
--color-success-tint: var(--color-success-subtle);
--color-warning-tint: var(--color-warning-subtle);
--color-accent-amber: var(--color-warning);
```

### 4.2 🟡 `--focus-ring-offset` inexistente en 14 reglas de foco
`outline-offset: var(--focus-ring-offset);` en `TeamManagement.css:7`, `PasswordChangeForm.css:86`, `DataUpdatePage.css:143`, `LeaveApprovalNotifications.css:89` y otros. El token no existe → `outline-offset` se ignora → cae al valor por defecto del navegador.
`desing.md`: *«Focus: … 2px, zero offset»*.
**Corrección (opción A, recomendada — usar literal `0`, excepción §7.3):**
```css
/* actual */
outline-offset: var(--focus-ring-offset);
/* corregido */
outline-offset: 0;
```
**Opción B** (si prefieres token): añade `--focus-ring-offset: 0;` en `:root`. Elige una y aplícala a las 14 ocurrencias.

### 4.3 🟡 Rol tipográfico `caption-md` (13px) usado 51 veces pero ausente de la escala de `desing.md`
`--type-caption-md-*` (0.8125rem / 500) **está definido en `global.css`** pero **no figura en la tabla de jerarquía de `desing.md`** (§Typography). Según `AGENTS.md §9.1` está **prohibido inventar tamaños intermedios fuera de la escala documentada**.
Archivos con más uso: `Pipeline.css` (14), `Settings.css` (7), `RequisicionSheet.css` (5), `CubrirVacanteModal.css` (6), `CommentModal.css` (4), `DashboardDepartments.css` (3)…
**Decisión del responsable (una de dos):**
- **(A) Formalizar:** añadir `caption-md` a la tabla de `desing.md` como rol oficial (13px/500) y dejar el CSS como está. Cambio mínimo, documental.
- **(B) Migrar:** reemplazar los 51 usos por `caption-sm` (12px/400) o `body-sm` según contexto, y luego **eliminar** `--type-caption-md-*`.
**Recomendado: (A)** por menor riesgo visual; documentarlo cierra el incumplimiento §9.1.

### 4.4 🟢 `font-weight` vía alias legacy `--font-bold / --font-medium / --font-semibold`
9 usos: `FormatosView.css` (4), `HomePage.css` (1), `Avatar.css` (1), `BajaDetailSheet.css` (2). `AGENTS.md §9.1`: el peso debe venir del **rol tipográfico completo**, no de un peso suelto.
**Corrección por caso** — sustituir por el `*-weight` del rol que ya use el elemento. Ejemplo `Avatar.css:16`:
```css
/* actual */
font-weight: var(--font-bold);
/* corregido (iniciales de avatar usan body-strong) */
font-weight: var(--type-body-strong-weight);
```
Caso especial `HomePage.css:21` (`.home-page__greeting`): `desing.md` **exige 700** para el saludo del workspace (app-workspace §: «20px / weight 700»). Aquí `var(--font-bold)` (=700) es **correcto por diseño**; déjalo pero añade comentario, o define el saludo con un rol propio. **No lo migres a 600.**

### 4.5 🟡 `--control-height-sm` (= `2rem` / 32px) usado como tamaño de avatar/marca
`Rutas.css:183,222,223`, `Pipeline.css:1194,1195`, `MetricTile.css:38,39`. Es un token de **altura de control**, no de avatar. Semánticamente incorrecto (§7.4: nombrar por función). Funciona porque 32px coincide, pero acopla dos conceptos.
**Corrección:** crear/usar un token de tamaño de marca/avatar compacto, p. ej. reutilizar `--icon-size-xxl` (2.5rem) si el diseño lo permite, o definir `--feature-avatar-size-sm: 2rem;` y apuntar ahí. Confirmar el diámetro deseado con diseño antes de cambiar el valor.

---

## 5. Hallazgos por PÁGINA

### 5.1 🔴 `pages/Asistencia.tsx` — sin `<main>` ni `<h1>` semántico vía PageHeading, estilos inline masivos, `<button>` sin `type`, clases inexistentes
Es la página más desalineada del proyecto. Varios incumplimientos juntos:

**(a) 🟡 55 bloques `style={{…}}` con layout** (líneas 141–264). `AGENTS.md §23`: estilos inline solo para valores calculados en runtime; aquí son `marginBottom`, `display:flex`, `gridTemplateColumns`, etc., todos tokenizables en CSS.
```jsx
/* actual */
<div className="feature-card" style={{ marginTop: 'var(--design-spacing-lg)', maxWidth: '800px' }}>
```
```jsx
/* corregido: mover a Asistencia.css */
<div className="feature-card asistencia-json-card">
```
```css
/* nuevo en Asistencia.css */
.asistencia-json-card {
  margin-block-start: var(--design-spacing-lg);
  max-inline-size: var(--asistencia-json-card-max, 50rem); /* 800px → token */
}
```

**(b) 🔴 `maxWidth: '800px'` y `minHeight: '250px'` hardcodeados** (líneas 141, 158). Convertir a tokens (`800px` ya aparece también en `Asistencia.css:47` y `TurnosUpdater.css:33` → candidato a `--feature-wide-panel-max: 50rem`).

**(c) 🟡 `borderBottom: '1px solid var(--color-hairline)'` y `paddingBottom: '4px'`** (líneas 211, 212, 256, 257). `1px`→`var(--border-width)`, `4px`→`var(--design-spacing-xxs)`.

**(d) 🟢 Clases usadas que no existen en CSS:** `feature-card`, `color-ink-muted`, `color-muted`, `color-ink`, `asistencia-table__name`. `color-ink-muted` no existe (sí `.text-muted`/`.color-*`). Verificar y sustituir por clases reales o crearlas.

**(e) 🟡 `<button className="btn-primary" onClick=…>` sin `type`** (línea 167) y `<textarea>` sin `id`/`label` asociado (línea 150). Añadir `type="button"` y un `<label htmlFor>` o `aria-label`.

**(f) 🟡 `<textarea>` con `fontSize: 'var(--type-code-sm-size)'` inline** — mover a clase; además falta el resto del rol `code-sm` (weight/line/tracking).

### 5.2 🟡 `pages/Settings.css` — `var()` con fallback literal (12 casos) y bordes `1px`
`Settings.css:36,84,85,87,93,162,237,259,269,311,333,361`. Patrón `var(--type-*-size, 14px)` / `var(--type-caption-md-size, 12px)`.
`AGENTS.md §7.3`: el fallback literal reintroduce un valor hardcodeado. Si el token existe, el fallback sobra.
```css
/* actual */
font-size: var(--type-body-md-size, 14px);
font-size: var(--type-caption-md-size, 12px);
/* corregido */
font-size: var(--type-body-md-size);
font-size: var(--type-caption-md-size);  /* + ver decisión 4.3 sobre caption-md */
```
Además bordes `1px solid` en `:56, :238, :289` → `var(--border-width) solid`. Y `opacity: 0.6`/`0.5` (`:142, :198`) → `var(--opacity-disabled)`.
También: `background-size: 5px 5px` y `calc(100% - 18px)` del caret del select (`:152-154`) — magic numbers decorativos; aceptable como excepción documentada (dibujo del indicador), pero idealmente usa `appearance: auto` como hace `.form-group select` en global.

### 5.3 🟡 `pages/Pipeline.css` — bordes de acento `2px/3px`, `width:148px`, `height:20px/3px`, `!important`, caption-md
- `:161` `border-left: 3px solid var(--color-mute);` y `:315` `border-left: 2px` → tokenizar grosor de acento: define `--border-width-accent: 2px;` (o usa `--border-width-strong` de 4.1) y aplica. 3px vs 2px es inconsistencia visual entre bloques hermanos (`recruiter-stat` vs `weekly-stat`): homologar a uno.
- `:275` `width: 148px;` (tarjeta semanal) → token `--pipeline-week-card-inline-size` (p.ej. `9.25rem`).
- `:260` `height: 3px` (scrollbar) y `:958` `height: 20px` (chip notas) → tokenizar o usar `--design-spacing-*` cercano (`20px`≈`--design-spacing-lg`? no; crea token de chip).
- `:702` `opacity: 0.6` del blur de nombres → `var(--opacity-muted)` (0.55) o token propio.
- `:701/708` `filter: blur(4px)/blur(0)` → token `--blur-name-mask` si se repite; es decorativo, baja prioridad.
- `:1231-1233` `!important` dentro de `prefers-reduced-motion` → **aceptable**, no tocar.
- Media queries desktop-first `width <= 767px` conviven con `width >= 768px`: ver 7.1.

### 5.4 🟡 `pages/Configuracion.css` — `border-radius: 50%`, `width/height: 64px`, `max-width: 400px`, `!important`
- `:617` `border-radius: 50%;` en `.analysis-employee-calendar__recorded-marker` → es un **punto decorativo**; `desing.md` permite círculo solo en avatares y status dots. Si es un marcador/punto de estado, usa `var(--rounded-full)` (token) en vez de `50%` literal. Si no es dot de estado, usa `--rounded-xs`.
- `:925-926` `width/height: 64px` (icono estado inicial) → `--icon-size-xxl` (2.5rem=40px) no coincide; crear `--feature-empty-icon-size: 4rem` (64px) y reutilizar (también aparece en `EmployeeSheet.css:62`, `ConfiguracionInitial`).
- `:938` `max-width: 400px` → token `--content-min-inline-size` existe (17.5rem) o crear `--empty-copy-max: 25rem`.
- `:1910` `display: none !important` → revisar si es print; si no, eliminar `!important` y subir especificidad legítima.

### 5.5 🟡 `pages/PublicCareersPage.css` — `backdrop-filter: blur(8px)`, `width: min(100%,1180px)`, gradiente, `outline:none`
- `:26` `blur(8px)` decorativo → tokenizable (`--blur-header`), baja prioridad.
- `:8` `1180px` ancho de contenedor público → token `--public-careers-max-inline-size` (ya hay familia `--container-*`; añade uno).
- `:308` `linear-gradient(180deg, var(--color-canvas-elevated), var(--color-surface…))` → usa tokens, OK; verificar que no sea «glow/gradiente pesado» prohibido (§10). Es sutil de superficie, aceptable.
- `:398` `outline: none;` en `input:focus` → **🔴 riesgo de accesibilidad**: confirmar que existe `:focus-visible` con anillo (hay `.public-careers__search input:focus-visible` en `:417`). Si el anillo visible está cubierto, OK; si no, reponer foco.

### 5.6 🟡 `pages/DashboardWorkspace.css` y `pages/Dashboard.css` — selectores base duplicados + overrides de `.btn-*`
`.dashboard__controls`, `.dashboard__filter`, `.dashboard__hero`, `.dept-card*`, `.cell-puesto*` están **definidos en dos archivos** (`Dashboard.css` y `DashboardWorkspace.css`, y algunos también en `DashboardDepartments.css`). §40.2 (duplicación). Riesgo de divergencia.
**Corrección:** consolidar en un solo archivo la definición base y que el otro solo añada overrides contextuales reales. Verificar qué página monta qué componente para decidir el hogar canónico.
`DashboardWorkspace.css:277` override de `.btn-primary/.btn-secondary` → ver 6.1.

### 5.7 🟢 `pages/MotivosBaja.css`, `MissingPositionsPage.css`, `Actividades.css`, etc. — media queries desktop-first sueltas
Cada una tiene 1 bloque `width <= 767px`. Ver patrón global 7.1.

### 5.8 🟢 `pages/HomePage.css` — `outline: 2px` + `outline-offset: 2px` literales, `--font-bold`
`:68-69`:
```css
/* actual */
outline: 2px solid var(--color-focus, var(--color-ink));
outline-offset: 2px;
/* corregido */
outline: var(--focus-ring-width) solid var(--color-focus);
outline-offset: 0;   /* desing.md: foco sin offset */
```
El `outline-offset: 2px` contradice `desing.md` («zero offset»). `--font-bold` de `.home-page__greeting`: ver 4.4 (aquí es correcto por diseño, documentar).

---

## 6. Hallazgos por COMPONENTE

### 6.1 🟡 Override repetido de primitivas `.btn-primary/.btn-secondary/.btn-danger` en ~24 archivos
Patrón idéntico repetido para re-declarar tipografía del botón:
```css
.<contexto> :is(.btn-primary, .btn-secondary) {
  font-family: var(--font-body);
  font-size: var(--type-body-md-size);
  font-weight: var(--type-body-md-weight);
  line-height: var(--type-body-md-line);
  letter-spacing: var(--type-body-md-tracking);
  ...
}
```
Presente en `TeamManagement.css:27`, `DataUpdatePage.css:1591,1633`, `DashboardWorkspace.css:277`, `CandidateMetricsPage.css:290`, `Actividades.css:295`, `Pipeline.css:1225`, `ReportDayPage.css:112`, `MotivosBaja.css:353`, `FormatosView.css:938`, `MaintenanceGuard.css:80`, `SidebarQuickActions.css:523`, `ReportComparisonContent.css:197`, `ReporteDiarioOverlays.css:99,171`, `PositionSettingsWizard.css:63`, `EmployeeModal.css:243`, `HireCandidateModal.css:89`, `RutaDayEmployeesModal.css:244`, `EditEmployeeModal.css:41`, `PromoteEmployeeModal.css:121`, `CandidateModal.css:41`, `IncapacidadModal.css:43`.
**Problema:** `.btn-*` de `global.css` ya define `type-button`. Re-pintarlos con `body-md` por contexto (a) es duplicación §40.2 y (b) **cambia el rol** de `button` a `body-md` (14/400 vs 14/600) → incoherencia de peso entre botones iguales.
**Corrección:** eliminar estas re-declaraciones salvo que haya una razón documentada; dejar que la primitiva mande. Si algún contexto necesita botón más pequeño, usar `.btn-sm` (ya existe) en el JSX, no un override CSS.
> Ojo: `ReporteDiarioOverlays.css:99` SÍ usa `--type-button-md-*` (correcto). Los demás usan `body-md` (incorrecto). Homologar a `--type-button-*`.

### 6.2 🟡 `components/ui/TurnosUpdater.css` — modal manual con `max-width:800px`, `blur(2px)`, `transition: all .15s`, `!important`, foco
- `:33` `max-width: 800px` → token (ver 5.1b).
- `:25` `backdrop-filter: blur(2px)` decorativo → tokenizable.
- `:73` `transition: all 0.15s ease;` → `transition: background var(--transition-fast), color var(--transition-fast);` (evitar `all` y duración literal; `--transition-fast` = 150ms).
- `:102,108` `color: … !important` → eliminar `!important`, resolver por especificidad.
- `TurnosUpdater.tsx` monta un **modal propio** (`turnos-updater__preview-modal`, backdrop + content) en vez del primitivo `Modal`/`Sheet`. §22/§14: reutilizar primitiva antes de crear. El backdrop es un `<button>` scrim con `aria-label` (ok) pero el contenedor no tiene `role="dialog"`/`aria-modal`/trampa de foco/Escape. **Media-alta accesibilidad.** Recomendado migrar a `Modal` compartido.

### 6.3 🟡 `components/ui/CoverageBar.css` + `.tsx` — duración/opacidad literales y color inline
- `:29` `transition: width 2000ms cubic-bezier(0.25,1,0.5,1);` y `:45` `animation: liquid-shimmer 2s infinite linear;` → duraciones fuera de la escala `--transition-*`. Definir `--transition-progress` (ya existe: 1400ms) o un token propio para la barra.
- `:14` `min-width: 42px` → token.
- `.tsx:20,27,31` `style={{ color }}`, `style={{ height }}`, `style={{ width: \`${pct}%\`, backgroundColor: color }}` → `width:%` y `color` SON runtime (OK, excepción §7.3). Pero `color` proviene de `getCoverageColor()` que devuelve **tokens** (`var(--color-success-text)`…) → correcto. `height` prop por defecto `8` (número) → asegúrate de que llegue con unidad/token.

### 6.4 🟡 `components/ui/RecruitmentHero.css` — grid decorativo con `32px`, `1.5px`, `46px/28px/16px`, duraciones `200ms/0.6s`
`:24` `background-size: 32px 32px` (`--design-spacing-xl`=2rem=32px → usar token), `:71` `border: 1.5px` (no hay token de 1.5px; evaluar `--border-width`), `:102/130/131` `28px/46px` (tokenizar tamaños de ring/connector), `:137-139/160/190` duraciones `200ms`/`0.6s` → `--transition-fast`/`--transition-base`. Baja-media (componente decorativo del login/hero).

### 6.5 🟡 `components/ui/EmployeeSheet.css` vs `EmployeeModal.css` — bloque `.delete-warning*` duplicado con valores distintos
`.delete-warning__icon` existe en **ambos**: en `EmployeeModal.css:131` sin tamaño, en `EmployeeSheet.css:61` con `width/height: 64px` + fondo. §40.2 duplicación + divergencia. Consolidar en un único lugar (p. ej. un `DeleteWarning` compartido) y tokenizar `64px` (ver 5.4). También `EmployeeSheet.css:10` `max-width: 560px` → token.

### 6.6 🟡 `components/ui/LiveOrb.css` — `border-radius: 50%` y `9999px` literales
`:10` `border-radius: 50%` (contenedor orbe) y `:18` `border-radius: 9999px` (ojos). Son **status/decorativos circulares**, permitidos, pero deben usar el **token** `var(--rounded-full)` en vez del literal (§10 / §7.1).
```css
/* actual */ border-radius: 9999px;
/* corregido */ border-radius: var(--rounded-full);
```
Mismo caso en `Rutas_Utils.css:44` (`50%`) y `Configuracion.css:617`.

### 6.7 🟡 `components/ui/KpiReveal.css` — `filter: blur(30px/22px)`, `opacity: 0.6`
`:28,68` blur grandes decorativos y `:69` opacity literal. Tokenizar o documentar como excepción decorativa localizada (§10 permite decoración localizada; pero los valores deben ser tokens si se repiten).

### 6.8 🟡 `components/reporte-diario/*` — alto volumen de bloques tipográficos idénticos repetidos
El análisis de bloques idénticos (≥4 declaraciones) muestra **55 selectores** compartiendo exactamente el rol `body-md` completo, **33** el rol `body-strong`, etc., repartidos sobre todo en `reporte-diario/*`, `DepartmentSearchResults.css`, `AreaDetailView.css`.
§40.2: duplicación de bloques. No es roto, pero es deuda de mantenimiento.
**Corrección recomendada (sin tocar diseño):** usar las clases utilitarias tipográficas ya existentes (`.type-body-md`, `.type-body-strong`, `.type-caption-up`…) en el JSX, o `@extend`-style agrupando selectores. Prioridad baja; hacerlo por archivo al tocarlos.

### 6.9 🟡 `components/ui/RequisicionSheet.css` — 20 `!important`, bordes `1px`, `14px`, `200px/160px`, caption-md
La mayoría de `!important` (`:456-479`) están en `@media print` → **aceptable**. Fuera de print: revisar `:481 border-radius: 0 !important`. Bordes `1px solid` (11) → `--border-width`. `:264-265` `width/height: 14px` (checkbox doc) → es documento imprimible con su propia escala (`document-*`); **excepción §7.3 documentada** (geometría de export). Marcar como intencional.

### 6.10 🟢 `components/ui/reporte-*.tsx` — `style={{ marginTop:'2px' }}` y objetos `STYLES`
`reporte-insights.tsx:256` `style={{ flexShrink: 0 }}` (ok, no visual-token). `reporte-employee-detail.tsx` usa objeto `STYLES` con **tokens** (bien), pero `insightIcon.marginTop: "2px"` (`reporte-insights.tsx`) es literal → `var(--design-spacing-xxs)` (4px) o un token de 2px si existe. Baja.

---

## 7. Responsive y accesibilidad (transversal)

### 7.1 🟡 Estrategia desktop-first mezclada con mobile-first
`AGENTS.md §11`: *«El estilo base corresponde siempre a móvil»*. Hay ~70 media queries `max-width`/`width <= 767px`/`width <= 1079px` que **restan** sobre una base desktop, conviviendo con `width >= 768px`.
No todas son errores (un `width <= 767px` puntual para una excepción móvil es válido), pero varios archivos (`Pipeline.css`, `Configuracion.css`, `ReporteDiarioMetrics.css`, `Settings.css`) definen el layout ancho primero y lo colapsan después.
**Corrección:** por archivo, al tocarlo, reescribir la base como móvil y usar solo `width >= …` para añadir. No es un cambio mecánico; requiere revisión visual en los 4 rangos (`AGENTS.md §11.2`). Prioridad media, hacerlo incrementalmente.

### 7.2 🟡 Breakpoints: `@media (width >= 1024px)` fuera de la escala
`ReportSgiPage.css:211` usa `1024px`, que **no** está en los breakpoints de `desing.md` (768 / 1080 / 1440) ni en `LAYOUT_BREAKPOINTS` (mobileNarrow 375, mobile 600, tablet 768, desktop 1080, desktopWide 1280, wide 1440).
**Corrección:** cambiar a `1080px` (desktop) salvo justificación. §7.1/§7.2 prohíbe breakpoints no documentados.
> Nota: `LAYOUT_BREAKPOINTS` define `mobile: 600` y `desktopWide: 1280` que **no** aparecen en la tabla de `desing.md`. Anotarlo: o se documentan en `desing.md`, o se retiran si no se usan.

### 7.3 🔴 `<button>` icon-only sin nombre accesible (99 candidatos)
Detección heurística de `<button>` cuyo contenido es solo un icono y sin `aria-label`/`title`/texto `sr-only`. **Requiere revisión manual** (algunos reciben nombre por `children` traducidos o `{...props}`). Casos confirmados a revisar primero:
`AccountProfile.tsx:103,108,132,135`, `TeamMemberForm.tsx:61-62`, `MaintenanceControl.tsx:76`, `AccountPasswordSection.tsx:61`, `AccountPreferencesSection.tsx:24,57`, `IndicadoresView.tsx:231`, `LeaveRequestActions.tsx:83` (dentro de DropdownMenuItem — el nombre va en el `<span>`, verificar).
**Corrección tipo:**
```jsx
/* actual */
<button type="button" className="btn-icon"><X /></button>
/* corregido */
<button type="button" className="btn-icon" aria-label={copy.close}><X aria-hidden="true" /></button>
```

### 7.4 🟡 `<button>` sin atributo `type` (default `submit`)
`Asistencia.tsx:167,281`, `JsonImporter.tsx:63`. Dentro de formularios puede disparar submit involuntario.
```jsx
/* actual */ <button className="btn-primary" onClick={…}>
/* corregido */ <button type="button" className="btn-primary" onClick={…}>
```

### 7.5 🟡 `<main>` / jerarquía de landmarks
Páginas sin `<main>` propio: `Asistencia.tsx` (5.1), `ReportDayPage.tsx`, `LoginForm.tsx`/`LoginPreferences.tsx` (son sub-componentes de `Login` que sí tiene `<main>` → OK). Verificar que **cada ruta** renderice exactamente un `<main>` y un `<h1>` (vía `PageHeading` o directo). `Asistencia` usa `PageHeading` (h1 al portal) pero su raíz es `<div class="asistencia-page container">`, no `<main>`.
**Corrección:** cambiar la raíz de `Asistencia` a `<main className="asistencia-page container">` con `aria-labelledby`.

### 7.6 🟡 `outline: none` sin reemplazo verificable
`PublicCareersPage.css:398`, `PasswordChangeForm.css:82,109`, `Pagination.css:55`, `global.css:2615`. En todos hay un `:focus-visible` que repone el anillo en el elemento contenedor — **verificar visualmente** que el anillo es perceptible (`desing.md`: foco siempre perceptible, no puede sustituirse por halo). Confirmado por código en Pagination y global; revisar `PublicCareers` y `PasswordChangeForm` en los 4 rangos.

### 7.7 🟡 Tablas con `overflow-x: auto` — confirmar patrón `data-table--cards`
`AGENTS.md §11`/`desing.md §Data tables`: las tablas deben adaptarse con patrón autorizado, no desbordar. Hay ~20 contenedores con `overflow-x: auto`. Varias ya implementan `data-table--cards` / `td[data-label]::before` (Asistencia, ReportSgi, TurnosUpdater, DepartmentSearch). **Revisar que TODAS** las tablas de datos tengan versión apilada móvil; `WeeklyOnboardingDocuments.tsx` usa `<table>` sin clase `data-table` (verificar si es documento export, entonces OK).

### 7.8 🟢 `role="button"` en `<div>` — `reporte-calendar.tsx:104`
Celda de calendario `<div role="button" tabIndex aria-pressed onKeyDown onClick>`. Tiene teclado y ARIA correctos. **Aceptable**, pero preferible `<button>` nativo si el layout lo permite (§13.1: no elegir elemento por apariencia). Baja.

---

## 8. Clases CSS muertas y selectores duplicados (código muerto, §40)

### 8.1 🟢 ~231 clases definidas en CSS y nunca referenciadas en TSX/TS
Top archivos (recortado; **verificar cada una** porque algunas se construyen con plantillas `clase--${x}`):
- `Pipeline.css` (39): `pipeline__area`, `pipeline__cell-cv`, `pipeline__config-btn`, `pipeline__config-btn--active`, `pipeline__cell-dates-label`, `pipeline__ccard-contact-col`…
- `Configuracion.css` (21): `config-initial-state*`, `config-main--loading`, `config-page__header-container`…
- `DashboardDepartments.css` (14): `dept-card__bottom`, `dept-card__headcount`, `cell-seccion`…
- `ReporteDiarioLayout.css` (12), `ReporteDiarioSavedReports.css` (12), `ActivityCard.css` (10 — pero `VacanteCard.tsx` reusa clases `activity-card__*` dinámicamente → **falsos positivos probables**, revisar), `PublicCareersPage.css` (9), `ReporteDiarioControls.css` (9).
- `global.css` (21): varias son **primitivas legítimas** usadas por composición (`btn-icon__count`, `input-success`, `section-divider`, `text-body-strong`, `page-title`) → **NO eliminar sin verificar**; algunas (`text-charcoal`, `text-muted-soft`) tienen 8/5 usos.
- `Calendar.css`, `BirthDateField.css`, `MotivosBaja.css`: clases `rdp-*` y `recharts-*` provienen de **librerías de terceros** (react-day-picker, recharts) → **NO son muertas**, excepción §7.3.

**Corrección:** por archivo, confirmar con búsqueda (incluyendo plantillas dinámicas y strings concatenados) antes de borrar. §40.1 exige eliminar en el mismo cambio autorizado; hazlo archivo por archivo, no en masa.

### 8.2 🟢 36 selectores de clase base duplicados entre 2 archivos
Pares relevantes (consolidar):
- `dashboard__*`, `dept-card*`, `cell-puesto*` → `Dashboard.css` ↔ `DashboardWorkspace.css` ↔ `DashboardDepartments.css`.
- `delete-warning*` → `EmployeeModal.css` ↔ `EmployeeSheet.css` (6.5).
- `sidebar__item*`, `sidebar__account-chevron` → `Sidebar.css` ↔ `SidebarNavigation.css`/`SidebarAccountMenu.css`.
- `reporte-*` múltiples → varios `reporte-diario/*`.
- `indicadores-view`, `metrics-departures` → `Configuracion.css` ↔ `configuracion-views/*`.
- `btn-secondary`, `stat-card--dark` → feature ↔ `global.css` (**no deben redefinirse fuera de global**, §7.4/§23 «no aplicar estilos globales desde una feature»).

**Corrección:** una definición base por clase; el segundo archivo solo overrides contextuales reales, o renombrar si son conceptos distintos.

### 8.3 🟢 Keyframes `spin` duplicados por feature
`settings-spin`, `purge-spin`, `candidate-access-card-spin`, `app-toaster-spin`, `lightbox-modal-spin`, `animated-submit-spin` — todos son `to { transform: rotate(360deg) }` idénticos al `.spin`/`@keyframes spin` de `global.css`.
**Corrección:** usar la clase `.spin` global (ya respeta reduced-motion) en lugar de redeclarar keyframes y `animation: …-spin 0.8s linear infinite` con duración literal. Elimina duplicación §40.2 + duraciones hardcodeadas.

---

## 9. Checklist de aplicación (en orden)

Aplica de arriba hacia abajo; cada bloque es verificable por separado.

### Paso 1 — Tokens (en `src/styles/global.css`, bloque `:root` y temas)
- [ ] Añadir `--color-error-tint`, `--color-success-tint`, `--color-warning-tint`, `--color-accent-amber` (alias semánticos, ver 4.1).
- [ ] Añadir `--border-width-strong: 2px;` (o `--border-width-accent`).
- [ ] Añadir `--chart-dash-long: 8px 4px;`.
- [ ] Decidir `--focus-ring-offset`: definirlo como `0` **o** reemplazar sus 14 usos por `0` (4.2).
- [ ] Consolidar alias redundante `--type-display-lg-*` → `--type-heading-lg-*` y retirar (3.2).
- [ ] Crear tokens de dimensión repetida: `--feature-empty-icon-size: 4rem;` (64px), panel ancho `--feature-wide-panel-max: 50rem;` (800px), tarjeta semana pipeline, etc.
- [ ] Decidir `caption-md`: documentar en `desing.md` **o** planificar migración (4.3).

### Paso 2 — `global.css`
- [ ] Homologar media queries legacy `min-width` → rango `width >=` (3.4).
- [ ] Reemplazar `--type-display-lg-*` en `h2` y `.type-display-lg` (3.2).

### Paso 3 — Referencias de token rotas (color roto, Alta)
- [ ] `--color-muted` → `--color-mute` (reporte-insights.tsx, constants.ts, KpiHeroChart.tsx).
- [ ] `--color-body` → `--color-ink` (RecognitionIndicators.css).
- [ ] `--color-secondary` (avatar.ts) y `--color-accent-amber` → resolver con tokens.
- [ ] `--color-*-tint` ya resueltos por Paso 1.

### Paso 4 — Páginas
- [ ] `Asistencia.tsx`: `<main>` + `aria-labelledby`, mover 55 estilos inline a `Asistencia.css`, `type="button"`, `<label>` del textarea, tokenizar `800px/250px/1px/4px`, corregir clases inexistentes (5.1, 7.4, 7.5).
- [ ] `Settings.css`: quitar 12 fallbacks literales, `1px`→`--border-width`, `0.6/0.5`→`--opacity-disabled` (5.2).
- [ ] `Pipeline.css`: acentos `2px/3px`, `148px`, `20px/3px`, opacity (5.3).
- [ ] `Configuracion.css`: `50%`→token, `64px`→token, `400px`→token, revisar `!important` (5.4).
- [ ] `PublicCareersPage.css`: breakpoint `1024`→`1080` (7.2), verificar foco (5.5/7.6), tokenizar `1180px/8px`.
- [ ] `HomePage.css`: foco `2px`/offset → tokens + offset 0 (5.8).
- [ ] Dashboard*: consolidar duplicados (5.6/8.2).

### Paso 5 — Componentes
- [ ] Eliminar overrides `.btn-*` con `body-md` en ~24 archivos; dejar mandar la primitiva o usar `.btn-sm` (6.1).
- [ ] `TurnosUpdater`: migrar a `Modal` compartido o añadir `role="dialog"`+foco+Escape; quitar `!important`, `all .15s`, `800px/blur` (6.2).
- [ ] `LiveOrb.css`, `Rutas_Utils.css`, `Configuracion.css`: `50%`/`9999px` → `var(--rounded-full)` (6.6).
- [ ] `EmployeeSheet`/`EmployeeModal`: consolidar `.delete-warning*` (6.5).
- [ ] `--font-bold/medium/semibold` → `*-weight` del rol (4.4), salvo saludo Home (dejar 700, documentar).
- [ ] `--control-height-sm` como avatar → token de avatar (4.5).
- [ ] Keyframes `*-spin` → usar `.spin` global (8.3).
- [ ] Reemplazar bloques tipográficos repetidos por utilitarias `.type-*` al tocar `reporte-diario/*` (6.8).

### Paso 6 — Accesibilidad / responsive
- [ ] Nombre accesible en `<button>` icon-only (revisar lista 7.3).
- [ ] `<main>`/`<h1>` únicos por ruta (7.5).
- [ ] Verificar `outline: none` + `:focus-visible` en los 4 rangos (7.6).
- [ ] Confirmar patrón apilado de todas las `data-table` en móvil (7.7).
- [ ] Reescribir a mobile-first los archivos desktop-first al tocarlos (7.1).

### Paso 7 — Limpieza (código muerto)
- [ ] Eliminar clases CSS muertas verificadas (8.1) — **una por una**, excluyendo primitivas de `global.css`, `rdp-*` y `recharts-*`.
- [ ] Consolidar selectores base duplicados (8.2).

---

## 10. Prompt base para Claude / ChatGPT en VS Code

> Pega esto y añade debajo el bloque concreto del reporte que vas a aplicar.

```
Actúa como ingeniero front-end senior. Vas a aplicar correcciones de una auditoría
de UI/UX sobre un proyecto React + Vite + TypeScript con CSS por tokens.

REGLAS INQUEBRANTABLES:
1. Fuente de verdad visual: desing.md. Convenciones de código: AGENTS.md. Si chocan,
   manda desing.md en lo visual.
2. NO cambies lógica, datos, textos visibles ni comportamiento. Solo estilos, tokens,
   semántica HTML y accesibilidad.
3. PROHIBIDO hardcodear valores visuales: usa tokens CSS (--color-*, --type-*-*,
   --design-spacing-*, --radius-*, --border-width, --rounded-*, --transition-*,
   --layer-*, --touch-target-min). Excepciones permitidas: 0, auto, inherit,
   currentColor, %, fracciones de grid, aspect-ratio, hairline documentado,
   valores realmente calculados en runtime.
4. Usa el ROL tipográfico completo (size + weight + line-height + letter-spacing),
   nunca un tamaño o peso suelto. No inventes tamaños fuera de la escala de desing.md.
5. Un solo token por significado. No crees tokens duplicados. Si falta uno, defínelo
   en src/styles/global.css nombrado por función semántica.
6. Botones: usa las primitivas .btn-primary/.btn-secondary/.btn-ghost/.btn-danger/
   .btn-icon/.btn-text y .btn-sm. No re-declares su tipografía por contexto.
7. Accesibilidad WCAG 2.2 AA: todo control interactivo >=44px, foco visible 2px sin
   offset con --color-focus, botones icon-only con aria-label, un <main> y un <h1>
   por página, <label> asociado a cada campo.
8. Responsive mobile-first con breakpoints de desing.md (768 / 1080 / 1440) en sintaxis
   de rango: @media (width >= 768px). Verifica móvil estrecho, móvil, tablet, desktop y wide.
9. Cambios mínimos y diff limpio. No toques nada fuera de lo indicado.

TAREA: aplica EXACTAMENTE el siguiente bloque de la auditoría (código actual -> corregido):
[PEGA AQUÍ el hallazgo con su "código actual" y "código corregido"]

Antes de responder, muéstrame el diff propuesto por archivo y espera mi confirmación.
```

---

## 11. Fuera de alcance (confirmado por el plan)

- No se levantó la app, no se llamó a local, no se tomaron capturas ni se crearon archivos de prueba.
- El contraste WCAG se evaluó por tokens y reglas; **la verificación visual final y con tecnología asistiva en los 4 rangos sigue siendo obligatoria** antes de certificar (`desing.md` lo exige explícitamente).
- Fase 2 (verificación tras aplicar cambios) y Fase 3 (guía de reglas en `AGENTS.md`) quedan pendientes de tu confirmación.

---

*Reporte generado por auditoría estática. Ruta: `docs/AUDITORIA-UI-UX.md`.*

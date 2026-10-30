# AGENTS.md — Contrato obligatorio de desarrollo

Este documento establece las reglas que debe cumplir cualquier IA, agente automatizado o desarrollador que analice, proponga o modifique este proyecto.

Las palabras **DEBE**, **NO DEBE**, **OBLIGATORIO**, **PROHIBIDO** y **ÚNICAMENTE** expresan requisitos no negociables.

El objetivo es mantener una implementación:

- Cohesiva y predecible.
- Accesible bajo WCAG 2.2 AA y umbral mínimo **8.1.1**.
- Mobile-first y responsive en móvil, tablet, desktop y wide.
- Basada exclusivamente en tokens optimizados y sin duplicados.
- Reutilizable mediante primitivas documentadas.
- Sin código muerto ni duplicación en ninguna capa.
- Segura y sin secretos hardcodeados.
- Compatible con la arquitectura existente.
- Limitada estrictamente al alcance autorizado.
- Sin decisiones inventadas ni cambios colaterales.
- Sin consultas innecesarias ni fetching redundante.
- Sin monolitos de código.

---

## 1. Alcance

Estas reglas aplican a todo el repositorio.

---

## 2. Jerarquía de instrucciones

Las decisiones se resuelven con el siguiente orden de precedencia:

1. Solicitud explícita, actual y confirmada del usuario.
2. Este archivo `AGENTS.md`.
3. La fuente de verdad visual [`desing.md`](./desing.md).
4. Contratos, tipos y documentación oficial del proyecto.
5. Patrones ya implementados y utilizados de forma consistente.
6. Convenciones oficiales del framework o librería existente.

Se conserva el nombre exacto `desing.md` porque así existe en el proyecto.

### 2.1 Resolución de conflictos

- Una instrucción inferior nunca puede contradecir una superior.
- Una petición visual no autoriza cambios funcionales.
- Una petición funcional no autoriza un rediseño completo.
- Una petición localizada no autoriza un refactor global.
- Una corrección no autoriza "mejoras" adicionales.
- Una captura o referencia visual no sustituye los contratos funcionales existentes.
- Si una petición contradice una regla superior, se DEBE detener la implementación y explicar el conflicto.

---

## 3. Principio de autorización explícita

El agente DEBE realizar únicamente los cambios necesarios para cumplir la solicitud actual.

Está **PROHIBIDO**:

- Inventar requisitos.
- Suponer preferencias no expresadas.
- Añadir funcionalidades "útiles" no solicitadas.
- Rediseñar áreas adyacentes.
- Cambiar textos, nombres o flujos sin autorización.
- Eliminar elementos porque parezcan redundantes.
- Sustituir lógica existente por una alternativa preferida por el agente.
- Introducir animaciones, colores, librerías o patrones por gusto personal.
- Completar decisiones ambiguas que puedan afectar datos, comportamiento o UX sustancial.
- Dejar cambios preventivos para problemas no demostrados.

Si una decisión puede alterar sustancialmente el comportamiento, los datos, la seguridad, el alcance o la experiencia del usuario, el agente DEBE preguntar antes de actuar.

**Excepción controlada:** la eliminación de código muerto **interno y sin consumidor** dentro de los archivos tocados por la solicitud no se considera cambio fuera de alcance; es cierre limpio de la tarea (ver §40). La eliminación de código muerto **fuera** de los archivos tocados, o con apariencia de export público, requiere autorización explícita.

---

## 4. Investigar antes de modificar

Antes de crear, editar, eliminar o mover código, el agente DEBE buscar y comprender lo que ya existe.

### 4.1 Preflight obligatorio

Antes de implementar cualquier cambio:

1. Delimitar el alcance exacto solicitado.
2. Identificar las rutas, páginas, componentes y archivos afectados.
3. Leer este `AGENTS.md`.
4. Leer las secciones relevantes de `desing.md`.
5. Inspeccionar los tokens y primitivas existentes.
6. Buscar componentes equivalentes antes de crear uno nuevo.
7. Buscar utilidades, hooks, servicios, schemas y tipos reutilizables.
8. Identificar la fuente real de los datos.
9. Identificar contratos, estados, acciones y permisos que deben conservarse.
10. Revisar cómo se resuelve el mismo patrón en otras áreas autorizadas del proyecto.
11. Auditar código muerto y duplicación en los archivos afectados y sus vecinos: imports sin uso, exports sin consumidor, selectores huérfanos, tokens sin uso, tipos duplicados, constantes repetidas.
12. Determinar los estados de carga, vacío, error, éxito y sin resultados aplicables.
13. Definir primero el comportamiento móvil y después tablet, desktop y wide.
14. Elegir la solución completa menos invasiva.
15. Identificar cómo se verificará el resultado antes de editar.

El agente NO DEBE empezar a escribir código sin completar este análisis.

### 4.2 Buscar no significa modificar

Durante la investigación:

- No se deben aplicar cambios automáticos.
- No se debe formatear el repositorio completo.
- No se debe ejecutar una migración.
- No se deben actualizar dependencias.
- No se deben corregir problemas no relacionados.

---

## 5. Política de preguntas y decisiones

El agente DEBE preguntar antes de implementar cuando:

- Existan dos interpretaciones funcionales razonables.
- La petición pueda afectar datos o persistencia.
- Sea necesario modificar contratos, APIs o esquemas.
- Sea necesario cambiar autenticación o permisos.
- Se solicite eliminar o esconder información.
- No exista un patrón autorizado para una decisión relevante de UX.
- Dos alternativas cambien sustancialmente el flujo del usuario.
- Sea necesario añadir una dependencia.
- Una operación sea destructiva o difícil de revertir.
- La solicitud contradiga `AGENTS.md`, `desing.md` o el comportamiento actual.
- Falten credenciales, contratos o información indispensable.

No es necesario preguntar por decisiones internas menores cuando existe un patrón claro, documentado y ya utilizado.

Cuando sea necesario preguntar, se DEBE:

1. Explicar brevemente qué decisión está bloqueada.
2. Presentar las opciones reales.
3. Indicar el impacto de cada opción.
4. No implementar ninguna opción hasta recibir confirmación.

---

## 6. Preservación funcional

Salvo petición explícita, está **PROHIBIDO** cambiar:

- Reglas de negocio.
- Consultas o mutaciones.
- Contratos de API.
- Schemas de entrada o salida.
- Persistencia o almacenamiento.
- Autenticación o autorización.
- Roles y permisos.
- RLS.
- Supabase u otros proveedores.
- Integraciones externas.
- Rutas públicas o internas.
- Nombres de tablas, campos o eventos.
- Claves de almacenamiento.
- Cálculos, filtros u ordenamientos existentes.
- Significado, precisión o formato contractual de los datos.
- Analítica o telemetría.
- Estados funcionales ya disponibles.

Para un rediseño:

- Los mismos datos deben mantener el mismo significado.
- Las acciones existentes deben continuar disponibles.
- Los permisos deben conservarse.
- Solo puede cambiar la presentación autorizada.
- No se pueden sustituir datos reales por mocks, placeholders o contenido estático.

---

## 7. Fuente de verdad del sistema visual

La fuente de verdad visual es `desing.md`.

El agente NO DEBE copiar valores visuales arbitrarios desde capturas, herramientas de diseño o componentes aislados si ya existe un token equivalente.

### 7.1 Tokens obligatorios

Se DEBEN usar tokens para:

- Familias tipográficas.
- Tamaños tipográficos.
- Pesos.
- Line-height.
- Letter-spacing.
- Colores.
- Fondos.
- Bordes.
- Radios.
- Sombras.
- Opacidades.
- Espaciados.
- Paddings.
- Márgenes.
- Gaps.
- Alturas de controles.
- Anchos de contenedores.
- Breakpoints.
- Duraciones y curvas de animación.
- Z-index.
- Touch targets.
- Estados de foco.

Está **PROHIBIDO** hardcodear valores visuales si existe o debe existir un token semántico.

### 7.2 Valores visuales hardcodeados prohibidos

No introducir directamente en componentes o estilos:

- Hex, RGB, RGBA, HSL, HSLA u OKLCH.
- Colores CSS nombrados.
- `font-family` arbitrarias.
- Tamaños tipográficos arbitrarios.
- Pesos tipográficos fuera del sistema.
- Line-heights o trackings inventados.
- Márgenes, paddings o gaps sin token.
- Radios sin token.
- Sombras manuales.
- Anchos o alturas repetidos sin significado semántico.
- Z-index arbitrarios.
- Breakpoints no documentados.
- Duraciones de animación inventadas.

Si falta un token necesario:

1. Buscar primero un token semánticamente equivalente.
2. Confirmar que el nuevo valor será reutilizable.
3. Añadirlo en la fuente central de tokens.
4. Nombrarlo por función, no por apariencia ni por página.
5. Documentar su propósito.
6. No crear un token para ocultar un valor accidental o de uso único.

### 7.3 Excepciones controladas

Pueden utilizarse valores estructurales cuando sean técnicamente inevitables:

- `0`.
- `auto`.
- `inherit`.
- `currentColor`.
- Fracciones de grid.
- Porcentajes.
- `min-content`, `max-content` y `fit-content`.
- `aspect-ratio`.
- Conteos de columnas.
- Hairline documentado.
- Valores calculados realmente en runtime.
- Coordenadas dinámicas de portales o elementos flotantes.

Las excepciones no autorizan magic numbers repetidos.

### 7.4 Optimización y auditoría de tokens

La calidad del sistema de tokens es un requisito, no un extra.

- **DEBE** existir un único token por significado semántico. Dos tokens con el mismo valor y misma función son un error.
- **PROHIBIDO** duplicar tokens con el mismo valor y propósito bajo nombres distintos.
- **PROHIBIDO** dejar tokens huérfanos: todo token definido DEBE tener al menos un consumidor real o estar documentado como reservado con fecha de retiro.
- **OBLIGATORIO** auditar la escala antes de añadir un token nuevo. Si el valor ya existe con otra función, se DEBE reutilizar o renombrar, no duplicar.
- Los tokens DEBEN nombrarse por **función semántica** (`--color-surface-card`), no por apariencia (`--color-blanco-hueso`) ni por página (`--color-dashboard-bg`).
- Los tokens numéricos de una misma familia DEBEN seguir una progresión coherente y documentada. No se permiten saltos arbitrarios ni valores intermedios inventados.
- Cuando un token deje de usarse, DEBE eliminarse en el mismo cambio autorizado. No se acumulan tokens legacy.
- La fuente central de tokens es única. **PROHIBIDO** definir tokens locales de feature que repliquen tokens globales.
- Los alias obsoletos (`--spacing-*` en px, `--tracking-*`) no deben propagarse a código nuevo.

---

## 8. Sistema de color

Los valores exactos de cada token (claro y oscuro) viven únicamente en `desing.md` y `src/styles/global.css`. Este apartado fija las reglas de uso.

- `{colors.primary}` (azul #12469C) es el único color estructural de acción: CTA principal, navegación seleccionada y logo.
- `{colors.link}` (azul accesible) se reserva exclusivamente para enlaces. No rellena filas de navegación ni botones.
- El foco visible usa `{colors.focus}`: outline neutro de 2px, sin offset. Las superficies invertidas y `forced-colors` conservan sus colores de foco dedicados.
- `{colors.canvas}` es el suelo continuo de página y workspace.
- `{colors.canvas-soft}` agrupa regiones tranquilas.
- `{colors.surface-card}` contiene cards y paneles de contenido.
- `{colors.canvas-elevated}` se usa en inputs, menús, diálogos y superficies de detalle.
- Texto: escalera deliberada `{colors.ink}` → `{colors.body}` → `{colors.mute}` → `{colors.faint}`. Nunca negro puro para texto de producto.
- Bordes: `{colors.hairline}` en cards y divisores; `{colors.control-border}` en inputs, selects, botones secundarios, checkboxes, switches e icon buttons.
- Estados semánticos: el color base (`success`, `warning`, `error`) es para indicadores e iconos; el texto usa `success-text`, `warning-text` y `error-text`/`error-deep`.
- Los colores violeta, cian, rosa, magenta, gradientes y acentos de series son exclusivamente decorativos o de compatibilidad localizada.
- Los colores decorativos no pueden estructurar navegación, formularios, tabs, filtros o botones.
- No se debe introducir un segundo color estructural. El azul de fondo usa `--color-primary`; el texto azul sobre superficies usa `--color-primary-text`; las etiquetas sobre el primario usan `--color-on-primary` (#E6EDF3). La pareja aprobada de fondo y texto supera 7:1; conservar este contraste al ajustar estados.
- Los tokens de documento (`document-*`) son independientes del tema y solo aplican a salidas imprimibles o exportadas.
- El color nunca debe ser la única forma de comunicar estado.
- Los estados semánticos deben ser puntuales, comprensibles y accesibles.
- No se debe pintar un contenedor completo si basta un mensaje, icono o indicador localizado.
- Todo contraste debe cumplir WCAG 2.2 AA: 4.5:1 en texto y 3:1 en bordes de control, foco e indicadores.

Antes de utilizar texto muted o faint, se DEBE comprobar su contraste sobre la superficie real.

---

## 9. Tipografía

- Usar únicamente las familias definidas en `desing.md`: **Plus Jakarta Sans** autoalojada para cuerpo, controles y headings, y el stack monoespaciado solo para código y eyebrows técnicos.
- No descargar ni simular Cal Sans u otra fuente sin permiso.
- Usar los tokens tipográficos completos, no solo el tamaño: cada regla aplica familia, tamaño, peso, line-height y tracking del mismo rol (`--type-<rol>-*`).
- El tracking forma parte del rol. Los alias `--tracking-*` están obsoletos.
- Headings y botones usan peso 600 con tracking negativo en display; navegación puede usar 500; el body conserva 400.
- Las etiquetas cortas en mayúsculas (encabezados de tabla, eyebrows, tags) usan el rol `caption-up`. No usar mayúsculas extensas para contenido de lectura.
- No elegir un elemento HTML por su apariencia visual.
- La jerarquía HTML y la jerarquía visual deben ser coherentes.
- Cada página debe tener un solo `h1`.
- Los niveles de heading no deben saltarse sin una razón semántica.
- No reducir texto esencial para hacerlo encajar.
- El zoom del navegador no debe romper el contenido.
- No impedir el escalado de texto.

### 9.1 Cohesión tipográfica obligatoria

- **PROHIBIDO** inventar tamaños intermedios fuera de la escala tipográfica documentada.
- **PROHIBIDO** combinar en un mismo nivel jerárquico dos roles tipográficos distintos por conveniencia.
- Los pesos permitidos son únicamente los definidos en `desing.md`. Introducir pesos nuevos requiere justificación y token propio.
- El tracking DEBE provenir del rol, nunca de un valor ad hoc.
- Dentro de una misma familia de componentes (cards, listas, formularios, tablas, diálogos), los roles tipográficos deben ser consistentes entre instancias equivalentes.
- Un mismo tipo de mensaje (error, ayuda, vacío, metadato) usa siempre el mismo rol.
- No se permite mezclar `rem`, `px` y `em` en la misma regla tipográfica si la escala ya está definida en una unidad.

---

## 10. Espaciado, geometría y elevación

- Usar exclusivamente la escala de `desing.md` (base 4px): 4 · 8 · 12 · 16 · 24 · 32 · 40 · 64 · 96 · 128, expuesta como `--design-spacing-*`.
- La escala `--spacing-*` es legado: conserva valores en px porque el generador del pase en canvas la lee como número; `--spacing-xxs` y `--spacing-2xl` son alias obsoletos.
- Las distancias equivalentes deben utilizar el mismo token.
- Los componentes hermanos deben compartir ritmo y dimensiones.
- Radios según la geometría compacta aprobada en `desing.md`:
  - Botones, tabs y navegación: 10px mediante `--radius-control`.
  - Inputs, selects, textareas y buscadores: 10px mediante `--radius-field`.
  - Cards y medios: 16px mediante `--radius-card` y `--radius-media`.
  - Menús y popovers: 12px mediante `--radius-menu`.
  - Modales y paneles flotantes: 20px mediante `--radius-dialog`.
  - Marca de aplicación: 12px mediante `--radius-brand`, sin porcentajes.
  - Indicadores de checkbox: 4px.
  - Badges de estado, avatares y botones solo-icono: `{rounded.full}`.
- Los controles ordinarios son rectangulares con esquinas suaves. Las píldoras se reservan para etiquetas de estado; los campos conservan su radio propio y no se convierten en píldoras.
- Todo control interactivo tiene un mínimo explícito de 44px (`--touch-target-min`); la altura nunca se infiere solo del line-height.
- Las cards deben utilizar hairline y la elevación definida: Level 0 plano, Level 1 `{shadows.xs}`, Level 2 `{shadows.sm}` solo para menús, modales y popovers.
- Está prohibido introducir sombras pesadas, glows o gradientes en el chrome de la aplicación.
- No utilizar margen para compensar un problema estructural que debe resolverse con layout.
- No acumular overrides para corregir una regla anterior.
- No usar offsets negativos salvo que formen parte de un patrón documentado.

### 10.1 Prohibición de full rounded

- **PROHIBIDO** usar `border-radius: 9999px`, `50%` o cualquier valor que produzca forma de píldora en: botones, inputs, selects, textareas, cards, tabs, menús, modales, popovers, paneles, filas de navegación, segmented controls.
- El full rounded se reserva **únicamente** para: badges de estado, avatares y botones solo-icono.
- La marca de aplicación usa `--radius-brand` (12px), nunca forma circular completa.
- Un checkbox no se redondea a píldora; su indicador usa el radio definido.

Si una dimensión nueva se repite o representa una función estable, debe convertirse en token semántico.

---

## 11. Responsive: móvil, tablet, desktop y wide

El estilo base corresponde siempre a móvil. Tablet, desktop y wide se añaden progresivamente mediante los breakpoints existentes.

**PC/desktop es obligatorio, no opcional.** No basta con "que se vea bien en móvil": la experiencia debe estar resuelta en los cuatro rangos.

### 11.1 Requisitos obligatorios

- No diseñar primero desktop para luego reducirlo.
- No depender de scroll horizontal para contenido principal.
- Todo layout debe funcionar con contenido dinámico.
- Los elementos flexibles deben considerar `min-width: 0`.
- Los grids fluidos deben usar `minmax(0, 1fr)` cuando corresponda.
- Imágenes y medios deben tener dimensiones responsivas.
- El texto debe envolver o truncarse de forma intencional.
- El truncado no debe ocultar información indispensable.
- Las barras fijas no deben tapar contenido.
- Se deben respetar safe areas.
- Los controles táctiles deben cumplir el touch target mínimo definido.
- Las tablas deben adaptarse mediante un patrón autorizado, no simplemente desbordarse.
- Las acciones principales deben permanecer accesibles en móvil.
- No ocultar funcionalidad esencial por falta de espacio.
- Desktop DEBE aprovechar el espacio disponible: no dejar layouts móviles estirados sin estructura.
- Wide DEBE tener un ancho máximo legible; no se permite texto que cruce pantallas completas sin contenedor.

### 11.2 Verificación mínima

Cada cambio visual debe revisarse **obligatoriamente** en los cuatro rangos:

- Móvil estrecho (≈320–375px).
- Móvil estándar (≈375–430px).
- Tablet (≈768–1024px).
- Desktop (≈1280–1440px).
- Wide (≥1440px).

También debe verificarse con:

- Texto largo.
- Datos faltantes.
- Números grandes.
- Zoom aumentado.
- Varias filas o resultados.
- Estados de error y vacío.

Ningún cambio visual se declara terminado si no fue verificado en los cuatro rangos.

---

## 12. Alineación de controles

Para toolbars, formularios, filtros y filas de acciones:

- Labels equivalentes deben compartir token tipográfico y altura visual.
- Inputs, selects, botones y segmented controls hermanos deben compartir altura exterior.
- La altura exterior incluye contenido, padding y border.
- No se debe combinar `min-height` y padding de forma que rompa la alineación.
- Los controles con label deben alinearse por la fila del control.
- Las acciones sin label deben reservar correctamente el espacio correspondiente.
- Los títulos laterales deben alinearse con los controles, no con el centro del bloque completo.
- Los gaps horizontales y verticales deben provenir de la misma escala.
- Los mensajes de validación no deben desplazar de forma incoherente una sola columna.
- Una alineación "casi correcta" se considera incorrecta.

---

## 13. Accesibilidad obligatoria

Toda implementación debe cumplir **WCAG 2.2 nivel AA como mínimo**, con el umbral **8.1.1** de la evaluación interna del proyecto como piso obligatorio.

La accesibilidad no es aspiracional: es bloqueante. Un cambio que no cumple estos criterios se considera **NO terminado**.

### 13.1 HTML semántico

Preferir elementos nativos:

- `button`
- `a`
- `label`
- `input`
- `select`
- `textarea`
- `fieldset`
- `legend`
- `table`
- `ul` y `ol`
- `nav`
- `main`
- `section`
- `article`
- `header`
- `footer`
- `dialog`

Está prohibido convertir un `div`, `span` o `article` en control interactivo cuando exista un elemento nativo adecuado.

### 13.2 Formularios

- Todo campo debe tener label accesible.
- Placeholder no reemplaza label.
- Los campos obligatorios deben identificarse programáticamente.
- Los errores deben vincularse al campo correspondiente.
- Utilizar `aria-describedby` cuando exista ayuda o error asociado.
- No borrar la entrada del usuario ante un error.
- Los mensajes deben explicar cómo corregir el problema.
- Los grupos relacionados deben usar `fieldset` y `legend` cuando corresponda.
- El autocomplete debe configurarse con valores válidos cuando sea aplicable.

### 13.3 Interacción y teclado

- Toda acción debe funcionar con teclado.
- El orden de foco debe ser lógico.
- El foco debe ser visible.
- No usar `tabindex` positivo.
- No atrapar el foco fuera de un modal.
- Al cerrar un modal, devolver el foco al disparador cuando corresponda.
- `Escape` debe cerrar overlays cuando el patrón lo permita.
- No depender exclusivamente de hover.
- No introducir keyboard traps.

### 13.4 ARIA

ARIA se utiliza únicamente cuando HTML nativo no expresa el patrón.

- Botones de icono deben tener nombre accesible.
- Elementos expandibles deben exponer `aria-expanded`.
- Utilizar `aria-controls` cuando exista un panel controlado identificable.
- Toggles deben exponer `aria-pressed` o el patrón correcto.
- Tabs deben seguir el patrón ARIA completo.
- Estados de carga relevantes deben anunciarse.
- No duplicar regiones `aria-live`.
- No añadir roles redundantes o incorrectos.
- IDs utilizados por ARIA deben ser únicos y estables.

### 13.5 Movimiento y medios

- Respetar `prefers-reduced-motion`.
- No utilizar animaciones indispensables para comprender una acción.
- Evitar parpadeos o cambios rápidos.
- Imágenes informativas requieren texto alternativo útil.
- Imágenes decorativas deben ignorarse para lectores de pantalla.
- No repetir en `alt` el texto visible adyacente.
- Vídeos relevantes deben contemplar subtítulos o alternativa equivalente.

### 13.6 Umbral mínimo

- Contraste de texto: **≥ 4.5:1** (AA). Texto grande: **≥ 3:1**.
- Contraste de bordes de control, foco e indicadores: **≥ 3:1**.
- Touch targets: **≥ 44×44px**.
- Foco visible en todos los elementos interactivos.
- Todo flujo principal operable solo con teclado.
- Sin dependencia exclusiva de color, hover o tooltip.
- Verificación manual con lector de pantalla cuando el cambio lo justifique.
- Un cambio que baje de estos umbrales se considera regresión y **NO DEBE** mergearse.

---

## 14. Reutilización antes de creación

Antes de crear un componente, hook, utilidad o estilo, se DEBE buscar en:

1. El sistema descrito en `desing.md`.
2. Las primitivas UI existentes en `src/components/ui`.
3. La feature relacionada.
4. Componentes compartidos autorizados.
5. Hooks, servicios y utilidades existentes.

### 14.1 Reglas de reutilización

- Reutilizar componentes existentes cuando cubran el mismo propósito.
- Extender mediante variantes explícitas antes de duplicar.
- No crear wrappers sin responsabilidad real.
- No duplicar markup extenso.
- No duplicar lógica.
- No copiar CSS para pisar la fuente original.
- No convertir un componente compartido en un conjunto de condiciones específicas de una sola página.
- Las APIs de componentes deben ser pequeñas, tipadas y comprensibles.
- La composición se prefiere sobre props booleanas acumulativas.

### 14.2 Creación de primitivas

- Si no existe primitiva para un patrón recurrente, **DEBE crearse** en `src/components/ui` siguiendo el sistema de `desing.md`.
- Toda primitiva nueva DEBE:
  - Usar tokens exclusivamente.
  - Tener props tipadas y documentadas.
  - Exponer variantes explícitas (`variant`, `size`, `tone`) en lugar de booleanos acumulativos.
  - Cubrir estados: default, hover, focus, active, disabled, loading, error.
  - Ser accesible por teclado y lector de pantalla.
  - Funcionar en móvil, tablet, desktop y wide.
  - Exportar sus tipos.
- **PROHIBIDO** crear una primitiva paralela que duplique una existente con distinto nombre.
- **PROHIBIDO** introducir primitivas específicas de una feature en `src/components/ui`; esas viven en la feature.
- Toda primitiva DEBE tener al menos un consumidor real. No se crean primitivas "por si acaso".
- Si un patrón aparece dos veces o tiene una probabilidad razonable de repetirse, debe evaluarse su extracción. No se debe abstraer prematuramente un detalle accidental.

---

## 15. Arquitectura y responsabilidades

- Cada componente debe tener una responsabilidad principal.
- Separar presentación, estado y acceso a datos cuando la arquitectura existente lo haga.
- No realizar llamadas de red directamente desde componentes visuales si existe una capa de servicio.
- No duplicar estado derivable.
- No sincronizar estados mediante efectos si puede calcularse durante render.
- Evitar componentes monolíticos.
- Evitar archivos que mezclen múltiples dominios sin necesidad.
- Mantener el código de una feature dentro de su alcance.
- No añadir selectores CSS globales salvo tokens, reset o primitivas reales.
- No introducir dependencias circulares.
- No mover archivos sin necesidad funcional.
- No cambiar exports públicos sin verificar todos sus consumidores.

---

## 16. TypeScript y calidad de código

- TypeScript debe mantenerse en modo estricto.
- Está prohibido introducir `any` evitable.
- No utilizar casts ciegos para silenciar errores.
- Los datos `unknown` deben validarse mediante schemas o type guards.
- No utilizar non-null assertions sin una garantía demostrable.
- No ignorar errores del compilador.
- No desactivar reglas de lint sin justificación localizada.
- No dejar imports, variables, funciones, estilos o selectores muertos (ver §40).
- No dejar bloques comentados de código antiguo (ver §40).
- No introducir lógica duplicada (ver §40).
- Usar nombres descriptivos y consistentes.
- Las funciones deben tener una única responsabilidad.
- Las keys deben ser únicas y estables.
- No usar índices como key si existe identidad real.
- Los errores no se deben silenciar.
- Los errores esperados deben manejarse explícitamente.
- No realizar refactors ajenos a la solicitud.

---

## 17. Datos, APIs y contratos

- Tratar los contratos existentes como públicos hasta demostrar lo contrario.
- No cambiar nombres, tipos o nulabilidad sin autorización.
- No asumir que una respuesta externa es válida.
- Validar datos en los límites del sistema.
- Diferenciar entre error de red, autorización, validación y servidor.
- No exponer mensajes internos o stack traces al usuario.
- No destruir datos válidos por una respuesta parcial.
- No realizar mutaciones optimistas si el patrón no existe o no es seguro.
- Evitar condiciones de carrera.
- Cancelar o ignorar respuestas obsoletas cuando corresponda.
- Mantener consistencia entre caché, interfaz y servidor.
- No introducir polling o reintentos sin límites.
- No ocultar errores detrás de fallbacks silenciosos.
- Las fechas, monedas y números deben formatearse con utilidades centralizadas y locale adecuado.
- No asumir timezone, idioma o formato regional sin una fuente definida.

### 17.1 Consultas y fetching: sin redundancia

Está **PROHIBIDO** introducir consultas innecesarias o duplicadas.

- **PROHIBIDO** realizar la misma consulta más de una vez en el mismo árbol de render si los datos ya están disponibles.
- **PROHIBIDO** re-fetchear datos que la capa de caché ya tiene frescos.
- **OBLIGATORIO** deduplicar peticiones concurrentes idénticas.
- **OBLIGATORIO** cancelar peticiones obsoletas con `AbortController` o mecanismo equivalente del stack.
- **PROHIBIDO** crear waterfalls de fetching evitables (A → B → C secuencial cuando pueden resolverse en paralelo o precargarse).
- **PROHIBIDO** polling sin límite, sin intervalo justificado y sin limpieza al desmontar.
- **PROHIBIDO** reintentos infinitos o sin backoff.
- **OBLIGATORIO** invalidar caché de forma coherente tras mutaciones.
- **PROHIBIDO** fetchear en `useEffect` cuando existe capa de servicio, caché o loader del framework que lo resuelve.
- **PROHIBIDO** prefetch "por si acaso" sin justificación de UX o rendimiento.
- **OBLIGATORIO** distinguir entre estado `stale`, `fetching` y `fresh` cuando el patrón lo requiera.
- Los loaders y servicios DEBEN exponer estados de error y reintento explícitos, no silenciosos.

Antes de añadir una consulta, el agente DEBE demostrar:

1. Qué dato falta.
2. Por qué no está ya disponible.
3. Dónde vive la caché o el estado existente.
4. Por qué no puede derivarse localmente.

---

## 18. Seguridad y configuración

Está **PROHIBIDO** hardcodear:

- Contraseñas.
- Tokens.
- API keys.
- Secrets.
- URLs privadas.
- Credenciales.
- Identificadores sensibles.
- Connection strings.
- Datos personales.
- Configuración específica de un entorno.

### 18.1 Variables de entorno

- Utilizar las variables de entorno y mecanismos existentes.
- No exponer secretos del servidor al cliente.
- No incluir valores reales en ejemplos.
- No registrar secretos ni payloads sensibles.
- No añadir fallbacks inseguros.
- La ausencia de una variable obligatoria debe producir un error claro y temprano.
- No modificar archivos de entorno sin autorización.
- No eliminar variables existentes.

### 18.2 Seguridad de entrada y salida

- No confiar en datos del cliente.
- Validar y normalizar entradas.
- Escapar contenido cuando corresponda.
- No utilizar HTML sin sanitización.
- No construir consultas inseguras.
- Aplicar autorización en servidor, no únicamente en la interfaz.
- No revelar existencia de recursos restringidos.
- No ampliar permisos para resolver un error.
- Las operaciones sensibles deben comprobar autenticación, autorización y pertenencia.

---

## 19. Dependencias

No se debe añadir, eliminar ni actualizar una dependencia sin necesidad demostrada y autorización cuando afecte el alcance.

Antes de proponer una dependencia:

1. Buscar una solución con el stack existente.
2. Verificar si ya existe una utilidad equivalente.
3. Evaluar tamaño, mantenimiento, licencia y seguridad.
4. Confirmar compatibilidad con el proyecto.
5. Explicar por qué es necesaria.
6. Obtener autorización si introduce un nuevo proveedor o patrón.

Está prohibido actualizar dependencias de forma oportunista durante una tarea no relacionada.

---

## 20. Estados de interfaz y experiencia

Toda feature basada en datos debe contemplar, cuando aplique:

- Carga inicial.
- Actualización en segundo plano.
- Estado inicial.
- Estado vacío real.
- Sin coincidencias por filtros.
- Error recuperable.
- Error no recuperable.
- Éxito.
- Acción deshabilitada.
- Permisos insuficientes.
- Datos parciales.
- Contenido largo.
- Valores faltantes.
- Múltiples resultados.
- Reintento.
- Confirmación de acciones destructivas.

### 20.1 Reglas de comunicación

- Los mensajes deben ser claros, breves y accionables.
- No culpar al usuario.
- No mostrar códigos internos como mensaje principal.
- Un estado sin coincidencias debe permitir limpiar filtros.
- Un error no debe eliminar datos todavía utilizables.
- La carga no debe simular contenido definitivo.
- Evitar cambios de layout innecesarios durante la carga.
- Las acciones deshabilitadas deben tener una causa comprensible.
- La información esencial no puede depender solo de tooltip, hover o `title`.

---

## 21. Botones, acciones y navegación

- Utilizar `button` para acciones y `a` para navegación.
- No mezclar semánticas.
- La CTA principal debe ser única y clara dentro de su contexto.
- No usar la variante primaria para todas las acciones.
- Las acciones destructivas deben distinguirse sin romper el sistema.
- Evitar botones duplicados con la misma acción.
- Los estados loading deben impedir envíos duplicados cuando corresponda.
- Un botón loading debe mantener un nombre accesible.
- No cambiar el texto de una acción de forma ambigua.
- La navegación no debe perder parámetros o estado sin autorización.
- No utilizar `window.location` si el router existente ofrece el comportamiento correcto.

---

## 22. Páginas, modales, sheets y popovers

### 22.1 Páginas

- Cada página debe tener un único título principal.
- Evitar subtítulos puramente decorativos en el header.
- Mantener jerarquía clara entre contexto, contenido y acciones.
- No concentrar múltiples features principales en una sola vista sin necesidad.

### 22.2 Modales

- El header debe ser limpio.
- No añadir decoración innecesaria.
- Los modales de eliminación deben ser compactos.
- Un modal destructivo nunca debe ser fullscreen.
- El foco debe quedar contenido correctamente.
- Se debe devolver el foco al elemento disparador.
- La acción principal y cancelar deben ser inequívocas.
- No cerrar silenciosamente si existe información no guardada.

### 22.3 Selección del patrón

- No mezclar página, modal y sheet para el mismo flujo sin una razón funcional.
- Un fullscreen móvil solo se usa para procesos largos y cuando el patrón existente lo justifique.
- Los popovers no deben contener procesos complejos.
- Los tooltips no deben contener información indispensable ni controles.

---

## 23. CSS y estilos

- Priorizar tokens, primitivas y clases existentes.
- Evitar estilos inline.
- Los estilos inline solo se permiten para valores realmente calculados en runtime.
- No usar `!important` para resolver problemas de especificidad evitables.
- No aumentar especificidad de forma acumulativa.
- No duplicar reglas para sobrescribir una declaración anterior (ver §40).
- No usar selectores frágiles basados en estructura incidental.
- No aplicar estilos globales desde una feature.
- No usar nombres de clase ligados a un color o posición accidental.
- Las clases deben describir función o responsabilidad.
- No introducir CSS que afecte elementos fuera del alcance solicitado.
- No dejar selectores, keyframes, media queries o capas z-index huérfanos (ver §40).
- Respetar reduced motion, forced colors y preferencias del sistema cuando correspondan.

---

## 24. Rendimiento

- No optimizar sin medir, pero tampoco introducir regresiones evidentes.
- Evitar renders innecesarios demostrables.
- **PROHIBIDO** re-fetchear datos que ya están en caché o estado cuando la frescura es suficiente.
- **PROHIBIDO** duplicar peticiones idénticas en el mismo ciclo.
- **OBLIGATORIO** cancelar peticiones obsoletas.
- No memoizar todo por defecto; memoizar lo que demuestre impacto.
- No cargar código o datos antes de necesitarlos.
- Evitar bundles adicionales para utilidades triviales.
- Imágenes deben usar dimensiones y formatos adecuados.
- Evitar layout shifts.
- No bloquear la interacción con tareas costosas.
- Listas grandes deben seguir el patrón de rendimiento existente.
- No repetir consultas idénticas sin necesidad.
- No introducir listeners sin cleanup.
- No crear efectos con dependencias incorrectas.
- Mantener la accesibilidad aunque se aplique lazy loading o virtualización.

---

## 25. Testing y verificación

Ningún cambio se considera terminado sin verificación.

### 25.1 Verificación obligatoria

Según el alcance, se DEBE comprobar:

- Compilación.
- Type checking.
- Lint relevante.
- Tests existentes relacionados.
- Flujo principal.
- Estados alternativos.
- Navegación por teclado.
- Foco visible.
- Responsive en móvil, tablet, desktop y wide.
- Ausencia de overflow.
- Consola sin errores nuevos.
- Red sin llamadas fallidas introducidas.
- Ausencia de consultas duplicadas o innecesarias.
- Ausencia de código muerto introducido o mantenido en archivos tocados.
- Ausencia de duplicación introducida o mantenida en archivos tocados.
- Ausencia de selectores huérfanos, tokens sin consumidor, tipos y constantes duplicadas en el diff.
- Contratos de datos.
- Permisos.
- Regresión del comportamiento preservado.

### 25.2 Tests

- No modificar tests únicamente para hacerlos pasar si el comportamiento esperado sigue siendo válido.
- Corregir la causa, no ocultar el fallo.
- Añadir tests cuando se introduzca comportamiento nuevo autorizado.
- Los tests deben validar comportamiento observable, no detalles accidentales de implementación.
- No utilizar snapshots masivos para evitar assertions significativas.
- No eliminar cobertura existente.
- No declarar éxito basándose solo en que compila.

### 25.3 Verificación visual

Todo cambio visual debe comprobar:

- Móvil, tablet, desktop y wide.
- Texto largo.
- Zoom del navegador.
- Carga, vacío, error y éxito.
- Alineación de labels y controles.
- Touch targets.
- Focus.
- Contraste.
- Clipping.
- Overflow.
- Imágenes recortadas.
- Contenido dinámico.

---

## 26. Cambios mínimos y diff limpio

Antes de finalizar, el agente DEBE revisar el diff completo.

El diff debe:

- Contener únicamente archivos relacionados con la solicitud.
- Evitar cambios de formato innecesarios.
- No incluir archivos generados accidentalmente.
- No incluir secretos.
- No incluir logs ni datos temporales.
- No contener código comentado o muerto (ver §40).
- No incluir refactors no solicitados.
- Mantener convenciones existentes.

Si una herramienta produce cambios colaterales, estos deben revertirse antes de finalizar.

---

## 27. Operaciones destructivas y migraciones

Requieren autorización explícita:

- Eliminar archivos.
- Eliminar datos.
- Renombrar rutas públicas.
- Renombrar tablas o campos.
- Modificar schemas persistentes.
- Ejecutar migraciones.
- Cambiar permisos.
- Invalidar sesiones.
- Regenerar archivos en masa.
- Sustituir una dependencia central.
- Cambiar configuración de producción.
- Romper compatibilidad hacia atrás.

Antes de una operación destructiva, el agente debe explicar:

1. Qué se cambiará.
2. Por qué es necesario.
3. Qué impacto tendrá.
4. Cómo se verificará.
5. Qué alternativa no destructiva existe.

Sin confirmación, no debe ejecutarse.

---

## 28. Comentarios y documentación

- El código debe ser comprensible por estructura y nombres.
- Los comentarios deben explicar el porqué, no repetir el qué.
- No añadir comentarios obvios.
- Documentar contratos, decisiones no evidentes y restricciones reales.
- Actualizar documentación únicamente cuando el cambio autorizado la afecte.
- No inventar ejemplos que parezcan datos reales.
- No dejar documentación contradiciendo la implementación.
- No usar documentación para justificar una excepción no autorizada.

---

## 29. Protocolo de actuación de Gemini 3.1 Pro

Ante cualquier solicitud de desarrollo, Gemini 3.1 Pro DEBE seguir este orden:

### Fase 1 — Comprender

1. Resumir internamente el objetivo.
2. Separar requisitos explícitos de suposiciones.
3. Detectar ambigüedades y riesgos.
4. Confirmar el alcance autorizado.

### Fase 2 — Investigar

1. Leer `AGENTS.md`.
2. Leer las secciones relevantes de `desing.md`.
3. Inspeccionar archivos afectados.
4. Buscar componentes, tokens y utilidades existentes.
5. Revisar contratos y tests relacionados.
6. Auditar código muerto y duplicación en los archivos afectados.
7. No editar todavía.

### Fase 3 — Decidir

1. Elegir la solución menos invasiva.
2. Preservar lógica y contratos.
3. Determinar si hace falta preguntar.
4. Evitar nuevas dependencias.
5. Preparar una lista concreta de archivos autorizados.

### Fase 4 — Implementar

1. Realizar cambios pequeños y focalizados.
2. Reutilizar antes de crear.
3. Utilizar tokens, no valores hardcodeados.
4. Mantener accesibilidad y responsive en los cuatro rangos.
5. Eliminar código muerto interno en archivos tocados.
6. No tocar archivos fuera del alcance.

### Fase 5 — Verificar

1. Revisar compilación y tipos.
2. Ejecutar pruebas relevantes.
3. Verificar el flujo manualmente.
4. Revisar responsive en móvil, tablet, desktop y wide.
5. Revisar accesibilidad y foco.
6. Revisar consola y red.
7. Ejecutar herramientas de detección de código muerto y duplicación.
8. Revisar el diff completo.

### Fase 6 — Informar

La respuesta final debe indicar:

- Qué se cambió.
- Qué archivos se modificaron.
- Qué comportamiento se preservó.
- Cómo se verificó.
- Qué código muerto o duplicación se eliminó.
- Qué limitación o riesgo permanece, si existe.

No debe afirmar que algo está terminado o corregido sin haberlo verificado.

---

## 30. Política contra invenciones

Si falta información, el agente NO DEBE:

- Inventar datos.
- Inventar endpoints.
- Inventar componentes existentes.
- Inventar tokens.
- Inventar credenciales.
- Inventar reglas de negocio.
- Inventar resultados de tests.
- Inventar que un archivo fue revisado.
- Inventar que un flujo funciona.
- Crear mocks presentándolos como integración real.
- Declarar que una incidencia está resuelta sin reproducción y verificación.

Si se utiliza un placeholder autorizado, debe estar claramente identificado y no confundirse con datos reales.

---

## 31. Política cuando `desing.md` no cubra un caso

Cuando el sistema visual no documente una situación:

1. Buscar un patrón equivalente ya implementado.
2. Buscar una primitiva existente.
3. Elegir la variante más simple y neutral.
4. Conservar la lógica.
5. Utilizar tokens existentes.
6. No añadir colores, animaciones o patrones por preferencia personal.
7. Preguntar si las alternativas cambian sustancialmente la UX.

No debe crearse un subsistema visual paralelo.

---

## 32. Definición de terminado

Un trabajo solo está terminado cuando:

- Cumple exactamente la solicitud.
- No contiene cambios no autorizados.
- Preserva lógica, datos, contratos y permisos.
- Reutiliza patrones existentes.
- No contiene hardcoding visual evitable.
- No introduce consultas innecesarias ni duplicadas.
- No introduce código muerto ni duplicación en TypeScript, CSS global, CSS de feature, tokens, tipos, assets ni configuración.
- No deja selectores huérfanos, tokens sin consumidor ni exports sin referencia dentro del alcance.
- La duplicación fuera del alcance fue reportada, no ocultada.
- Cumple WCAG 2.2 AA y umbral 8.1.1.
- Funciona con teclado.
- Tiene foco visible.
- Es mobile-first y verificado en móvil, tablet, desktop y wide.
- No presenta overflow ni clipping.
- Funciona con contenido dinámico.
- Contempla los estados aplicables.
- Mantiene TypeScript y lint sin errores nuevos.
- Pasa las pruebas relevantes.
- El flujo fue verificado.
- El diff está limpio.
- No quedan errores conocidos ocultos.
- No supera los límites de tamaño de archivo sin justificación.
- La respuesta final describe la verificación real.

Si cualquiera de estos puntos falla, el trabajo se considera **NO terminado**.

---

## 33. Imports y resolución de módulos

- **DEBE** verificar que el paquete importado existe en el manifest (`package.json`) y que la ruta de importación es la correcta.
- **PROHIBIDO** importar desde el nombre base de un paquete monorepo cuando se requiere el subpaquete específico del framework (ej. `'lucide'` vs `'lucide-react'`).
- **DEBE** unificar imports del mismo paquete en una sola declaración; **PROHIBIDO** dejar imports duplicados del mismo símbolo desde rutas diferentes.
- **PROHIBIDO** importar un símbolo que ya fue importado con otro alias o desde otra ruta del mismo paquete.
- Si una librería ofrece variantes de framework, **DEBE** usarse la que corresponde al stack del proyecto (React, Vue, Svelte, etc.).
- Los imports de tipos **DEBEN** usar `import type` cuando la herramienta de build lo soporte.

---

## 34. Keys y estabilidad en listas React

- Las `key` en listas React **DEBEN** derivarse de identidad real y estable (ej. `id` persistente, `num_empleado`, UUID).
- **PROHIBIDO** usar fechas, timestamps o valores mutables como parte de la `key`.
- **PROHIBIDO** usar índices de array como `key` cuando existe identidad real.
- Una `key` inestable causa remounts innecesarios, pérdida de estado local y regresiones de rendimiento.
- Si la identidad real no está disponible, **DEBE** construirse un identificador estable a partir de campos inmutables, nunca de datos que cambien entre renders.

---

## 35. Efectos, derivación de estado y sincronización

- **PROHIBIDO** usar `useEffect` para sincronizar estado derivado que puede calcularse directamente durante render o mediante `useMemo`.
- **PROHIBIDO** usar dependencias de `useEffect` que cambien en cada render si el efecto resetea estado visible o interactivo del usuario (ej. filtros, selecciones, expansión).
- **DEBE** preferir cálculo directo o `useMemo` sobre `useEffect` + `setState` para estado derivado.
- Si un efecto debe reaccionar a entrada continua del usuario (typing, scroll, resize), **DEBE** aplicarse debounce o throttling cuando sea pertinente.
- **PROHIBIDO** dejar efectos que causen loops de render o que reescriban estado que ya fue establecido por el usuario.
- **PROHIBIDO** disparar fetching en cascada desde efectos cuando puede resolverse con loader, servicio o paralelización.

---

## 36. Herramientas de formato y calidad automática

- Prettier y ESLint **DEBEN** estar configurados y ser la fuente de verdad para formato, indentación, comillas y orden de imports.
- **PROHIBIDO** corregir indentación, comillas, espaciado u orden de imports manualmente cuando la herramienta puede hacerlo automáticamente.
- El diff de entrega **DEBE** excluir cambios de formato puro si no son parte de la solicitud; en su lugar, **DEBE** ejecutarse el formatter sobre el archivo completo en un paso separado o previo.
- **PROHIBIDO** introducir código que falle lint, typecheck o compilación existente.
- Si una regla de lint o format debe modificarse, requiere autorización explícita y justificación documentada.

---

## 37. Tamaño de archivos y extracción de responsabilidades

Los límites son duros. Superarlos exige justificación documentada en el propio archivo y aprobación.

- Componentes UI: **máximo 300 líneas**.
- Páginas/vistas: **máximo 400 líneas**.
- Hooks: **máximo 200 líneas**.
- Utilidades puras y helpers: **máximo 300 líneas por archivo**.
- Servicios y capa de datos: **máximo 300 líneas por archivo**.
- Archivos de tipos: **máximo 500 líneas**; dividir por dominio si excede.

Cuando un archivo excede el límite, **DEBE** extraerse:

- Helpers puros.
- Subcomponentes con responsabilidad propia.
- Type guards y validadores.
- Constantes y mapas de configuración.
- Hooks específicos.
- Lógica de presentación vs. lógica de datos.

Reglas de extracción:

- **PROHIBIDO** acumular funciones puras, type guards o helpers de más de 50 líneas dentro de un componente si se usan en más de un lugar o si su lectura dificulta la navegación.
- La extracción **DEBE** mantener el dominio funcional y **NO DEBE** crear dependencias circulares entre el componente padre y los archivos extraídos.
- Los subcomponentes extraídos **DEBEN** mantener su tipado completo y no asumir props del padre mediante `any` o spreads indiscriminados.
- Un archivo que mezcla múltiples dominios (presentación + fetching + validación + formateo) es un monolito y **DEBE** dividirse.

---

## 38. Checklist obligatorio de cierre

Antes de responder al usuario, confirmar:

### Alcance

- [ ] Se trabajó únicamente en el alcance solicitado.
- [ ] No existen cambios colaterales.
- [ ] No se realizó ningún refactor no solicitado.

### Diseño

- [ ] Se leyó y respetó `desing.md`.
- [ ] No existen colores hardcodeados.
- [ ] No existen fuentes o tamaños tipográficos arbitrarios.
- [ ] No existen paddings, márgenes o gaps fuera de tokens.
- [ ] No existen radios o sombras inventados.
- [ ] No se usa full rounded fuera de badges, avatares e icon-only.
- [ ] Los colores decorativos se usan únicamente como decoración.
- [ ] `{colors.primary}` sigue siendo el único color estructural de acción y `{colors.link}` se usa solo en enlaces.
- [ ] Los tokens tipográficos se aplican como rol completo.
- [ ] No se duplican tokens ni se dejan huérfanos.

### Responsive y accesibilidad

- [ ] La implementación es mobile-first.
- [ ] Se verificó en móvil estrecho, móvil estándar, tablet, desktop y wide.
- [ ] No existe overflow horizontal involuntario.
- [ ] No hay clipping ni texto roto.
- [ ] Los touch targets cumplen el mínimo.
- [ ] Los labels y controles están alineados.
- [ ] Los controles hermanos comparten altura exterior.
- [ ] El flujo funciona con teclado.
- [ ] El foco es visible.
- [ ] La semántica HTML es correcta.
- [ ] ARIA se utiliza solo cuando corresponde.
- [ ] El contraste cumple WCAG 2.2 AA y umbral 8.1.1.
- [ ] No se depende únicamente de color, hover o tooltip.

### Arquitectura y calidad

- [ ] Se buscaron componentes existentes antes de crear otros.
- [ ] Si faltaba primitiva, se creó en `src/components/ui` con variantes explícitas.
- [ ] No existe lógica o markup duplicado evitable.
- [ ] No existen imports, variables o estilos muertos.
- [ ] No se introdujo `any` evitable.
- [ ] No existen casts ciegos.
- [ ] No se añadieron dependencias innecesarias.
- [ ] No existen estilos inline evitables.
- [ ] No se ocultaron errores.
- [ ] No se inventaron contratos, datos o requisitos.
- [ ] Ningún archivo supera el límite sin justificación.

### Código muerto y duplicación

- [ ] No hay imports, variables, funciones, componentes, tipos ni constantes sin uso en archivos tocados.
- [ ] No hay exports sin consumidor en archivos tocados (o justificación si es API pública).
- [ ] No hay selectores huérfanos en `global.css` ni en CSS de feature.
- [ ] No hay `@keyframes`, media queries ni capas `z-index` sin consumidor.
- [ ] No hay tokens añadidos sin consumidor real.
- [ ] No hay tipos o constantes re-declarados cuando ya existen.
- [ ] No hay duplicación de componentes, hooks, utilidades ni lógica de fetch.
- [ ] No hay bloques de código comentado, `console.log` ni `debugger` olvidados.
- [ ] No hay assets, env vars ni fixtures huérfanos.
- [ ] La duplicación fuera del alcance fue reportada.

### Datos y consultas

- [ ] No hay consultas duplicadas ni re-fetch innecesario.
- [ ] Las peticiones concurrentes idénticas están deduplicadas.
- [ ] Las peticiones obsoletas se cancelan.
- [ ] No hay waterfall evitable.
- [ ] No hay polling sin límite ni reintentos infinitos.
- [ ] La caché se invalida de forma coherente.

### Estados y funcionalidad

- [ ] La lógica y los datos conservan su significado.
- [ ] Se revisaron carga, vacío, error y éxito cuando aplican.
- [ ] El estado sin coincidencias permite limpiar filtros.
- [ ] La información esencial permanece visible.
- [ ] Las acciones destructivas requieren confirmación.
- [ ] Los errores son claros y accionables.

### Verificación

- [ ] La compilación y los tipos son correctos.
- [ ] Se ejecutaron las pruebas relevantes.
- [ ] Se verificó el flujo principal.
- [ ] Se comprobaron estados alternativos.
- [ ] No existen errores nuevos en consola o red.
- [ ] Se revisó el diff completo.
- [ ] La respuesta final no afirma nada que no haya sido comprobado.

Si cualquier casilla aplicable falla, el agente DEBE continuar trabajando o informar claramente el bloqueo. No debe declarar la tarea terminada.

---

## 39. Principios UI/UX senior

Toda decisión visual debe poder justificarse ante un revisor senior. La estética personal no es un argumento.

- **Claridad sobre decoración.** Un cambio visual que añade ruido sin mejorar comprensión, jerarquía o acción se rechaza.
- **Consistencia interna.** Un mismo problema se resuelve igual en toda la app. Si una pantalla introduce un patrón distinto al ya establecido, DEBE justificarse.
- **Jerarquía explícita.** Cada pantalla tiene un `h1`, una acción principal y un orden de lectura claro. No compiten dos CTAs del mismo peso.
- **Feedback inmediato.** Toda acción del usuario produce respuesta visible: loading, éxito, error o confirmación.
- **Estados completos.** No se entrega una vista con solo el estado feliz. Carga, vacío, error, sin resultados y permisos insuficientes se diseñan.
- **Affordance honesta.** Un elemento que parece clickable lo es; uno que no lo es, no lo parece. Nada de falsos botones, falsos links o falsas cards.
- **Densidad controlada.** En desktop se aprovecha el espacio, pero no se rellena por rellenar. En móvil no se comprime todo: se prioriza.
- **Microcopy intencional.** Los textos de acción empiezan por verbo. Los errores explican cómo corregir. Los vacíos guían el siguiente paso.
- **Movimiento con propósito.** La animación comunica jerarquía, transición o feedback. Nunca decora ni retrasa.
- **No mezclar sistemas.** No conviven dos escalas tipográficas, dos radios, dos espaciados ni dos lenguajes visuales en la misma feature.
- **Estándar sobre preferencia.** Si el proyecto ya tiene un patrón documentado para un problema, ese patrón gana. Introducir uno nuevo requiere autorización.

Cualquier cambio que viole estos principios se considera regresión de UX y **NO DEBE** entregarse.

---

## 40. Código muerto y duplicación

Tolerancia cero. Cualquier cambio que introduzca, mantenga o no elimine código muerto o duplicación en cualquier capa se considera **NO terminado**.

Aplica a: TypeScript, TSX, CSS global, CSS de feature, CSS modules, tokens, tipos, assets, configuración, i18n, mocks, seeds, fixtures, scripts y documentación.

### 40.1 Qué cuenta como código muerto

- Imports nunca usados.
- Variables, parámetros, funciones, hooks, componentes nunca invocados o renderizados.
- Tipos, interfaces, enums y constantes nunca referenciados.
- Exports sin consumidor interno (verificar antes de eliminar si son API pública).
- Clases CSS, selectores y custom properties nunca aplicados.
- Reglas en `global.css` que no matchean ningún elemento actual.
- Media queries, `@supports` y `@layer` sin consumidores.
- `@keyframes` nunca referenciados.
- Declaraciones de `z-index` para capas que ya no existen.
- Bloques de código comentado.
- `console.log`, `debugger`, `TODO` huérfano sin issue asociada.
- Feature flags permanentemente en `false`/`true` sin plan de retiro.
- Fixtures, mocks, seeds y datos de prueba huérfanos.
- Assets (imágenes, iconos, fuentes, SVGs) no referenciados.
- Variables de entorno definidas y nunca leídas.
- Rutas, entradas de navegación y enlaces a páginas eliminadas.
- Tipos re-declarados por alias cuando ya existe el original.
- Estados, ramas y `case` inalcanzables.

### 40.2 Qué cuenta como duplicación

- Dos componentes con mismo propósito, mismo markup o misma API.
- Dos hooks que resuelven lo mismo.
- Dos utilidades que formatean/parsean lo mismo.
- La misma declaración CSS repetida cuando existe token o primitiva.
- Dos tokens con mismo valor y mismo significado (ver §7.4).
- Breakpoints declarados manualmente en lugar de usar el token.
- Tipos re-declarados en lugar de importados desde su fuente.
- Constantes, enums, mapas y magic strings repetidos.
- Lógica de fetch replicada en varios servicios o componentes.
- Mensajes de error formulados distinto para el mismo caso.
- Literales de string repetidos que deberían ser constantes.
- Patrones de accesibilidad reimplementados en lugar de usar primitiva.
- Selectores CSS que sobrescriben reglas existentes sin aportar función.

### 40.3 Reglas

- **Código muerto interno** (sin consumidores dentro del repo): se elimina en el mismo cambio si está en el alcance o en archivos tocados. No requiere autorización, es limpieza, no refactor.
- **Código muerto que parece público** (export desde `src/components/ui`, `src/lib` o entry público): requiere autorización antes de eliminar. Puede tener consumidores externos no visibles en el repo.
- **Duplicación dentro del alcance actual**: DEBE consolidarse antes de entregar.
- **Duplicación fuera del alcance**: se reporta, NO se corrige automáticamente. Sugerir como tarea aparte.
- **PROHIBIDO** introducir duplicación nueva "para no tocar lo existente". Si existe duplicación, la nueva pieza reutiliza o se coordina con la existente.
- **PROHIBIDO** dejar código comentado "por si acaso". El historial de git es el archivo.
- **PROHIBIDO** dejar `console.log`, `debugger` o warnings silenciados sin justificación documentada.
- **PROHIBIDO** dejar tokens sin consumidor. Si se añade un token, DEBE usarse en el mismo cambio o documentarse como reservado con fecha de retiro.
- **PROHIBIDO** dejar selectores huérfanos en `global.css`. Cada selector DEBE tener consumidor real o eliminarse.
- **PROHIBIDO** duplicar tipos entre archivos. Un tipo vive en un solo lugar; el resto importa.

### 40.4 Metodología de detección

Antes de entregar, el agente DEBE ejecutar o justificar por qué no aplica:

- **TypeScript / JS**: `knip` o `ts-prune` para exports sin consumidor; `eslint` con `no-unused-vars`, `no-unused-expressions`, `no-duplicate-imports`.
- **CSS**: `stylelint` con `no-duplicate-selectors`, `no-duplicate-properties`, `no-descending-specificity`, `no-empty-rules`, `selector-class-pattern`. Búsqueda manual de cada selector de `global.css` en el código TSX.
- **Tokens**: búsqueda de cada token declarado en `src/styles/global.css` (o fuente central) y verificación de al menos un consumidor real.
- **Tipos**: búsqueda de cada `type`/`interface` exportado y verificación de consumidores.
- **Assets**: verificación de referencias en código y en build.
- **Duplicación**: búsqueda de patrones equivalentes por nombre, por forma y por responsabilidad. Diff visual contra componentes similares.

Cualquier hallazgo no resuelto se reporta explícitamente en la respuesta final. No se oculta.

### 40.5 Integración con preflight y verificación

- El preflight (§4.1) DEBE incluir la auditoría de código muerto y duplicación en los archivos afectados y sus vecinos inmediatos.
- La verificación (§25) DEBE incluir la ejecución de herramientas de detección sobre el diff y el reporte de hallazgos.
- La Definición de Terminado (§32) y el checklist de cierre (§38) reflejan esta sección de forma bloqueante.

---

## 41. Resumen ejecutivo de prioridades

Si en algún momento el agente debe priorizar, el orden es:

1. **Seguridad y contratos** — no romper datos, permisos ni auth.
2. **Accesibilidad** — WCAG 2.2 AA + 8.1.1 mínimo, bloqueante.
3. **Preservación funcional** — la lógica existente se conserva.
4. **Tokens y sistema visual** — sin hardcodeo, sin duplicados, sin full rounded indebido.
5. **Responsive real** — móvil, tablet, desktop y wide verificados.
6. **Sin consultas innecesarias** — deduplicar, cancelar, cachear.
7. **Reutilización y primitivas** — buscar antes de crear, crear si falta.
8. **Cero código muerto y cero duplicación** — en TS, CSS global, tokens, tipos, assets y configuración.
9. **Anti-monolito** — extraer antes de que un archivo crezca.
10. **UI/UX senior** — claridad, consistencia, feedback, estados completos.
11. **Diff limpio** — solo lo solicitado, sin colaterales.

Cuando dos prioridades choquen, gana la de número menor. Cuando una prioridad menor exija tocar una mayor, se pregunta al usuario.
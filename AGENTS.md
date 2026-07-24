# AGENTS.md — Contrato obligatorio de desarrollo

Este documento establece las reglas que debe cumplir cualquier IA, agente automatizado o desarrollador que analice, proponga o modifique este proyecto.

Las palabras **DEBE**, **NO DEBE**, **OBLIGATORIO**, **PROHIBIDO** y **ÚNICAMENTE** expresan requisitos no negociables.

El objetivo es mantener una implementación:

- Cohesiva y predecible.
- Accesible bajo WCAG 2.2 AA.
- Mobile-first y responsive.
- Basada exclusivamente en tokens.
- Reutilizable y mantenible.
- Segura y sin secretos hardcodeados.
- Compatible con la arquitectura existente.
- Limitada estrictamente al alcance autorizado.
- Sin decisiones inventadas ni cambios colaterales.

---

## 1. Alcance y zona protegida

Estas reglas aplican a todo el proyecto raíz `/app`, excepto al directorio protegido `rutas-app`.

### 1.1 Protección absoluta de `rutas-app`

Salvo autorización explícita, directa y actual del usuario, está **PROHIBIDO**:

- Analizar archivos dentro de `rutas-app`.
- Leer su contenido.
- Buscar referencias dentro de ese directorio.
- Editar, formatear, mover, renombrar o eliminar archivos.
- Crear archivos o carpetas dentro de él.
- Regenerar código, assets, índices o configuraciones.
- Incluirlo en refactors, migraciones o cambios masivos.
- Ejecutar herramientas que puedan modificarlo indirectamente.

Las búsquedas globales, formatters, linters, scripts, reemplazos masivos y comandos recursivos DEBEN excluir expresamente `rutas-app`.

La mera existencia del directorio no autoriza su inspección.

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
- Una corrección no autoriza “mejoras” adicionales.
- Una captura o referencia visual no sustituye los contratos funcionales existentes.
- Si una petición contradice una regla superior, se DEBE detener la implementación y explicar el conflicto.

---

## 3. Principio de autorización explícita

El agente DEBE realizar únicamente los cambios necesarios para cumplir la solicitud actual.

Está **PROHIBIDO**:

- Inventar requisitos.
- Suponer preferencias no expresadas.
- Añadir funcionalidades “útiles” no solicitadas.
- Rediseñar áreas adyacentes.
- Cambiar textos, nombres o flujos sin autorización.
- Eliminar elementos porque parezcan redundantes.
- sustituir lógica existente por una alternativa preferida por el agente.
- Introducir animaciones, colores, librerías o patrones por gusto personal.
- Completar decisiones ambiguas que puedan afectar datos, comportamiento o UX sustancial.
- Dejar cambios preventivos para problemas no demostrados.

Si una decisión puede alterar sustancialmente el comportamiento, los datos, la seguridad, el alcance o la experiencia del usuario, el agente DEBE preguntar antes de actuar.

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
11. Determinar los estados de carga, vacío, error, éxito y sin resultados aplicables.
12. Definir primero el comportamiento móvil.
13. Elegir la solución completa menos invasiva.
14. Identificar cómo se verificará el resultado antes de editar.

El agente NO DEBE empezar a escribir código sin completar este análisis.

### 4.2 Buscar no significa modificar

Durante la investigación:

- No se deben aplicar cambios automáticos.
- No se debe formatear el repositorio completo.
- No se debe ejecutar una migración.
- No se deben actualizar dependencias.
- No se debe inspeccionar `rutas-app`.
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
- Cálculos, filtros o ordenamientos existentes.
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

---

## 8. Sistema de color

- `{colors.primary}` es el único color estructural de acción.
- Debe reservarse para CTA principal, enlaces, selección activa y foco.
- `{colors.canvas-soft}` es el lienzo general.
- `{colors.surface}` se utiliza para cards, paneles, inputs y superficies elevadas.
- La paleta sticker es exclusivamente decorativa.
- Los colores sticker no pueden estructurar navegación, formularios, tabs, filtros o botones.
- No se debe introducir un segundo color estructural.
- El color nunca debe ser la única forma de comunicar estado.
- Los estados semánticos deben ser puntuales, comprensibles y accesibles.
- No se debe pintar un contenedor completo si basta un mensaje, icono o indicador localizado.
- Todo contraste debe cumplir WCAG 2.2 AA.

Antes de utilizar texto muted o faint, se DEBE comprobar su contraste sobre la superficie real.

---

## 9. Tipografía

- Usar únicamente la familia y los fallbacks definidos en `desing.md`.
- Usar los tokens tipográficos completos, no solo el tamaño.
- Cada token debe aplicar tamaño, peso, line-height y tracking correspondientes.
- No elegir un elemento HTML por su apariencia visual.
- La jerarquía HTML y la jerarquía visual deben ser coherentes.
- Cada página debe tener un solo `h1`.
- Los niveles de heading no deben saltarse sin una razón semántica.
- El body debe conservar peso regular.
- Los pesos fuertes se reservan para títulos, valores y énfasis real.
- No usar mayúsculas extensas para contenido de lectura.
- No reducir texto esencial para hacerlo encajar.
- El zoom del navegador no debe romper el contenido.
- No impedir el escalado de texto.

Si `NotionInter` no está disponible legal o técnicamente, se debe usar el sustituto autorizado por `desing.md`; no se debe descargar ni simular una fuente sin permiso.

---

## 10. Espaciado, geometría y elevación

- Usar exclusivamente la escala de spacing existente.
- Las distancias equivalentes deben utilizar el mismo token.
- Los componentes hermanos deben compartir ritmo y dimensiones.
- Inputs: `{rounded.xs}`.
- Botones de navegación o utilidad: `{rounded.md}`.
- Cards de contenido: `{rounded.lg}`.
- CTA de marketing: `{rounded.full}`.
- Los inputs nunca deben ser pill.
- Las cards deben utilizar hairline y la elevación definida.
- Está prohibido introducir sombras pesadas.
- No utilizar margen para compensar un problema estructural que debe resolverse con layout.
- No acumular overrides para corregir una regla anterior.
- No usar offsets negativos salvo que formen parte de un patrón documentado.

Si una dimensión nueva se repite o representa una función estable, debe convertirse en token semántico.

---

## 11. Responsive mobile-first

El estilo base corresponde siempre a móvil.

Tablet, desktop y wide se añaden progresivamente mediante los breakpoints existentes.

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

### 11.2 Verificación mínima

Cada cambio visual debe revisarse al menos en:

- Móvil estrecho.
- Móvil estándar.
- Tablet.
- Desktop.
- Wide.

También debe verificarse con:

- Texto largo.
- Datos faltantes.
- Números grandes.
- Zoom aumentado.
- Varias filas o resultados.
- Estados de error y vacío.

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
- Una alineación “casi correcta” se considera incorrecta.

---

## 13. Accesibilidad obligatoria

Toda implementación debe cumplir WCAG 2.2 AA como mínimo.

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

---

## 14. Reutilización antes de creación

Antes de crear un componente, hook, utilidad o estilo, se DEBE buscar en:

1. El sistema descrito en `desing.md`.
2. Las primitivas UI existentes.
3. `src/components/ui`.
4. La feature relacionada.
5. Componentes compartidos autorizados.
6. Hooks, servicios y utilidades existentes.

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

Si un patrón aparece dos veces o tiene una probabilidad razonable de repetirse, debe evaluarse su extracción. No se debe abstraer prematuramente un detalle accidental.

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
- No dejar imports, variables, funciones, estilos o selectores muertos.
- No dejar bloques comentados de código antiguo.
- No introducir lógica duplicada.
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
- No duplicar reglas para sobrescribir una declaración anterior.
- No usar selectores frágiles basados en estructura incidental.
- No aplicar estilos globales desde una feature.
- No usar nombres de clase ligados a un color o posición accidental.
- Las clases deben describir función o responsabilidad.
- No introducir CSS que afecte elementos fuera del alcance solicitado.
- Respetar reduced motion, forced colors y preferencias del sistema cuando correspondan.

---

## 24. Rendimiento

- No optimizar sin medir, pero tampoco introducir regresiones evidentes.
- Evitar renders innecesarios demostrables.
- No memoizar todo por defecto.
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
- Responsive.
- Ausencia de overflow.
- Consola sin errores nuevos.
- Red sin llamadas fallidas introducidas.
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
- No modificar `rutas-app`.
- No contener código comentado o muerto.
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
5. Excluir `rutas-app`.

### Fase 2 — Investigar

1. Leer `AGENTS.md`.
2. Leer las secciones relevantes de `desing.md`.
3. Inspeccionar archivos afectados.
4. Buscar componentes, tokens y utilidades existentes.
5. Revisar contratos y tests relacionados.
6. No editar todavía.

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
4. Mantener accesibilidad y responsive.
5. No tocar archivos fuera del alcance.

### Fase 5 — Verificar

1. Revisar compilación y tipos.
2. Ejecutar pruebas relevantes.
3. Verificar el flujo manualmente.
4. Revisar responsive y accesibilidad.
5. Revisar consola y red.
6. Revisar el diff completo.
7. Confirmar que `rutas-app` permanece intacto.

### Fase 6 — Informar

La respuesta final debe indicar:

- Qué se cambió.
- Qué archivos se modificaron.
- Qué comportamiento se preservó.
- Cómo se verificó.
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
- Cumple WCAG 2.2 AA.
- Funciona con teclado.
- Tiene foco visible.
- Es mobile-first.
- No presenta overflow ni clipping.
- Funciona con contenido dinámico.
- Contempla los estados aplicables.
- Mantiene TypeScript y lint sin errores nuevos.
- Pasa las pruebas relevantes.
- El flujo fue verificado.
- El diff está limpio.
- `rutas-app` no fue leído ni modificado.
- No quedan errores conocidos ocultos.
- La respuesta final describe la verificación real.

Si cualquiera de estos puntos falla, el trabajo se considera **NO terminado**.

---

## 33. Checklist obligatorio de cierre

Antes de responder al usuario, confirmar:

### Alcance

- [ ] Se trabajó únicamente en el alcance solicitado.
- [ ] No se analizó ni modificó `rutas-app`.
- [ ] No existen cambios colaterales.
- [ ] No se realizó ningún refactor no solicitado.

### Diseño

- [ ] Se leyó y respetó `desing.md`.
- [ ] No existen colores hardcodeados.
- [ ] No existen fuentes o tamaños tipográficos arbitrarios.
- [ ] No existen paddings, márgenes o gaps fuera de tokens.
- [ ] No existen radios o sombras inventados.
- [ ] La paleta sticker se usa únicamente como decoración.
- [ ] `{colors.primary}` sigue siendo el único acento estructural.

### Responsive y accesibilidad

- [ ] La implementación es mobile-first.
- [ ] No existe overflow horizontal involuntario.
- [ ] No hay clipping ni texto roto.
- [ ] Los touch targets cumplen el mínimo.
- [ ] Los labels y controles están alineados.
- [ ] Los controles hermanos comparten altura exterior.
- [ ] El flujo funciona con teclado.
- [ ] El foco es visible.
- [ ] La semántica HTML es correcta.
- [ ] ARIA se utiliza solo cuando corresponde.
- [ ] El contraste cumple WCAG 2.2 AA.
- [ ] No se depende únicamente de color, hover o tooltip.

### Arquitectura y calidad

- [ ] Se buscaron componentes existentes antes de crear otros.
- [ ] No existe lógica o markup duplicado evitable.
- [ ] No existen imports, variables o estilos muertos.
- [ ] No se introdujo `any` evitable.
- [ ] No existen casts ciegos.
- [ ] No se añadieron dependencias innecesarias.
- [ ] No existen estilos inline evitables.
- [ ] No se ocultaron errores.
- [ ] No se inventaron contratos, datos o requisitos.

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

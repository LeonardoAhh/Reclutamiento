Tienes razón. Debí entregarlo como **un bloque Markdown único**, listo para copiar y guardar como `SKILLS.md`.

````md
# SKILLS.md — Procedimientos operativos para Gemini 3.1 Pro

Este documento define **cómo debe trabajar** Gemini 3.1 Pro dentro del proyecto.

- `AGENTS.md` establece las reglas y restricciones obligatorias.
- `desing.md` establece el sistema visual.
- `SKILLS.md` establece los procedimientos paso a paso.

Antes de ejecutar cualquier skill, Gemini DEBE leer `AGENTS.md`.

Ninguna skill autoriza:

- Ignorar `AGENTS.md`.
- Analizar o modificar `rutas-app`.
- Inventar requisitos.
- Realizar cambios no solicitados.
- Cambiar lógica, datos o contratos sin autorización.
- Declarar un trabajo terminado sin verificarlo.

---

# 1. Protocolo general

Toda tarea debe seguir este ciclo:

```text
COMPRENDER
    ↓
DELIMITAR
    ↓
INVESTIGAR
    ↓
PREGUNTAR SI ES NECESARIO
    ↓
PLANIFICAR
    ↓
IMPLEMENTAR
    ↓
VERIFICAR
    ↓
REVISAR EL DIFF
    ↓
INFORMAR
```

Gemini no debe modificar archivos durante las fases de comprensión, delimitación o investigación.

---

# 2. Selección de skills

No es obligatorio ejecutar todas las skills en cada tarea.

Gemini debe seleccionar únicamente las que correspondan al trabajo solicitado.

| Tipo de tarea | Skills recomendadas |
|---|---|
| Nueva interfaz | Analizar, investigar, diseñar UI, componentes, frontend, responsive, accesibilidad y testing |
| Rediseño visual | Analizar, auditar UI, preservar funcionalidad, frontend, responsive y testing |
| Corrección de bug | Reproducir, diagnosticar, corregir, probar regresión y revisar diff |
| Cambio de backend | Analizar contratos, seguridad, backend y testing |
| Cambio full stack | Analizar, investigar, backend, frontend, accesibilidad, seguridad y testing |
| Refactor autorizado | Analizar alcance, proteger comportamiento, refactorizar y probar regresión |
| Auditoría | Investigar, auditar, clasificar hallazgos e informar sin modificar |

---

# SKILL-01 — Analizar una solicitud

## Comando sugerido

```text
/analizar-solicitud
```

## Cuándo utilizarla

- Al recibir una tarea nueva.
- Cuando una petición contiene varias acciones.
- Cuando no está claro si el cambio es visual, funcional o full stack.
- Cuando existe riesgo de modificar áreas no solicitadas.

## Objetivo

Convertir la petición literal del usuario en un alcance concreto sin inventar requisitos.

## Procedimiento

1. Leer la solicitud completa.
2. Identificar el objetivo principal.
3. Enumerar los cambios explícitamente solicitados.
4. Identificar lo que no fue solicitado.
5. Clasificar la tarea:
   - Análisis.
   - UI/UX.
   - Frontend.
   - Backend.
   - Full stack.
   - Accesibilidad.
   - Seguridad.
   - Bug.
   - Refactor.
   - Testing.
6. Identificar áreas probablemente afectadas.
7. Identificar comportamiento que debe preservarse.
8. Detectar ambigüedades.
9. Definir criterios observables de aceptación.
10. Determinar si es necesario preguntar antes de continuar.

## Salida esperada

```md
## Alcance interpretado

### Objetivo
- ...

### Cambios autorizados
- ...

### Comportamiento que debe preservarse
- ...

### Fuera de alcance
- ...

### Áreas probablemente afectadas
- ...

### Criterios de aceptación
- ...
```

## Detenerse cuando

- No está claro qué debe cambiar.
- Hay varias interpretaciones funcionales.
- El cambio puede afectar datos, permisos o contratos.
- La solicitud contradice `AGENTS.md`.
- Es necesaria una acción destructiva no autorizada.

---

# SKILL-02 — Investigar antes de actuar

## Comando sugerido

```text
/investigar-contexto
```

## Cuándo utilizarla

- Antes de editar código existente.
- Antes de crear un componente.
- Antes de añadir una utilidad, hook o servicio.
- Antes de resolver un problema que puede tener una solución existente.

## Objetivo

Comprender la implementación actual y encontrar patrones reutilizables.

## Procedimiento

1. Leer `AGENTS.md`.
2. Confirmar la exclusión de `rutas-app`.
3. Leer las secciones relevantes de `desing.md`.
4. Localizar la feature o ruta afectada.
5. Identificar sus puntos de entrada.
6. Buscar componentes equivalentes.
7. Buscar primitivas en `src/components/ui`.
8. Buscar hooks y utilidades existentes.
9. Buscar tipos, schemas y contratos relacionados.
10. Identificar la fuente real de los datos.
11. Revisar servicios y llamadas de red.
12. Revisar tests relacionados.
13. Revisar cómo se resuelven estados equivalentes.
14. Identificar patrones de responsive.
15. Identificar tokens utilizados.
16. Documentar qué puede reutilizarse.
17. Seleccionar la solución menos invasiva.

## Salida esperada

```md
## Investigación

### Implementación actual
- ...

### Componentes reutilizables
- ...

### Hooks y utilidades reutilizables
- ...

### Tokens existentes
- ...

### Contratos que deben preservarse
- ...

### Riesgos
- ...

### Solución mínima recomendada
- ...
```

## Durante esta skill está prohibido

- Editar archivos.
- Formatear código.
- Instalar dependencias.
- Ejecutar migraciones.
- Corregir problemas adyacentes.
- Investigar `rutas-app`.

---

# SKILL-03 — Evaluar si se debe preguntar

## Comando sugerido

```text
/evaluar-ambiguedad
```

## Objetivo

Distinguir entre una decisión interna segura y una decisión que requiere autorización.

## Procedimiento

Para cada decisión pendiente, responder:

1. ¿Cambia lógica de negocio?
2. ¿Cambia datos o persistencia?
3. ¿Cambia autenticación o permisos?
4. ¿Cambia contratos, rutas o schemas?
5. ¿Elimina u oculta información?
6. ¿Introduce una dependencia?
7. ¿Cambia sustancialmente el flujo?
8. ¿Es destructiva o difícil de revertir?
9. ¿Existen dos opciones razonables con resultados diferentes?
10. ¿Falta un patrón autorizado?

Si alguna respuesta es afirmativa, se debe preguntar al usuario.

## Formato recomendado

```md
Necesito confirmar una decisión antes de continuar.

### Situación
- ...

### Opción A
- ...
- Impacto: ...

### Opción B
- ...
- Impacto: ...

### Recomendación
- ...

No aplicaré ninguna opción hasta recibir confirmación.
```

## No preguntar cuando

- Existe un patrón claro en el proyecto.
- La decisión está definida por `AGENTS.md`.
- La decisión está definida por `desing.md`.
- La elección no modifica comportamiento ni alcance.
- Se trata de una implementación interna menor y reversible.

---

# SKILL-04 — Crear un plan mínimo

## Comando sugerido

```text
/planificar-cambio
```

## Objetivo

Preparar una implementación pequeña, segura y verificable.

## Procedimiento

1. Definir el resultado final.
2. Enumerar los archivos estrictamente necesarios.
3. Separar:
   - Presentación.
   - Estado.
   - Datos.
   - Contratos.
   - Accesibilidad.
   - Tests.
4. Identificar componentes reutilizables.
5. Justificar cualquier componente nuevo.
6. Definir primero el comportamiento móvil.
7. Definir los estados de interfaz aplicables.
8. Definir cómo se verificará el resultado.
9. Identificar riesgos.
10. Eliminar del plan todo trabajo no solicitado.

## Salida esperada

```md
## Plan mínimo

1. ...
2. ...
3. ...

### Archivos afectados
- ...

### Elementos reutilizados
- ...

### Comportamiento preservado
- ...

### Estados contemplados
- ...

### Verificación prevista
- ...
```

---

# SKILL-05 — Auditar una interfaz

## Comando sugerido

```text
/auditar-ui
```

## Cuándo utilizarla

- Antes de rediseñar una pantalla.
- Cuando se reportan problemas visuales.
- Cuando la implementación no coincide con `desing.md`.
- Cuando se analiza una captura.

## Objetivo

Identificar problemas UI/UX sin modificar funcionalidad.

## Áreas de auditoría

### Sistema visual

- Tokens de color.
- Tokens tipográficos.
- Espaciado.
- Radios.
- Bordes.
- Sombras.
- Superficies.
- Uso del color primario.
- Uso decorativo de la paleta sticker.

### Jerarquía

- Título principal.
- Orden de lectura.
- CTA principal.
- Acciones secundarias.
- Agrupación visual.
- Densidad de contenido.

### Layout

- Alineación.
- Ritmo vertical.
- Ancho de lectura.
- Distribución de columnas.
- Altura de controles.
- Consistencia de gaps.

### Responsive

- Mobile-first.
- Reflow.
- Overflow.
- Clipping.
- Texto largo.
- Touch targets.
- Safe areas.

### Interacción

- Hover.
- Focus.
- Active.
- Disabled.
- Loading.
- Feedback.
- Prevención de acciones duplicadas.

### Accesibilidad

- HTML semántico.
- Labels.
- Teclado.
- Contraste.
- Foco.
- ARIA.
- Mensajes dinámicos.

## Salida esperada

```md
## Auditoría UI/UX

### P0 — Bloqueantes
- ...

### P1 — Impacto alto
- ...

### P2 — Mejoras opcionales
- ...

### Elementos correctos que deben preservarse
- ...
```

Los hallazgos opcionales no deben implementarse sin autorización.

---

# SKILL-06 — Diseñar una interfaz

## Comando sugerido

```text
/diseñar-ui
```

## Objetivo

Convertir requisitos autorizados en una interfaz coherente con `desing.md`.

## Procedimiento

1. Definir la tarea principal del usuario.
2. Identificar la información imprescindible.
3. Establecer un único `h1`.
4. Ordenar el contenido por prioridad.
5. Definir la CTA principal.
6. Definir acciones secundarias.
7. Diseñar primero la composición móvil.
8. Buscar componentes existentes.
9. Seleccionar tokens existentes.
10. Utilizar el color primario solo para acciones estructurales.
11. Reservar los colores sticker para decoración.
12. Definir estados:
    - Inicial.
    - Carga.
    - Vacío.
    - Sin resultados.
    - Error.
    - Éxito.
    - Disabled.
13. Adaptar la composición a tablet.
14. Adaptar la composición a desktop.
15. Adaptar a wide solo si es necesario.
16. Confirmar que la lógica no cambia.
17. Documentar decisiones no evidentes.

## Salida esperada

```md
## Propuesta UI

### Objetivo del usuario
- ...

### Estructura móvil
1. ...
2. ...

### Tablet y desktop
- ...

### Componentes reutilizados
- ...

### Estados
- ...

### Accesibilidad
- ...

### Comportamiento preservado
- ...
```

---

# SKILL-07 — Resolver reutilización de componentes

## Comando sugerido

```text
/resolver-componente
```

## Objetivo

Decidir correctamente entre reutilizar, extender, componer o crear un componente.

## Árbol de decisión

```text
¿Existe un componente con el mismo propósito?
├── Sí
│   └── Reutilizar.
└── No
    └── ¿Existe una primitiva compatible?
        ├── Sí
        │   └── Componer o añadir una variante.
        └── No
            └── ¿Tiene responsabilidad propia o se repetirá?
                ├── Sí
                │   └── Crear un componente.
                └── No
                    └── Mantenerlo localizado.
```

## Procedimiento

1. Buscar por función, no solo por nombre.
2. Revisar las variantes existentes.
3. Revisar accesibilidad.
4. Revisar todos los consumidores.
5. Determinar si una extensión puede provocar regresiones.
6. Preferir composición sobre múltiples props booleanas.
7. Mantener una API pequeña.
8. Utilizar tipos explícitos.
9. Evitar wrappers sin responsabilidad.
10. Añadir tests si existe comportamiento nuevo.

## Crear un componente cuando

- El patrón se repite.
- Tiene comportamiento propio.
- Tiene requisitos de accesibilidad propios.
- Reduce duplicación real.
- Puede tener una API clara.

## No crear un componente cuando

- Solo reduce unas pocas líneas.
- Requiere demasiadas props específicas.
- Une elementos sin una responsabilidad común.
- El patrón es accidental o exclusivo.

---

# SKILL-08 — Implementar frontend

## Comando sugerido

```text
/implementar-frontend
```

## Objetivo

Implementar interfaces tipadas, accesibles, responsive y coherentes.

## Procedimiento

1. Confirmar los archivos autorizados.
2. Reutilizar componentes existentes.
3. Definir tipos de props y datos.
4. Implementar HTML semántico.
5. Construir primero el layout móvil.
6. Aplicar exclusivamente tokens.
7. Añadir breakpoints progresivamente.
8. Implementar los estados aplicables.
9. Mantener navegación por teclado.
10. Mantener foco visible.
11. Añadir nombres accesibles.
12. Evitar estado duplicado.
13. Evitar efectos innecesarios.
14. Manejar correctamente acciones asíncronas.
15. Prevenir envíos duplicados.
16. Mantener errores recuperables.
17. Probar contenido largo.
18. Probar valores faltantes.
19. Añadir o actualizar tests.
20. Confirmar que no cambió lógica fuera del alcance.

## Checklist

- [ ] Sin `any` evitable.
- [ ] Sin casts ciegos.
- [ ] Sin estilos inline evitables.
- [ ] Sin valores visuales arbitrarios.
- [ ] Sin `div` interactivos.
- [ ] Sin IDs duplicados.
- [ ] Sin keys inestables.
- [ ] Sin imports muertos.
- [ ] Sin dependencias innecesarias.
- [ ] Sin errores ocultos.

---

# SKILL-09 — Implementar responsive mobile-first

## Comando sugerido

```text
/ajustar-responsive
```

## Objetivo

Conseguir que la interfaz funcione de forma intencional en todos los anchos.

## Procedimiento

1. Comenzar por móvil estrecho.
2. Usar una columna por defecto cuando corresponda.
3. Permitir que los elementos flexibles puedan encogerse.
4. Añadir `min-width: 0` donde sea necesario.
5. Usar grids fluidos.
6. Evitar anchos fijos para contenido dinámico.
7. Permitir wrap intencional.
8. Truncar solo información secundaria.
9. Mantener visibles las acciones principales.
10. Preservar touch targets.
11. Añadir el breakpoint de tablet.
12. Revisar alineación de labels y controles.
13. Añadir desktop.
14. Añadir wide solo cuando mejore la composición.
15. Probar zoom.
16. Probar texto largo.
17. Confirmar que no existe overflow horizontal involuntario.

## Matriz de comprobación

| Contexto | Comprobar |
|---|---|
| Móvil estrecho | Reflow, texto y touch targets |
| Móvil estándar | Acciones y navegación |
| Tablet | Grids, formularios y toolbars |
| Desktop | Alineación y ancho de lectura |
| Wide | Límites del contenedor |
| Zoom | Clipping, foco y legibilidad |
| Texto largo | Wrap y alturas dinámicas |

---

# SKILL-10 — Auditar accesibilidad

## Comando sugerido

```text
/auditar-accesibilidad
```

## Objetivo

Verificar cumplimiento WCAG 2.2 AA.

## Procedimiento

### Estructura

1. Identificar landmarks.
2. Confirmar un único `h1`.
3. Revisar la jerarquía de headings.
4. Utilizar HTML nativo.

### Formularios

5. Comprobar labels.
6. Asociar ayuda y errores.
7. Identificar campos obligatorios.
8. Configurar autocomplete.
9. Mantener los datos ante errores.

### Teclado

10. Recorrer la interfaz con `Tab`.
11. Confirmar un orden lógico.
12. Confirmar foco visible.
13. Probar activación con teclado.
14. Detectar keyboard traps.
15. Revisar overlays y retorno de foco.

### ARIA

16. Verificar nombres accesibles.
17. Revisar `aria-expanded`.
18. Revisar `aria-selected`.
19. Revisar `aria-pressed`.
20. Verificar IDs únicos.
21. Eliminar roles redundantes.
22. Revisar anuncios dinámicos.

### Percepción

23. Verificar contraste.
24. Confirmar que el color no es la única señal.
25. Probar zoom.
26. Respetar reduced motion.
27. Revisar textos alternativos.

## Salida esperada

```md
## Auditoría de accesibilidad

### Bloqueantes
- ...

### Incidencias
- ...

### Verificaciones superadas
- ...

### Pruebas realizadas
- ...
```

---

# SKILL-11 — Diseñar estados de interfaz

## Comando sugerido

```text
/diseñar-estados
```

## Objetivo

Garantizar una salida clara para todos los estados de datos.

## Procedimiento

1. Identificar el estado inicial.
2. Definir carga inicial.
3. Diferenciar carga inicial y actualización.
4. Diseñar el estado vacío.
5. Diseñar el estado sin resultados.
6. Añadir una forma de limpiar filtros.
7. Diseñar errores recuperables.
8. Diseñar errores no recuperables.
9. Mantener datos disponibles ante errores parciales.
10. Diseñar confirmación de éxito.
11. Diseñar acciones deshabilitadas.
12. Explicar la causa de una acción deshabilitada.
13. Diseñar permisos insuficientes.
14. Revisar valores faltantes.
15. Revisar contenido largo.
16. Anunciar cambios importantes de forma accesible.

## Diferencias obligatorias

```text
Vacío:
No existen datos.

Sin resultados:
Existen datos, pero los filtros no coinciden.

Error:
No fue posible obtener o modificar los datos.

Sin permiso:
El usuario no está autorizado.
```

Estos estados no deben compartir automáticamente el mismo mensaje o acción.

---

# SKILL-12 — Implementar backend

## Comando sugerido

```text
/implementar-backend
```

## Objetivo

Realizar cambios seguros sin romper contratos.

## Procedimiento

1. Identificar el contrato actual.
2. Revisar todos sus consumidores.
3. Revisar tipos y schemas.
4. Identificar autenticación y permisos.
5. Identificar reglas de negocio.
6. Validar entradas.
7. Aplicar autorización en servidor.
8. Mantener respuestas consistentes.
9. Diferenciar errores:
   - Validación.
   - Autenticación.
   - Autorización.
   - Recurso inexistente.
   - Conflicto.
   - Servidor.
10. Evitar exposición de información interna.
11. Manejar concurrencia y duplicados.
12. Mantener idempotencia cuando corresponda.
13. Evitar cambios destructivos no autorizados.
14. Añadir tests de contrato.
15. Verificar compatibilidad con el frontend.
16. Revisar logs sin exponer datos sensibles.

## Checklist

- [ ] Contrato preservado o cambio autorizado.
- [ ] Entrada validada.
- [ ] Autorización aplicada en servidor.
- [ ] Sin secretos en código o logs.
- [ ] Sin información interna expuesta.
- [ ] Errores correctamente clasificados.
- [ ] Operaciones destructivas protegidas.
- [ ] Tests de éxito y error.
- [ ] Sin cambios de schema no autorizados.

---

# SKILL-13 — Evaluar datos y persistencia

## Comando sugerido

```text
/evaluar-datos
```

## Cuándo utilizarla

- Al modificar schemas.
- Al proponer una migración.
- Al cambiar campos, tablas o relaciones.
- Ante operaciones destructivas.

## Procedimiento

1. Confirmar autorización.
2. Identificar productores y consumidores.
3. Evaluar compatibilidad hacia atrás.
4. Comprobar si puede resolverse sin cambiar el schema.
5. Identificar datos existentes afectados.
6. Diseñar una migración reversible.
7. Definir validaciones.
8. Definir tratamiento de datos parciales.
9. Preparar rollback.
10. Preparar tests.
11. Explicar el impacto.
12. Esperar confirmación antes de ejecutar.

## Condición de parada

No ejecutar migraciones, eliminaciones o renombrados sin autorización explícita.

---

# SKILL-14 — Auditar seguridad

## Comando sugerido

```text
/auditar-seguridad
```

## Objetivo

Evitar exposición de secretos, escalada de permisos y entradas inseguras.

## Procedimiento

1. Identificar datos sensibles.
2. Identificar límites entre cliente y servidor.
3. Confirmar que los secretos permanecen en servidor.
4. Revisar variables de entorno.
5. Buscar credenciales hardcodeadas.
6. Revisar logs.
7. Validar entradas.
8. Revisar autorización por recurso.
9. Revisar respuestas expuestas.
10. Revisar renderizado de contenido externo.
11. Revisar operaciones destructivas.
12. Revisar protección contra abuso cuando aplique.
13. Confirmar que los controles no dependen solo del frontend.
14. Documentar riesgos restantes.

## Hallazgos prioritarios

- Secretos expuestos.
- Autorización únicamente en frontend.
- Acceso a recursos de otros usuarios.
- Datos sensibles en logs.
- Entradas sin validar.
- HTML no sanitizado.
- Errores internos enviados al cliente.
- Fallbacks inseguros.

---

# SKILL-15 — Evaluar dependencias

## Comando sugerido

```text
/evaluar-dependencia
```

## Objetivo

Evitar dependencias innecesarias.

## Procedimiento

1. Buscar una solución con el stack actual.
2. Buscar una utilidad ya instalada.
3. Confirmar la necesidad real.
4. Evaluar:
   - Mantenimiento.
   - Compatibilidad.
   - Tamaño.
   - Licencia.
   - Seguridad.
   - Accesibilidad.
   - Impacto en el bundle.
5. Verificar configuración y credenciales necesarias.
6. Comparar alternativas.
7. Explicar por qué es necesaria.
8. Solicitar autorización.
9. Instalar únicamente después de confirmación.

## Salida esperada

```md
## Evaluación de dependencia

### Necesidad
- ...

### Solución con el stack actual
- ...

### Dependencia propuesta
- ...

### Impacto
- ...

### Alternativas
- ...

### Recomendación
- ...

### Requiere autorización
- Sí
```

---

# SKILL-16 — Diagnosticar un bug

## Comando sugerido

```text
/diagnosticar-bug
```

## Objetivo

Reproducir y corregir la causa raíz sin cambios especulativos.

## Procedimiento

1. Registrar el comportamiento esperado.
2. Registrar el comportamiento actual.
3. Obtener pasos de reproducción.
4. Identificar entorno y condiciones.
5. Reproducir el problema.
6. Recoger evidencia:
   - Error.
   - Log.
   - Respuesta de red.
   - Estado de datos.
   - Captura.
7. Formular hipótesis ordenadas por probabilidad.
8. Comprobar cada hipótesis.
9. Identificar la causa raíz.
10. Diseñar la corrección mínima.
11. Implementar sin alterar áreas adyacentes.
12. Repetir los pasos de reproducción.
13. Ejecutar pruebas de regresión.
14. Documentar la evidencia.

## Prohibiciones

- No corregir sin reproducir cuando sea posible.
- No ocultar el error.
- No añadir fallbacks silenciosos.
- No culpar a caché o navegador sin evidencia.
- No ampliar el refactor.
- No declarar el bug resuelto sin verificación.

## Salida esperada

```md
## Diagnóstico

### Comportamiento esperado
- ...

### Comportamiento reproducido
- ...

### Evidencia
- ...

### Causa raíz
- ...

### Corrección aplicada
- ...

### Regresión verificada
- ...
```

---

# SKILL-17 — Realizar un refactor controlado

## Comando sugerido

```text
/refactor-controlado
```

## Objetivo

Mejorar la estructura sin cambiar el comportamiento observable.

## Procedimiento

1. Definir el problema estructural.
2. Confirmar autorización.
3. Delimitar archivos.
4. Documentar comportamiento actual.
5. Asegurar cobertura.
6. Aplicar cambios pequeños.
7. Evitar renombrados innecesarios.
8. Mantener contratos públicos.
9. Probar después de cada etapa.
10. Comparar comportamiento antes y después.
11. Revisar rendimiento.
12. Revisar accesibilidad.
13. Eliminar únicamente código demostrado como muerto.
14. Revisar el diff.

## Condición de éxito

El comportamiento observable debe permanecer igual, excepto por cambios expresamente autorizados.

---

# SKILL-18 — Probar frontend

## Comando sugerido

```text
/probar-frontend
```

## Objetivo

Verificar comportamiento, accesibilidad y presentación.

## Procedimiento

1. Confirmar que la aplicación compila.
2. Abrir la ruta afectada.
3. Probar el flujo principal.
4. Probar acciones secundarias.
5. Probar carga.
6. Probar vacío.
7. Probar sin resultados.
8. Probar errores.
9. Probar éxito.
10. Probar disabled.
11. Probar navegación por teclado.
12. Probar foco.
13. Revisar consola.
14. Revisar solicitudes de red.
15. Probar móvil.
16. Probar tablet.
17. Probar desktop.
18. Probar wide.
19. Probar zoom.
20. Probar texto largo.
21. Probar valores faltantes.
22. Comparar con `desing.md`.
23. Registrar resultados reales.

## Casos mínimos

- [ ] Render inicial.
- [ ] Acción principal.
- [ ] Acción secundaria.
- [ ] Loading.
- [ ] Vacío.
- [ ] Sin resultados.
- [ ] Error.
- [ ] Éxito.
- [ ] Disabled.
- [ ] Navegación por teclado.
- [ ] Focus visible.
- [ ] Móvil.
- [ ] Tablet.
- [ ] Desktop.
- [ ] Contenido largo.

---

# SKILL-19 — Probar backend

## Comando sugerido

```text
/probar-backend
```

## Objetivo

Verificar contratos, seguridad y persistencia.

## Procedimiento

1. Probar caso exitoso.
2. Probar entrada inválida.
3. Probar campos faltantes.
4. Probar usuario no autenticado.
5. Probar usuario sin permiso.
6. Probar recurso inexistente.
7. Probar duplicados.
8. Probar límites relevantes.
9. Probar fallos externos.
10. Verificar status codes.
11. Verificar schema de respuesta.
12. Verificar ausencia de información interna.
13. Verificar persistencia.
14. Verificar idempotencia cuando corresponda.
15. Ejecutar regresión de consumidores.

## Evidencia recomendada

```md
## Pruebas backend

| Caso | Esperado | Obtenido | Estado |
|---|---|---|---|
| Éxito | ... | ... | OK |
| Entrada inválida | ... | ... | OK |
| Sin autenticación | ... | ... | OK |
| Sin permiso | ... | ... | OK |
```

---

# SKILL-20 — Revisar rendimiento

## Comando sugerido

```text
/revisar-rendimiento
```

## Objetivo

Resolver regresiones medibles sin optimizaciones especulativas.

## Procedimiento

1. Reproducir la lentitud.
2. Identificar la operación costosa.
3. Medir antes de cambiar.
4. Revisar:
   - Renderizados.
   - Consultas.
   - Tamaño de recursos.
   - Layout shifts.
   - Trabajo en el hilo principal.
   - Listeners.
   - Efectos.
5. Identificar la causa.
6. Aplicar la optimización mínima.
7. Medir nuevamente.
8. Verificar accesibilidad.
9. Ejecutar regresión funcional.
10. Documentar la mejora.

## Regla

No utilizar memoización, virtualización o lazy loading automáticamente. Deben resolver un problema demostrado.

---

# SKILL-21 — Revisar el diff

## Comando sugerido

```text
/revisar-diff
```

## Objetivo

Detectar cambios accidentales o fuera del alcance.

## Procedimiento

1. Enumerar archivos modificados.
2. Confirmar que pertenecen al alcance.
3. Confirmar que `rutas-app` permanece intacto.
4. Revisar cada cambio.
5. Buscar:
   - Formateo no relacionado.
   - Imports muertos.
   - Código comentado.
   - Logs temporales.
   - TODOs no autorizados.
   - Secrets.
   - Valores hardcodeados.
   - Duplicación.
   - Cambios de contrato.
   - Dependencias nuevas.
   - Archivos generados.
6. Comparar con la solicitud original.
7. Revertir cambios colaterales.
8. Confirmar las pruebas.
9. Preparar el resumen final.

## Condición de parada

No finalizar mientras exista un archivo modificado sin relación directa con la solicitud.

---

# SKILL-22 — Validar que el trabajo está terminado

## Comando sugerido

```text
/validar-terminado
```

## Objetivo

Evitar declarar una tarea terminada sin evidencia.

## Checklist

### Alcance

- [ ] Se implementó exactamente lo solicitado.
- [ ] No se modificaron áreas no autorizadas.
- [ ] `rutas-app` no fue analizado ni modificado.

### Diseño

- [ ] Se respetó `desing.md`.
- [ ] Se utilizaron tokens.
- [ ] No se inventaron estilos.
- [ ] La jerarquía visual es coherente.

### Funcionalidad

- [ ] Se preservaron datos y contratos.
- [ ] El flujo principal funciona.
- [ ] Los estados alternativos funcionan.
- [ ] Los errores tienen una salida clara.

### Responsive

- [ ] Móvil funciona.
- [ ] Tablet funciona.
- [ ] Desktop funciona.
- [ ] Wide funciona.
- [ ] No existe overflow involuntario.

### Accesibilidad

- [ ] Funciona con teclado.
- [ ] El foco es visible.
- [ ] Los labels son accesibles.
- [ ] La semántica es correcta.
- [ ] El contraste es válido.
- [ ] No se depende únicamente del color.

### Calidad

- [ ] Type checking correcto.
- [ ] Tests relevantes correctos.
- [ ] No existen errores nuevos.
- [ ] No existe código muerto.
- [ ] No existen secretos.
- [ ] El diff está limpio.

Si falla un punto aplicable, el trabajo no está terminado.

---

# SKILL-23 — Informar el resultado

## Comando sugerido

```text
/informar-resultado
```

## Objetivo

Comunicar resultados breves, exactos y comprobados.

## Formato recomendado

```md
## Resultado

### Cambios realizados
- ...

### Archivos modificados
- ...

### Comportamiento preservado
- ...

### Verificación
- ...

### Pendientes o limitaciones
- ...
```

## Reglas

- No decir “terminado” sin verificar.
- No afirmar que una prueba pasó si no se ejecutó.
- No ocultar errores conocidos.
- No presentar mocks como integraciones reales.
- No afirmar que se revisó un archivo que no fue leído.
- No exagerar el alcance.
- Informar expresamente lo que no pudo verificarse.

---

# 3. Flujos completos

## Nueva interfaz

```text
/analizar-solicitud
→ /investigar-contexto
→ /evaluar-ambiguedad
→ /planificar-cambio
→ /diseñar-ui
→ /resolver-componente
→ /implementar-frontend
→ /ajustar-responsive
→ /auditar-accesibilidad
→ /diseñar-estados
→ /probar-frontend
→ /revisar-diff
→ /validar-terminado
→ /informar-resultado
```

## Rediseño visual

```text
/analizar-solicitud
→ /investigar-contexto
→ /auditar-ui
→ /planificar-cambio
→ /diseñar-ui
→ /implementar-frontend
→ /ajustar-responsive
→ /auditar-accesibilidad
→ /probar-frontend
→ /revisar-diff
→ /validar-terminado
→ /informar-resultado
```

Durante un rediseño visual no se deben modificar:

- Contratos.
- Consultas.
- Mutaciones.
- Datos.
- Permisos.
- Reglas de negocio.
- Integraciones.

## Corrección de bug

```text
/analizar-solicitud
→ /diagnosticar-bug
→ /investigar-contexto
→ /planificar-cambio
→ implementar corrección mínima
→ reproducir nuevamente
→ probar regresión
→ /revisar-diff
→ /validar-terminado
→ /informar-resultado
```

## Cambio full stack

```text
/analizar-solicitud
→ /investigar-contexto
→ /evaluar-ambiguedad
→ /planificar-cambio
→ /evaluar-datos
→ /auditar-seguridad
→ /implementar-backend
→ /probar-backend
→ /implementar-frontend
→ /diseñar-estados
→ /ajustar-responsive
→ /auditar-accesibilidad
→ /probar-frontend
→ /revisar-diff
→ /validar-terminado
→ /informar-resultado
```

## Auditoría sin implementación

```text
/analizar-solicitud
→ /investigar-contexto
→ /auditar-ui o /auditar-accesibilidad
→ clasificar hallazgos
→ /informar-resultado
```

Una auditoría no autoriza implementar los hallazgos.

---

# 4. Plantilla interna de ejecución

```md
## Análisis de la tarea

### Solicitud literal
- ...

### Objetivo
- ...

### Cambios autorizados
- ...

### Fuera de alcance
- ...

### Archivos probables
- ...

### Componentes reutilizables
- ...

### Contratos que deben preservarse
- ...

### Estados necesarios
- ...

### Requisitos de accesibilidad
- ...

### Riesgos
- ...

### Preguntas necesarias
- Ninguna / ...

### Plan mínimo
1. ...
2. ...
3. ...

### Verificación prevista
- ...
```

---

# 5. Plantilla de revisión UI/UX

```md
## Revisión UI/UX

### Jerarquía
- [ ] Existe un único `h1`.
- [ ] El contenido está ordenado por prioridad.
- [ ] La CTA principal es identificable.
- [ ] Las acciones secundarias están subordinadas.

### Sistema visual
- [ ] Se utilizan tokens de color.
- [ ] Se utilizan tokens tipográficos.
- [ ] Se utilizan tokens de spacing.
- [ ] Los radios son correctos.
- [ ] La elevación es correcta.
- [ ] La paleta sticker es únicamente decorativa.

### Layout
- [ ] La implementación es mobile-first.
- [ ] No existe overflow.
- [ ] No existe clipping.
- [ ] El contenido largo está controlado.
- [ ] La alineación es exacta.
- [ ] Los controles tienen una altura exterior consistente.

### Estados
- [ ] Carga.
- [ ] Vacío.
- [ ] Sin resultados.
- [ ] Error.
- [ ] Éxito.
- [ ] Disabled.

### Accesibilidad
- [ ] HTML semántico.
- [ ] Labels.
- [ ] Teclado.
- [ ] Focus.
- [ ] ARIA correcta.
- [ ] Contraste.
- [ ] Reduced motion.
```

---

# 6. Plantilla de diagnóstico de bug

```md
## Diagnóstico de bug

### Problema reportado
- ...

### Resultado esperado
- ...

### Resultado actual
- ...

### Pasos de reproducción
1. ...
2. ...
3. ...

### Evidencia
- ...

### Causa raíz
- ...

### Corrección aplicada
- ...

### Archivos modificados
- ...

### Pruebas de regresión
- ...

### Resultado final
- ...
```

---

# 7. Criterio final

Gemini 3.1 Pro debe ejecutar siempre estas fases mínimas:

1. Interpretar.
2. Delimitar.
3. Investigar.
4. Preguntar cuando sea necesario.
5. Implementar únicamente lo autorizado.
6. Verificar.
7. Revisar el diff.
8. Comunicar resultados reales.

Ninguna skill autoriza ignorar `AGENTS.md`, analizar `rutas-app`, inventar requisitos o realizar cambios no solicitados.
````

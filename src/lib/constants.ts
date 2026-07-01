import type { AuthorizedPosition, PuestoHabilidades } from './types';

/**
 * Categorías de puesto asignables manualmente al dar de alta un empleado.
 * NO se derivan del puesto: la cobertura de vacantes ignora la categoría, por
 * lo que un puesto se cubre sin importar la categoría seleccionada.
 */
export const CATEGORIAS = ['N/A', 'A', 'B', 'C', 'D'] as const;


/**
 * PLANTILLA AUTORIZADA — Números inamovibles
 *
 * Cada entrada define el headcount aprobado por puesto/área/sección.
 * Modificar solo con autorización de Dirección.
 *
 * ─────────────────────────────────────────────────────────────────────
 * FLAGS OPCIONALES POR PUESTO (configurables aquí, sin tocar código):
 *
 *   urgentes: N       → N contrataciones urgentes pendientes (independiente
 *                       de las vacantes — puede contar contra el back-up).
 *                       El dashboard muestra badge rojo "URGEN N" cuando N > 0
 *                       y suma todas las urgentes del departamento en el header.
 *
 *   backup: N         → permite N excedentes intencionales (back-up de plantilla).
 *                       El dashboard mostrará "+N BACK-UP" en verde-teal cuando
 *                       la plantilla real exceda lo autorizado, hasta este número.
 *                       Si el excedente supera N, lo que sobre se etiqueta como
 *                       "EXCEDE" en rojo.
 *
 *   notas: "texto"    → nota interna explicando el back-up o la urgencia.
 *
 *   sueldo: N         → sueldo base mensual del puesto, en MXN. La requisición
 *                       lo pre-llena automáticamente; si se omite, queda en
 *                       blanco para captura manual del reclutador.
 *
 *   bono: true|false  → si el puesto tiene bono asociado. La requisición
 *                       muestra "Sí" / "No" en lugar de casillas vacías.
 *
 *   bono_monto: N     → monto del bono mensual en MXN (solo si bono = true).
 *                       La requisición lo pre-llena automáticamente.
 *
 * Ejemplo:
 *   { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 1ER. TURNO',
 *     puesto: 'OPERADOR DE MÁQUINA', plantilla_autorizada: 32,
 *     backup: 2, urgentes: 1,
 *     notas: 'Buffer ante ausentismo. 1 contratación urgente.' }
 * ─────────────────────────────────────────────────────────────────────
 */
export const PLANTILLA_AUTORIZADA: AuthorizedPosition[] = [
  // ── ALMACÉN ──
  { area: 'ALMACÉN', seccion: 'ALMACÉN', puesto: 'JEFE DE ALMACÉN', plantilla_autorizada: 1 },
  { area: 'ALMACÉN', seccion: 'ALMACÉN', puesto: 'CHOFER', plantilla_autorizada: 1 },
  { area: 'ALMACÉN', seccion: 'ALMACÉN', puesto: 'AUXILIAR ADMINISTRATIVO DE ALMACÉN', plantilla_autorizada: 2 },
  { area: 'ALMACÉN', seccion: 'ALMACÉN 1ER TURNO', puesto: 'AUXILIAR DE ALMACÉN', plantilla_autorizada: 7, bono: true, bono_monto: 345 },
  { area: 'ALMACÉN', seccion: 'ALMACÉN 2DO TURNO', puesto: 'ALMACENISTA DE MATERIA PRIMA', plantilla_autorizada: 1, bono: true, bono_monto: 345 },
  { area: 'ALMACÉN', seccion: 'ALMACÉN 2DO TURNO', puesto: 'AUXILIAR DE ALMACÉN', plantilla_autorizada: 5, bono: true, bono_monto: 345 },

  // ── CALIDAD ──
  {
    area: 'CALIDAD',
    seccion: 'A. CALIDAD 1ER TURNO',
    puesto: 'OPERADOR DE ACABADOS GP-12',
    plantilla_autorizada: 22,
    bono: true,
    bono_monto: 619,
    backup: 2,
  },
  { area: 'CALIDAD', seccion: 'A. CALIDAD 2DO. TURNO', puesto: 'OPERADOR DE ACABADOS GP-12', plantilla_autorizada: 22, bono: true, bono_monto: 619, backup: 2 },
  { area: 'CALIDAD', seccion: 'CALIDAD ADMTVO', puesto: 'GERENTE DE CALIDAD', plantilla_autorizada: 1 },
  { area: 'CALIDAD', seccion: 'CALIDAD ADMTVO', puesto: 'INGENIERO DE CALIDAD', plantilla_autorizada: 2 },
  { area: 'CALIDAD', seccion: 'CALIDAD ADMTVO', puesto: 'SUPERVISOR DE ACABADOS - GP12', plantilla_autorizada: 2, bono: true, bono_monto: 619 },
  { area: 'CALIDAD', seccion: 'CALIDAD ADMTVO', puesto: 'INSPECTOR RECIBO', plantilla_autorizada: 1 },
  {
    area: 'CALIDAD',
    seccion: 'CALIDAD ADMTVO',
    puesto: 'INSPECTOR DE CALIDAD',
    plantilla_autorizada: 15,
    notas: 'Backup autorizado 1 y 1 extra por maternidad de 4040 SOFIA.',
    backup: 2,
  },
  { area: 'CALIDAD', seccion: 'CALIDAD ADMTVO', puesto: 'AUXILIAR DE CALIDAD', plantilla_autorizada: 1 },
  { area: 'CALIDAD', seccion: 'METROLOGÍA', puesto: 'METRÓLOGO', plantilla_autorizada: 13 },
  { area: 'CALIDAD', seccion: 'METROLOGÍA', puesto: 'AUXILIAR DE METROLOGÍA', plantilla_autorizada: 4 },

  // ── GERENCIA ──
  { area: 'GERENCIA', seccion: 'GERENCIA', puesto: 'GERENTE DE PLANTA', plantilla_autorizada: 1 },

  // ── LOGISTICA ──
  { area: 'LOGISTICA', seccion: 'LOGISTICA', puesto: 'JEFE DE LOGISTICA', plantilla_autorizada: 1 },
  { area: 'LOGISTICA', seccion: 'LOGISTICA', puesto: 'SUPERVISOR DE LOGISTICA', plantilla_autorizada: 1 },

  // ── MANTENIMIENTO ──
  { area: 'MANTENIMIENTO', seccion: 'MANTENIMIENTO', puesto: 'JEFE DE MANTENIMIENTO', plantilla_autorizada: 1 },
  { area: 'MANTENIMIENTO', seccion: 'MANTENIMIENTO', puesto: 'AUXILIAR ADMINISTRATIVO DE MANTENIMIENTO', plantilla_autorizada: 1 },
  { area: 'MANTENIMIENTO', seccion: 'MANTENIMIENTO', puesto: 'TÉCNICO ESPECIALISTA DE MANTENIMIENTO', plantilla_autorizada: 1 },
  { area: 'MANTENIMIENTO', seccion: 'MANTENIMIENTO', puesto: 'TECNICO DE MANTENIMIENTO DE EDIFICIOS', plantilla_autorizada: 1, bono: true, bono_monto: 345 },
  { area: 'MANTENIMIENTO', seccion: 'MANTENIMIENTO', puesto: 'TÉCNICO DE MANTENIMIENTO', plantilla_autorizada: 8, bono: true, bono_monto: 345 },
  {
    area: 'MANTENIMIENTO',
    seccion: 'MANTENIMIENTO',
    puesto: 'AUXILIAR DE MANTENIMIENTO',
    plantilla_autorizada: 2,
    bono: true, bono_monto: 619,
  },

  // ── TALLER DE MOLDES ──
  { area: 'TALLER DE MOLDES', seccion: 'MOLDES', puesto: 'JEFE DE TALLER DE MOLDES', plantilla_autorizada: 1 },
  { area: 'TALLER DE MOLDES', seccion: 'MOLDES', puesto: 'AUXILIAR ADMINISTRATIVO DE TALLER DE MOLDES', plantilla_autorizada: 1 },
  {
    area: 'TALLER DE MOLDES',
    seccion: 'MOLDES',
    puesto: 'TÉCNICO DE MOLDES',
    plantilla_autorizada: 13,
    bono: true,
    bono_monto: 345,
  },


  
  // ── PRODUCCIÓN 1ER TURNO ──
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 1ER. TURNO', puesto: 'AUXILIAR DE SUPERVISOR', plantilla_autorizada: 1, bono: true, bono_monto: 619 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 1ER. TURNO', puesto: 'CHECK LIST', plantilla_autorizada: 1, bono: true, bono_monto: 619 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 1ER. TURNO', puesto: 'PREPARADOR', plantilla_autorizada: 2, bono: true, bono_monto: 619 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 1ER. TURNO', puesto: 'MATERIALISTA', plantilla_autorizada: 2, bono: true, bono_monto: 619 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 1ER. TURNO', puesto: 'AUXILIAR DE BÁSCULA', plantilla_autorizada: 1, bono: true, bono_monto: 619 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 1ER. TURNO', puesto: 'CAPTURISTA RPS', plantilla_autorizada: 2, bono: true, bono_monto: 619 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 1ER. TURNO', puesto: 'AUXILIAR SCRAP', plantilla_autorizada: 1, bono: true, bono_monto: 619 },
  {
    area: 'PRODUCCIÓN',
    seccion: 'PRODUCCIÓN 1ER. TURNO',
    puesto: 'OPERADOR DE MÁQUINA',
    plantilla_autorizada: 32,
    backup: 10,
    notas: 'BackUp: 5 por ausentismo + 10 asignados al proyecto StarLight',
    bono: true,
    bono_monto: 619,
  },

  // ── PRODUCCIÓN 2o TURNO ──
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 2o. TURNO', puesto: 'AUXILIAR DE SUPERVISOR', plantilla_autorizada: 1, bono: true, bono_monto: 619 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 2o. TURNO', puesto: 'CHECK LIST', plantilla_autorizada: 1, bono: true, bono_monto: 619 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 2o. TURNO', puesto: 'PREPARADOR', plantilla_autorizada: 2, bono: true, bono_monto: 619 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 2o. TURNO', puesto: 'MATERIALISTA', plantilla_autorizada: 2, bono: true, bono_monto: 619 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 2o. TURNO', puesto: 'AUXILIAR DE BÁSCULA', plantilla_autorizada: 1, bono: true, bono_monto: 619 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 2o. TURNO', puesto: 'CAPTURISTA RPS', plantilla_autorizada: 1, bono: true, bono_monto: 619 },
  {
    area: 'PRODUCCIÓN',
    seccion: 'PRODUCCIÓN 2o. TURNO',
    puesto: 'OPERADOR DE MÁQUINA',
    plantilla_autorizada: 32,
    backup: 5,
    notas: 'Back-up por ausentismo y rotación del turno.',
    bono: true,
    bono_monto: 619,
  },

  // ── PRODUCCIÓN 3ER TURNO ──
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 3ER. TURNO', puesto: 'AUXILIAR DE SUPERVISOR', plantilla_autorizada: 1, bono: true, bono_monto: 619 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 3ER. TURNO', puesto: 'CHECK LIST', plantilla_autorizada: 1, bono: true, bono_monto: 619 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 3ER. TURNO', puesto: 'PREPARADOR', plantilla_autorizada: 2, bono: true, bono_monto: 619 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 3ER. TURNO', puesto: 'MATERIALISTA', plantilla_autorizada: 2, bono: true, bono_monto: 619 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 3ER. TURNO', puesto: 'AUXILIAR DE BÁSCULA', plantilla_autorizada: 1, bono: true, bono_monto: 619 },
  {
    area: 'PRODUCCIÓN',
    seccion: 'PRODUCCIÓN 3ER. TURNO',
    puesto: 'OPERADOR DE MÁQUINA',
    plantilla_autorizada: 32,
    backup: 5,
    notas: 'Back-up por ausentismo y rotación del turno.',
    bono: true,
    bono_monto: 619,
  },

  // ── PRODUCCIÓN 4o TURNO ──
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 4o. TURNO', puesto: 'AUXILIAR DE SUPERVISOR', plantilla_autorizada: 1, bono: true, bono_monto: 619 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 4o. TURNO', puesto: 'CHECK LIST', plantilla_autorizada: 1, bono: true, bono_monto: 619 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 4o. TURNO', puesto: 'PREPARADOR', plantilla_autorizada: 2, bono: true, bono_monto: 619 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 4o. TURNO', puesto: 'MATERIALISTA', plantilla_autorizada: 2, bono: true, bono_monto: 619 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 4o. TURNO', puesto: 'AUXILIAR DE BÁSCULA', plantilla_autorizada: 1, bono: true, bono_monto: 619 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 4o. TURNO', puesto: 'CAPTURISTA RPS', plantilla_autorizada: 1, bono: true, bono_monto: 619 },
  {
    area: 'PRODUCCIÓN',
    seccion: 'PRODUCCIÓN 4o. TURNO',
    puesto: 'OPERADOR DE MÁQUINA',
    plantilla_autorizada: 32,
    backup: 5,
    notas: 'Back-up por ausentismo y rotación del turno.',
    bono: true,
    bono_monto: 619,
  },

  // ── PRODUCCIÓN ADMTVO ──
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN ADMTVO', puesto: 'GERENTE DE PRODUCCION', plantilla_autorizada: 1 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN ADMTVO', puesto: 'JEFE DE PROCESO', plantilla_autorizada: 1 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN ADMTVO', puesto: 'INGENIERO DE PROCESO', plantilla_autorizada: 4 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN ADMTVO', puesto: 'PLANEADOR DE PRODUCCIÓN', plantilla_autorizada: 1 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN ADMTVO', puesto: 'SUPERVISOR DE PRODUCCIÓN', plantilla_autorizada: 14 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN ADMTVO', puesto: 'ASISTENTE DE PRODUCCIÓN', plantilla_autorizada: 2 },

  // ── PRODUCCIÓN MONTAJE ──
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN MONTAJE', puesto: 'SUPERVISOR DE MONTAJE DE MOLDES', plantilla_autorizada: 1 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN MONTAJE', puesto: 'MONTADOR DE MOLDES', plantilla_autorizada: 7, bono: true, bono_monto: 345 },

  // ── PROYECTOS ──
  { area: 'PROYECTOS', seccion: 'PROYECTOS', puesto: 'LIDER DE PROYECTOS', plantilla_autorizada: 3 },
  { area: 'PROYECTOS', seccion: 'PROYECTOS', puesto: 'LIDER DE COTIZACIONES', plantilla_autorizada: 1 },
  { area: 'PROYECTOS', seccion: 'PROYECTOS', puesto: 'INGENIERO DE PROYECTOS', plantilla_autorizada: 4 },
  { area: 'PROYECTOS', seccion: 'PROYECTOS', puesto: 'AUXILIAR DE PROYECTOS', plantilla_autorizada: 1 },

  // ── RECURSOS HUMANOS ──
  { area: 'RECURSOS HUMANOS', seccion: 'RECURSOS HUMANOS', puesto: 'JEFE DE RECURSOS HUMANOS', plantilla_autorizada: 1 },
  { area: 'RECURSOS HUMANOS', seccion: 'RECURSOS HUMANOS', puesto: 'COORDINADOR DE RECLUTAMIENTO Y SELECCIÓN', plantilla_autorizada: 1 },
  { area: 'RECURSOS HUMANOS', seccion: 'RECURSOS HUMANOS', puesto: 'ANALISTA DE SEGURIDAD E HIGIENE', plantilla_autorizada: 1 },
  { area: 'RECURSOS HUMANOS', seccion: 'RECURSOS HUMANOS', puesto: 'ANALISTA DE CAPACITACIÓN', plantilla_autorizada: 1 },
  { area: 'RECURSOS HUMANOS', seccion: 'RECURSOS HUMANOS', puesto: 'ANALISTA DE RECLUTAMIENTO Y SELECCIÓN', plantilla_autorizada: 2 },
  { area: 'RECURSOS HUMANOS', seccion: 'RECURSOS HUMANOS', puesto: 'ANALISTA DE RECURSOS HUMANOS', plantilla_autorizada: 1 },
  { area: 'RECURSOS HUMANOS', seccion: 'RECURSOS HUMANOS', puesto: 'ASISTENTE DE RECURSOS HUMANOS', plantilla_autorizada: 1 },
  { area: 'RECURSOS HUMANOS', seccion: 'RECURSOS HUMANOS', puesto: 'AUXILIAR DE LIMPIEZA', plantilla_autorizada: 4, bono: true, bono_monto: 668 },

  // ── SGI ──
  { area: 'SGI', seccion: 'SGI', puesto: 'COORDINADOR DE SGI', plantilla_autorizada: 1 },
  { area: 'SGI', seccion: 'SGI', puesto: 'AUXILIAR DEL SGI', plantilla_autorizada: 1 },

  // ── SISTEMAS ──
  { area: 'SISTEMAS', seccion: 'SISTEMAS', puesto: 'COORDINADOR DE RPS', plantilla_autorizada: 1 },
  { area: 'SISTEMAS', seccion: 'SISTEMAS', puesto: 'AUXILIAR PROGRAMADOR', plantilla_autorizada: 1 },

  // ── COMERCIAL ──
  { area: 'COMERCIAL', seccion: 'VENTAS', puesto: 'GERENCIA COMERCIAL', plantilla_autorizada: 1 },
];

/**
 * HABILIDADES POR PUESTO — Catálogo editable
 *
 * Pre-llena el bloque "Habilidades requeridas" de la requisición.
 * Búsqueda por (área, sección, puesto) con normalización de acentos y
 * sufijo de turno (A/B/C/D).
 *
 * Campos opcionales por entrada:
 *   habilidades  → conocimientos técnicos, sistemas, herramientas.
 *   escolaridad  → nivel académico mínimo o deseable.
 *   experiencia  → experiencia mínima requerida.
 *
 * Si un puesto no aparece aquí, la requisición deja el bloque en blanco
 * para captura manual.
 */
/**
 * RECLUTADORES_ACTIVOS — Nombres canonicos de las personas del area de
 * reclutamiento cuyos KPIs se muestran en el hero de la pagina de
 * candidatos.
 *
 * El campo `reclutador` de un candidato es texto libre; cualquier nombre
 * fuera de esta lista se ignora en el conteo del hero (no se grafica y
 * no se cuenta en el denominador). Para agregar / quitar gente, edita
 * esta lista. El match es case-insensitive y tolerante a acentos
 * (via normalizeString).
 */
export const RECLUTADORES_ACTIVOS = [
  'ALEXANDRA',
  'DANIELA',
  'LEONARDO',
] as const;

export const HABILIDADES_PUESTOS: PuestoHabilidades[] = [
  {
    area: 'ALMACÉN',
    seccion: 'ALMACÉN 1ER TURNO',
    puesto: 'AUXILIAR DE ALMACÉN',
    competencias: 'ORDENADO, RESPONSABLE Y PROACTIVO, TRABAJO BAJO PRESION, AGILIDAD MENTAL, TRATO CON PROVEEDORES, ACTITUD DE SERVICIO, HONESTO, PUNTUAL,DINÁMICO',
    conocimientos_tecnicos: 'CONOCIMIENTO EN ENTRADAS Y SALIDAS DE MATERIAL, ACOMODO E IDENTIFICACION DE PRODUCTOS Y MATERIALES, CONOCIMIENTO DE INVENTARIOS',
    escolaridad: 'SECUNDARIA',
    experiencia: 'CAPTURA ALFANUMÉRICA Y NUMÉRICA, CONOCIMIENTO DE FACTURAS, ORDENES DE PRODUCCIÓN, REQUISICIÓN DE MP, PT, E INSUMOS, CONOCIMIENTO DE ORDENES DE COMPRA, DEVOLUCIONES, NOTAS DE CREDITO, MANEJO DE MONTACARGAS, MANEJO DE EQUIPO DE COMPUTO,REALIZACION DE REPORTES, CONOCIMIENTO Y MANEJO DE SAE, CONOCIMIENTO DE FILOSOFIA 5´S',
  },
  {
    area: 'ALMACÉN',
    seccion: 'ALMACÉN 2DO TURNO',
    puesto: 'AUXILIAR DE ALMACÉN',
    competencias: 'ORDENADO, RESPONSABLE Y PROACTIVO, TRABAJO BAJO PRESION, AGILIDAD MENTAL, TRATO CON PROVEEDORES, ACTITUD DE SERVICIO, HONESTO, PUNTUAL,DINÁMICO',
    conocimientos_tecnicos: 'CONOCIMIENTO EN ENTRADAS Y SALIDAS DE MATERIAL, ACOMODO E IDENTIFICACION DE PRODUCTOS Y MATERIALES, CONOCIMIENTO DE INVENTARIOS',
    escolaridad: 'SECUNDARIA',
    experiencia: 'CAPTURA ALFANUMÉRICA Y NUMÉRICA, CONOCIMIENTO DE FACTURAS, ORDENES DE PRODUCCIÓN, REQUISICIÓN DE MP, PT, E INSUMOS, CONOCIMIENTO DE ORDENES DE COMPRA, DEVOLUCIONES, NOTAS DE CREDITO, MANEJO DE MONTACARGAS, MANEJO DE EQUIPO DE COMPUTO,REALIZACION DE REPORTES, CONOCIMIENTO Y MANEJO DE SAE, CONOCIMIENTO DE FILOSOFIA 5´S',
  },
  {
    area: 'CALIDAD',
    seccion: 'A. CALIDAD 1ER TURNO',
    puesto: 'OPERADOR DE ACABADOS GP-12',
    competencias:
      'ORDENADO, OBSERVADOR, PROACTIVO, TRABAJO BAJO PRESIÓN, TRABAJO POR OBJETIVOS, ACTITUD DE SERVICIO, ANALÍTICO',
    conocimientos_tecnicos:
      'CONOCIMIENTOS BÁSICOS SOBRE MAQUINARIA DE INYECCIÓN, LÍNEAS DE PRODUCCIÓN, PROCESOS PRODUCTIVOS',
    escolaridad: 'SECUNDARIA',
    experiencia: '',
  },
  {
    area: 'CALIDAD',
    seccion: 'A. CALIDAD 2DO TURNO',
    puesto: 'OPERADOR DE ACABADOS GP-12',
    competencias: 'ORDENADO, OBSERVADOR, PROACTIVO, TRABAJO BAJO PRESIÓN, TRABAJO POR OBJETIVOS, ACTITUD DE SERVICIO, ANALÍTICO',
    conocimientos_tecnicos:
      'CONOCIMIENTOS BÁSICOS SOBRE MAQUINARIA DE INYECCIÓN, LÍNEAS DE PRODUCCIÓN, PROCESOS PRODUCTIVOS',
    escolaridad: 'SECUNDARIA',
    experiencia: '',
  },
  {
    area: 'CALIDAD',
    seccion: 'CALIDAD ADMTVO',
    puesto: 'INSPECTOR DE CALIDAD',
    competencias:
      'ORDENADO, OBSERVADOR, ANALITICO, DISCIPLINADO, ORIENTADO A RESULTADOS, COMUNICACIÓN EFECTIVA, PROACTIVO, TRABAJO BAJO PRESIÓN',
    conocimientos_tecnicos:
      'MANEJO Y ELABORACIÓN DE REPORTES, LINEAS DE PRODUCCIÓN, CONOCIMIENTO EN MAQUINAS DE INYECCION, NORMAS DE CALIDAD (6 MESES EN PUESTO SIMILAR)',
    escolaridad: 'PREPARATORIA/ INGENIERIA',
    experiencia: 'MANEJO DE MP, MUESTREO Y ANÁLISIS DE PP/PT, LÍNEAS DE PRODUCCIÓN Y CALIDAD DE PROCESOS. OPERACIÓN DE EQUIPO DE MEDICIÓN (CABINA DE LUZ, COMPARADOR ÓPTICO, ESPECTROFOTÓMETRO, CALIBRADORES DE ALTURA Y HUMEDAD, PERNOS CALIBRADOS). SEGUIMIENTO A RE-TRABAJOS, REPORTES, GRÁFICAS DE CONTROL Y MANEJO DE SAE. CONOCIMIENTO DE NORMAS ISO/TS 16949:2009 Y ANSI Z1.4-1993, FILOSOFÍA 5S Y AUDITORÍAS INTERNAS.',
  },
  {
    area: 'PRODUCCIÓN',
    seccion: 'PRODUCCIÓN 1ER. TURNO',
    puesto: 'OPERADOR DE MÁQUINA',
    competencias: 'ORDENADO, OBSERVADOR, PROACTIVO, TRABAJO BAJO PRESIÓN, TRABAJO POR OBJETIVOS, ACTITUD DE SERVICIO, ANALITICO',
    conocimientos_tecnicos: 'CONOCIMIENTOS BÁSICO SOBRE MAQUINARIA DE INYECCIÓN, LÍNEAS DE PRODUCCIÓN, PROCESOS PRODUCTIVOS,CONOCIMIENTO EN MANEJO DE MP DEL ÁREA, ANALISIS DE PRODUCTO,  TERMINADO, LINEAS DE PRODUCCIÓN, SEGUIMIENTO A RE-TRABAJOS, REALIZACIÓN DE REPORTES, CONOCIMIENTO DE LA NORMA ISO/TS 16949:2009, CONOCIMIENTO DE FILOSOFÍA 5´S',
    escolaridad: 'SECUNDARIA',
    experiencia: 'CONOCIMIENTO EN MANEJO DE MP DEL ÁREA, ANALISIS DE PRODUCTO,  TERMINADO, LINEAS DE PRODUCCIÓN, SEGUIMIENTO A RE-TRABAJOS, REALIZACIÓN DE REPORTES, CONOCIMIENTO DE LA NORMA ISO/TS 16949:2009, CONOCIMIENTO DE FILOSOFÍA 5´S',
  },
  {
    area: 'PRODUCCIÓN',
    seccion: 'PRODUCCIÓN 2o. TURNO',
    puesto: 'OPERADOR DE MÁQUINA',
    competencias: 'ORDENADO, OBSERVADOR, PROACTIVO, TRABAJO BAJO PRESIÓN, TRABAJO POR OBJETIVOS, ACTITUD DE SERVICIO, ANALITICO',
    conocimientos_tecnicos: 'CONOCIMIENTOS BÁSICO SOBRE MAQUINARIA DE INYECCIÓN, LÍNEAS DE PRODUCCIÓN, PROCESOS PRODUCTIVOS,CONOCIMIENTO EN MANEJO DE MP DEL ÁREA, ANALISIS DE PRODUCTO,  TERMINADO, LINEAS DE PRODUCCIÓN, SEGUIMIENTO A RE-TRABAJOS, REALIZACIÓN DE REPORTES, CONOCIMIENTO DE LA NORMA ISO/TS 16949:2009, CONOCIMIENTO DE FILOSOFÍA 5´S',
    escolaridad: 'SECUNDARIA',
    experiencia: 'CONOCIMIENTO EN MANEJO DE MP DEL ÁREA, ANALISIS DE PRODUCTO,  TERMINADO, LINEAS DE PRODUCCIÓN, SEGUIMIENTO A RE-TRABAJOS, REALIZACIÓN DE REPORTES, CONOCIMIENTO DE LA NORMA ISO/TS 16949:2009, CONOCIMIENTO DE FILOSOFÍA 5´S',
  },
  {
    area: 'PRODUCCIÓN',
    seccion: 'PRODUCCIÓN 3ER. TURNO',
    puesto: 'OPERADOR DE MÁQUINA',
    competencias: 'ORDENADO, OBSERVADOR, PROACTIVO, TRABAJO BAJO PRESIÓN, TRABAJO POR OBJETIVOS, ACTITUD DE SERVICIO, ANALITICO',
    conocimientos_tecnicos: 'CONOCIMIENTOS BÁSICO SOBRE MAQUINARIA DE INYECCIÓN, LÍNEAS DE PRODUCCIÓN, PROCESOS PRODUCTIVOS,CONOCIMIENTO EN MANEJO DE MP DEL ÁREA, ANALISIS DE PRODUCTO,  TERMINADO, LINEAS DE PRODUCCIÓN, SEGUIMIENTO A RE-TRABAJOS, REALIZACIÓN DE REPORTES, CONOCIMIENTO DE LA NORMA ISO/TS 16949:2009, CONOCIMIENTO DE FILOSOFÍA 5´S',
    escolaridad: 'SECUNDARIA',
    experiencia: 'CONOCIMIENTO EN MANEJO DE MP DEL ÁREA, ANALISIS DE PRODUCTO,  TERMINADO, LINEAS DE PRODUCCIÓN, SEGUIMIENTO A RE-TRABAJOS, REALIZACIÓN DE REPORTES, CONOCIMIENTO DE LA NORMA ISO/TS 16949:2009, CONOCIMIENTO DE FILOSOFÍA 5´S',
  },
  {
    area: 'PRODUCCIÓN',
    seccion: 'PRODUCCIÓN 4o. TURNO',
    puesto: 'OPERADOR DE MÁQUINA',
    competencias: 'ORDENADO, OBSERVADOR, PROACTIVO, TRABAJO BAJO PRESIÓN, TRABAJO POR OBJETIVOS, ACTITUD DE SERVICIO, ANALITICO',
    conocimientos_tecnicos: 'CONOCIMIENTOS BÁSICO SOBRE MAQUINARIA DE INYECCIÓN, LÍNEAS DE PRODUCCIÓN, PROCESOS PRODUCTIVOS,CONOCIMIENTO EN MANEJO DE MP DEL ÁREA, ANALISIS DE PRODUCTO,  TERMINADO, LINEAS DE PRODUCCIÓN, SEGUIMIENTO A RE-TRABAJOS, REALIZACIÓN DE REPORTES, CONOCIMIENTO DE LA NORMA ISO/TS 16949:2009, CONOCIMIENTO DE FILOSOFÍA 5´S',
    escolaridad: 'SECUNDARIA',
    experiencia: 'CONOCIMIENTO EN MANEJO DE MP DEL ÁREA, ANALISIS DE PRODUCTO,  TERMINADO, LINEAS DE PRODUCCIÓN, SEGUIMIENTO A RE-TRABAJOS, REALIZACIÓN DE REPORTES, CONOCIMIENTO DE LA NORMA ISO/TS 16949:2009, CONOCIMIENTO DE FILOSOFÍA 5´S',
  },
  {
    area: 'PRODUCCIÓN',
    seccion: 'PRODUCCIÓN ADMTVO',
    puesto: 'SUPERVISOR DE PRODUCCIÓN',
    competencias: 'ACTITUD DE SERVICIO, RESPETUOSO, LIDERAZGO, DISCIPLINADO, ORDENADO, COMUNICACIÓN EFECTIVA, ANALITICO, TOMA DE DECISIONES, PROACTIVO, TRABAJO BAJO PRESIÓN',
    conocimientos_tecnicos: 'MANEJO  MICROSSOFT OFFICE, MANEJO DE PERSONAL, LINEAS DE PRODUCCIÓN, CONOCIMIENTO DE MAQUINAS DE INYECCIÓN',
    escolaridad: 'INGENIERIA CONCLUIDA',
    experiencia: 'CONOCIMIENTO EN MANEJO DE INSUMOS DEL AREA (MP), CALIDAD DE PROCESOS, CONOCIMIENTO DE MAQUINAS DE INYECCIÓN, EQUIPO PERIFERICO, LÍNEAS DE PROCESOS DE PRODUCCIÓN, MANEJO DE PERSONAL, HABILIDADES ADMINISTRATIVAS, MANEJO DE EQUIPO DE COMPUTO, REALIZACIÓN DE REPORTES, MANEJO DE SISTEMA RPS',
  },
  {
    area: 'MANTENIMIENTO',
    seccion: 'MANTENIMIENTO',
    puesto: 'TÉCNICO DE MANTENIMIENTO',
    competencias: 'CONFIABLE ORDENADO, ORIENTADO A RESULTADOS, TRABAJO POR OBJETIVOS, TOMA DE DECISIONES, RESPONSABLE, PROACTIVO, TRABAJO BAJO PRESIÓN, ANALITICO, ACTITUD DE SERVICIO, HONESTO, ETICO, PUNTUAL',
    conocimientos_tecnicos: 'MANEJO Y MANTENIMIENTO DE MAQUINARIAS DE INYECCIÓN, EQUIPO PERIFÉRICO, MANTENIMIENTO DE LA INFRAESTRUCTURA DE LA PLANTA',
    escolaridad: 'CARRERA TÉCNICA MECANICO INDUSTRIAL CONCLUIDO O PASANTE',
    experiencia: 'CONOCIMIENTO EN MANEJO DE INVENTARIOS E INSUMOS DE ÁREA, MANEJO DE MAQUINARIA ESPECIALIZADA,CONOCIMIETOS SOBRE MÁQUINAS DE INYECCIÓN Y EQUIPOS PERIFERICOS, CONOCIMIENTOS GENERALES EN MANTENIMIENTO DE INFRAESTRUCTURA, MANEJO DE EQUIPO DE CÓMPUTO, REALIZACIÓN DE REPORTES, CONOCIMIENTO DE LA NORMA ISO/TS 16949:2009, CONOCIMIENTO DE METODOLOGIA 5´S',
  },
];

/**
 * Comment type labels for display
 */
export const COMMENT_TYPE_LABELS: Record<string, string> = {
  proceso_activo: 'Proceso Activo',
  entrevista: 'En Entrevista',
  entrega_documentos: 'Entrega de Documentos',
  otro: 'Otro',
};

/**
 * Comment type colors using design tokens
 */
export const COMMENT_TYPE_COLORS: Record<string, string> = {
  proceso_activo: 'var(--color-accent-amber)',
  entrevista: 'var(--color-accent-teal)',
  entrega_documentos: 'var(--color-primary)',
  otro: 'var(--color-muted)',
};

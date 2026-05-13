import type { AuthorizedPosition } from './types';

/**
 * PLANTILLA AUTORIZADA — Números inamovibles
 * Cada entrada define el headcount aprobado por puesto/área/sección.
 * Modificar solo con autorización de Dirección.
 */
export const PLANTILLA_AUTORIZADA: AuthorizedPosition[] = [
  // ── ALMACÉN ──
  { area: 'ALMACÉN', seccion: 'ALMACÉN', puesto: 'JEFE DE ALMACÉN', plantilla_autorizada: 1 },
  { area: 'ALMACÉN', seccion: 'ALMACÉN', puesto: 'CHOFER', plantilla_autorizada: 1 },
  { area: 'ALMACÉN', seccion: 'ALMACÉN 1ER TURNO', puesto: 'AUXILIAR ADMINISTRATIVO DE ALMACÉN', plantilla_autorizada: 2 },
  { area: 'ALMACÉN', seccion: 'ALMACÉN 1ER TURNO', puesto: 'AUXILIAR DE ALMACÉN', plantilla_autorizada: 7 },
  { area: 'ALMACÉN', seccion: 'ALMACÉN 2DO TURNO', puesto: 'ALMACENISTA DE MATERIA PRIMA', plantilla_autorizada: 1 },
  { area: 'ALMACÉN', seccion: 'ALMACÉN 2DO TURNO', puesto: 'AUXILIAR DE ALMACÉN', plantilla_autorizada: 5 },

  // ── CALIDAD ──
  { area: 'CALIDAD', seccion: 'A. CALIDAD 1ER TURNO', puesto: 'OPERADOR DE ACABADOS GP-12', plantilla_autorizada: 22 },
  { area: 'CALIDAD', seccion: 'A. CALIDAD 2DO. TURNO', puesto: 'OPERADOR DE ACABADOS GP-12', plantilla_autorizada: 22 },
  { area: 'CALIDAD', seccion: 'CALIDAD ADMTVO', puesto: 'GERENTE DE CALIDAD', plantilla_autorizada: 1 },
  { area: 'CALIDAD', seccion: 'CALIDAD ADMTVO', puesto: 'INGENIERO DE CALIDAD', plantilla_autorizada: 2 },
  { area: 'CALIDAD', seccion: 'CALIDAD ADMTVO', puesto: 'SUPERVISOR DE ACABADOS - GP12', plantilla_autorizada: 2 },
  { area: 'CALIDAD', seccion: 'CALIDAD ADMTVO', puesto: 'INSPECTOR RECIBO', plantilla_autorizada: 1 },
  { area: 'CALIDAD', seccion: 'CALIDAD ADMTVO', puesto: 'INSPECTOR DE CALIDAD', plantilla_autorizada: 15 },
  { area: 'CALIDAD', seccion: 'CALIDAD ADMTVO', puesto: 'AUXILIAR DE CALIDAD', plantilla_autorizada: 1 },
  { area: 'CALIDAD', seccion: 'METROLOGÍA', puesto: 'METRÓLOGO', plantilla_autorizada: 13 },
  { area: 'CALIDAD', seccion: 'METROLOGÍA', puesto: 'AUXILIAR DE METROLOGÍA', plantilla_autorizada: 4 },
  { area: 'CALIDAD', seccion: 'RESIDENTES DE CALIDAD', puesto: 'RESIDENTE', plantilla_autorizada: 3 },

  // ── GERENCIA ──
  { area: 'GERENCIA', seccion: 'GERENCIA', puesto: 'GERENTE DE PLANTA', plantilla_autorizada: 1 },

  // ── LOGISTICA ──
  { area: 'LOGISTICA', seccion: 'LOGISTICA', puesto: 'JEFE DE LOGISTICA', plantilla_autorizada: 1 },
  { area: 'LOGISTICA', seccion: 'LOGISTICA', puesto: 'SUPERVISOR DE LOGISTICA', plantilla_autorizada: 1 },

  // ── MANTENIMIENTO ──
  { area: 'MANTENIMIENTO', seccion: 'MANTENIMIENTO', puesto: 'JEFE DE MANTENIMIENTO', plantilla_autorizada: 1 },
  { area: 'MANTENIMIENTO', seccion: 'MANTENIMIENTO', puesto: 'AUXILIAR ADMINISTRATIVO DE MANTENIMIENTO', plantilla_autorizada: 1 },
  { area: 'MANTENIMIENTO', seccion: 'MANTENIMIENTO', puesto: 'TÉCNICO ESPECIALISTA DE MANTENIMIENTO', plantilla_autorizada: 1 },
  { area: 'MANTENIMIENTO', seccion: 'MANTENIMIENTO', puesto: 'TECNICO DE MANTENIMIENTO DE EDIFICIOS', plantilla_autorizada: 1 },
  { area: 'MANTENIMIENTO', seccion: 'MANTENIMIENTO', puesto: 'AUXILIAR DE MANTENIMIENTO', plantilla_autorizada: 2 },
  { area: 'MANTENIMIENTO', seccion: 'MANTENIMIENTO', puesto: 'TÉCNICO DE MANTENIMIENTO', plantilla_autorizada: 8 },

  // ── TALLER DE MOLDES ──
  { area: 'TALLER DE MOLDES', seccion: 'MOLDES', puesto: 'JEFE DE TALLER DE MOLDES', plantilla_autorizada: 1 },
  { area: 'TALLER DE MOLDES', seccion: 'MOLDES', puesto: 'AUXILIAR ADMINISTRATIVO DE TALLER DE MOLDES', plantilla_autorizada: 1 },
  { area: 'TALLER DE MOLDES', seccion: 'MOLDES', puesto: 'TÉCNICO DE MOLDES', plantilla_autorizada: 13 },

  // ── PRODUCCIÓN 1ER TURNO ──
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 1ER. TURNO', puesto: 'AUXILIAR DE SUPERVISOR', plantilla_autorizada: 1 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 1ER. TURNO', puesto: 'CHECK LIST', plantilla_autorizada: 1 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 1ER. TURNO', puesto: 'PREPARADOR', plantilla_autorizada: 2 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 1ER. TURNO', puesto: 'MATERIALISTA', plantilla_autorizada: 2 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 1ER. TURNO', puesto: 'AUXILIAR DE BÁSCULA', plantilla_autorizada: 1 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 1ER. TURNO', puesto: 'CAPTURISTA RPS', plantilla_autorizada: 2 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 1ER. TURNO', puesto: 'AUXILIAR SCRAP', plantilla_autorizada: 1 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 1ER. TURNO', puesto: 'OPERADOR DE MÁQUINA', plantilla_autorizada: 32 },

  // ── PRODUCCIÓN 2o TURNO ──
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 2o. TURNO', puesto: 'AUXILIAR DE SUPERVISOR', plantilla_autorizada: 1 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 2o. TURNO', puesto: 'CHECK LIST', plantilla_autorizada: 1 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 2o. TURNO', puesto: 'PREPARADOR', plantilla_autorizada: 2 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 2o. TURNO', puesto: 'MATERIALISTA', plantilla_autorizada: 2 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 2o. TURNO', puesto: 'AUXILIAR DE BÁSCULA', plantilla_autorizada: 1 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 2o. TURNO', puesto: 'CAPTURISTA RPS', plantilla_autorizada: 1 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 2o. TURNO', puesto: 'OPERADOR DE MÁQUINA', plantilla_autorizada: 32 },

  // ── PRODUCCIÓN 3ER TURNO ──
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 3ER. TURNO', puesto: 'AUXILIAR DE SUPERVISOR', plantilla_autorizada: 1 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 3ER. TURNO', puesto: 'CHECK LIST', plantilla_autorizada: 1 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 3ER. TURNO', puesto: 'PREPARADOR', plantilla_autorizada: 2 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 3ER. TURNO', puesto: 'MATERIALISTA', plantilla_autorizada: 2 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 3ER. TURNO', puesto: 'AUXILIAR DE BÁSCULA', plantilla_autorizada: 1 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 3ER. TURNO', puesto: 'OPERADOR DE MÁQUINA', plantilla_autorizada: 32 },

  // ── PRODUCCIÓN 4o TURNO ──
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 4o. TURNO', puesto: 'AUXILIAR DE SUPERVISOR', plantilla_autorizada: 1 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 4o. TURNO', puesto: 'CHECK LIST', plantilla_autorizada: 1 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 4o. TURNO', puesto: 'PREPARADOR', plantilla_autorizada: 2 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 4o. TURNO', puesto: 'MATERIALISTA', plantilla_autorizada: 2 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 4o. TURNO', puesto: 'AUXILIAR DE BÁSCULA', plantilla_autorizada: 1 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 4o. TURNO', puesto: 'CAPTURISTA RPS', plantilla_autorizada: 1 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN 4o. TURNO', puesto: 'OPERADOR DE MÁQUINA', plantilla_autorizada: 32 },

  // ── PRODUCCIÓN ADMTVO ──
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN ADMTVO', puesto: 'GERENTE DE PRODUCCION', plantilla_autorizada: 1 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN ADMTVO', puesto: 'JEFE DE PROCESO', plantilla_autorizada: 1 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN ADMTVO', puesto: 'INGENIERO DE PROCESO', plantilla_autorizada: 4 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN ADMTVO', puesto: 'PLANEADOR DE PRODUCCIÓN', plantilla_autorizada: 1 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN ADMTVO', puesto: 'SUPERVISOR DE PRODUCCIÓN', plantilla_autorizada: 14 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN ADMTVO', puesto: 'PRACTICANTE DE PRODUCCIÓN', plantilla_autorizada: 1 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN ADMTVO', puesto: 'ASISTENTE DE PRODUCCIÓN', plantilla_autorizada: 2 },

  // ── PRODUCCIÓN MONTAJE ──
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN MONTAJE', puesto: 'SUPERVISOR DE MONTAJE DE MOLDES', plantilla_autorizada: 1 },
  { area: 'PRODUCCIÓN', seccion: 'PRODUCCIÓN MONTAJE', puesto: 'MONTADOR DE MOLDES', plantilla_autorizada: 7 },

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
  { area: 'RECURSOS HUMANOS', seccion: 'RECURSOS HUMANOS', puesto: 'AUXILIAR DE LIMPIEZA', plantilla_autorizada: 4 },

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

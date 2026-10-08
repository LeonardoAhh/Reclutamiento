import type { Activity, Candidate } from '@/lib/types';

/**
 * Datos representativos EXCLUSIVOS de la captura de Boneyard
 * (`isBoneyardBuild()`, solo en desarrollo con `window.__BONEYARD_BUILD`).
 *
 * La captura corre sin sesión: las tablas protegidas por perfil/RLS llegan
 * vacías y el snapshot terminaba dibujando el estado vacío en vez del
 * contenido. Con estas muestras la página real renderiza su propio markup
 * (tabla en desktop, cards en móvil) y los bones reflejan cada breakpoint.
 * Nunca se usan en producción ni sustituyen datos reales.
 */

/** Una página completa de la lista de candidatos (ITEMS_PER_PAGE = 9). */
export const BONEYARD_SAMPLE_CANDIDATES: readonly Candidate[] = [
  { id: 'bones-c1', nombre: 'Hernández López María Fernanda', puesto: 'Operador de producción', area: 'Producción', seccion: 'Inyección', status: 'entrevista', reclutador: 'Lic. Ana Torres', fecha_cita: '2026-09-15', fecha_aplicacion: '2026-09-10' },
  { id: 'bones-c2', nombre: 'García Ramírez José Luis', puesto: 'Montacarguista', area: 'Almacén', seccion: 'Embarques', status: 'entrega_documentos', reclutador: 'Lic. Carlos Ruiz', fecha_cita: '2026-09-16', fecha_aplicacion: '2026-09-09' },
  { id: 'bones-c3', nombre: 'Martínez Sánchez Laura', puesto: 'Inspector de calidad', area: 'Calidad', seccion: 'Liberación', status: 'faltan_documentos', reclutador: 'Lic. Ana Torres', fecha_cita: null, fecha_aplicacion: '2026-09-08' },
  { id: 'bones-c4', nombre: 'Pérez Gómez Juan Carlos', puesto: 'Técnico de mantenimiento', area: 'Mantenimiento', seccion: 'Moldes', status: 'feedback_pendiente', reclutador: 'Lic. Sofía Medina', fecha_cita: '2026-09-17', fecha_aplicacion: '2026-09-07' },
  { id: 'bones-c5', nombre: 'Rodríguez Cruz Daniela', puesto: 'Operador de producción', area: 'Producción', seccion: 'Ensamble', status: 'entrevista', reclutador: 'Lic. Carlos Ruiz', fecha_cita: '2026-09-15', fecha_aplicacion: '2026-09-11' },
  { id: 'bones-c6', nombre: 'Flores Morales Ricardo', puesto: 'Auxiliar de almacén', area: 'Almacén', seccion: 'Recibo', status: 'entrega_documentos', reclutador: null, fecha_cita: null, fecha_aplicacion: '2026-09-06' },
  { id: 'bones-c7', nombre: 'Díaz Vargas Alejandra', puesto: 'Supervisor de turno', area: 'Producción', seccion: 'Inyección', status: 'feedback_pendiente', reclutador: 'Lic. Sofía Medina', fecha_cita: '2026-09-18', fecha_aplicacion: '2026-09-05' },
  { id: 'bones-c8', nombre: 'Torres Jiménez Miguel Ángel', puesto: 'Operador de producción', area: 'Producción', seccion: 'Empaque', status: 'entrevista', reclutador: 'Lic. Ana Torres', fecha_cita: '2026-09-19', fecha_aplicacion: '2026-09-12' },
  { id: 'bones-c9', nombre: 'Ramos Castillo Paola', puesto: 'Analista de compras', area: 'Compras', seccion: null, status: 'faltan_documentos', reclutador: 'Lic. Carlos Ruiz', fecha_cita: null, fecha_aplicacion: '2026-09-04' },
];

/**
 * Pestaña inicial de Actividades = Vacantes (`tipo: 'vacante'`). Se incluyen
 * también responsabilidades y actividades únicas para no capturar pestañas
 * vacías si la pestaña inicial cambia.
 */
export const BONEYARD_SAMPLE_ACTIVITIES: readonly Activity[] = [
  { id: 'bones-a1', titulo: 'Operador de producción — Inyección', descripcion: 'Cubrir dos posiciones del turno matutino.', estado: 'pendiente', tipo: 'vacante', asignado_a: null },
  { id: 'bones-a2', titulo: 'Montacarguista — Embarques', descripcion: 'Licencia vigente y experiencia mínima de un año.', estado: 'en_proceso', tipo: 'vacante', asignado_a: 'bones-recruiter' },
  { id: 'bones-a3', titulo: 'Inspector de calidad — Liberación', descripcion: 'Turno nocturno, disponibilidad inmediata.', estado: 'en_proceso', tipo: 'vacante', asignado_a: 'bones-recruiter' },
  { id: 'bones-a4', titulo: 'Técnico de mantenimiento — Moldes', descripcion: 'Conocimientos de hidráulica y neumática.', estado: 'pendiente', tipo: 'vacante', asignado_a: null },
  { id: 'bones-a5', titulo: 'Auxiliar de almacén — Recibo', descripcion: 'Reemplazo por baja voluntaria.', estado: 'pendiente', tipo: 'vacante', asignado_a: 'bones-recruiter' },
  { id: 'bones-a6', titulo: 'Supervisor de turno — Ensamble', descripcion: 'Liderazgo de equipos de veinte personas.', estado: 'en_proceso', tipo: 'vacante', asignado_a: null },
  { id: 'bones-a7', titulo: 'Actualizar reporte semanal de rotación', descripcion: 'Enviar cada lunes a coordinación.', estado: 'pendiente', tipo: 'rutinaria', asignado_a: 'bones-recruiter' },
  { id: 'bones-a8', titulo: 'Revisar expedientes incompletos', descripcion: 'Confirmar documentos pendientes de contratación.', estado: 'en_proceso', tipo: 'unica', asignado_a: 'bones-recruiter' },
];

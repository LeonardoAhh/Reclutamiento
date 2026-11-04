import { useEffect, useState, useMemo } from 'react';
import {
  normalizeEmpleadoRuta,
  type EmpleadoRuta,
} from '@/lib/rutas-data';
import { loadPrivateAppDatasets, type PrivateDatasetId } from '@/lib/privateAppDatasets';

export type { EmpleadoRuta } from '@/lib/rutas-data';

export const ROUTE_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;

/** Calendario estándar por turno (días que se trabajan). */
const DEFAULT_SCHEDULE: Record<string, string[]> = {
  '1': ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  '2': ['Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
  '3': ['Viernes', 'Sábado', 'Domingo', 'Lunes', 'Martes'],
  '4': ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves'],
};

/**
 * Secciones del turno 2 que trabajan Lun–Sáb en vez de Mié–Dom.
 * Fuente: catálogo de secciones provisto por RH.
 */
const T2_LUN_SAB_SECTIONS = new Set([
  'A. CALIDAD 2DO. TURNO',
  'ALMACÉN 2DO TURNO',
]);

const SCHEDULE_LUN_SAB = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/**
 * Devuelve los días laborales de un empleado según su turno y sección.
 * La mayoría de las secciones siguen el calendario estándar del turno,
 * pero algunas secciones de T2 trabajan Lun–Sáb en vez de Mié–Dom.
 */
export function getWorkingDays(turno: string, seccion?: string): string[] {
  if (turno === '2' && seccion && T2_LUN_SAB_SECTIONS.has(seccion.trim())) {
    return SCHEDULE_LUN_SAB;
  }
  return DEFAULT_SCHEDULE[turno] || [];
}

const ROUTE_CAPACITIES = [
  { "TURNO": "1", "RUTAS": "R1- QUERETARO- PIE DE LA CUESTA", "CAPACIDAD": "21" },
  { "TURNO": "1", "RUTAS": "R2- SAN JOSE ITURBIDE", "CAPACIDAD": "21" },
  { "TURNO": "1", "RUTAS": "R3- SAN JOSE ITURBIDE 2", "CAPACIDAD": "14" },
  { "TURNO": "1", "RUTAS": "R4-SANTA ROSA", "CAPACIDAD": "21" },
  { "TURNO": "1", "RUTAS": "R5- QUERETARO-AV. DE LA LUZ", "CAPACIDAD": "21" },
  { "TURNO": "1", "RUTAS": "R6- AV. DE LA LUZ - PASEOS QUERETARO", "CAPACIDAD": "21" },
  { "TURNO": "2", "RUTAS": "R1- QUERETARO- PIE DE LA CUESTA", "CAPACIDAD": "21" },
  { "TURNO": "2", "RUTAS": "R2- SAN JOSE ITURBIDE", "CAPACIDAD": "21" },
  { "TURNO": "2", "RUTAS": "R3- SAN JOSE ITURBIDE 2", "CAPACIDAD": "14" },
  { "TURNO": "2", "RUTAS": "R4-SANTA ROSA", "CAPACIDAD": "21" },
  { "TURNO": "2", "RUTAS": "R5- QUERETARO-AV. DE LA LUZ", "CAPACIDAD": "21" },
  { "TURNO": "2", "RUTAS": "R6- AV. DE LA LUZ - PASEOS QUERETARO", "CAPACIDAD": "21" },
  { "TURNO": "3", "RUTAS": "R1- QUERETARO- PIE DE LA CUESTA", "CAPACIDAD": "21" },
  { "TURNO": "3", "RUTAS": "R2- SAN JOSE ITURBIDE", "CAPACIDAD": "21" },
  { "TURNO": "3", "RUTAS": "R4-SANTA ROSA", "CAPACIDAD": "21" },
  { "TURNO": "3", "RUTAS": "R5- QUERETARO-AV. DE LA LUZ", "CAPACIDAD": "21" },
  { "TURNO": "3", "RUTAS": "R6- AV. DE LA LUZ - PASEOS QUERETARO", "CAPACIDAD": "21" },
  { "TURNO": "4", "RUTAS": "R1- QUERETARO- PIE DE LA CUESTA", "CAPACIDAD": "21" },
  { "TURNO": "4", "RUTAS": "R2- SAN JOSE ITURBIDE", "CAPACIDAD": "21" },
  { "TURNO": "4", "RUTAS": "R4-SANTA ROSA", "CAPACIDAD": "21" },
  { "TURNO": "4", "RUTAS": "R5- QUERETARO-AV. DE LA LUZ", "CAPACIDAD": "21" },
  { "TURNO": "4", "RUTAS": "R6- AV. DE LA LUZ - PASEOS QUERETARO", "CAPACIDAD": "21" }
];

/* ─── Normalised internal types ─── */
export interface RutaAgrupada {
  nombreRuta: string;
  empleados: EmpleadoRuta[];
  empleadosPrev: EmpleadoRuta[];
  totalEmpleados: number;
  paradas: string[];
  turnosCount: Record<string, number>;
  turnosCountPrev: Record<string, number>;
  maxCapacityPerShift: Record<string, number>;
  capacityPerDay: Record<string, number>;
}

/** Empleados que laboran un día dado según su calendario de turno y sección. */
export function getEmpleadosPorDia(
  empleados: EmpleadoRuta[],
  dia: string,
): EmpleadoRuta[] {
  return empleados.filter((emp) =>
    getWorkingDays(emp.turno, emp.seccion).includes(dia),
  );
}

/** Turnos únicos que laboran un día dado, ordenados numéricamente. */
export function getTurnosPorDia(
  empleados: EmpleadoRuta[],
  dia: string,
): string[] {
  const turnos = new Set<string>();
  for (const emp of empleados) {
    if (getWorkingDays(emp.turno, emp.seccion).includes(dia)) turnos.add(emp.turno);
  }
  return Array.from(turnos).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function groupByRuta(empleados: EmpleadoRuta[], empleadosPrev: EmpleadoRuta[] = []): RutaAgrupada[] {
  const map = new Map<string, RutaAgrupada>();

  const ensureGroup = (nombreRuta: string): RutaAgrupada => {
    const existing = map.get(nombreRuta);
    if (existing) return existing;
    const group: RutaAgrupada = {
      nombreRuta,
      empleados: [],
      empleadosPrev: [],
      totalEmpleados: 0,
      paradas: [],
      turnosCount: {},
      turnosCountPrev: {},
      maxCapacityPerShift: {},
      capacityPerDay: {
        'Lunes': 0, 'Martes': 0, 'Miércoles': 0, 'Jueves': 0,
        'Viernes': 0, 'Sábado': 0, 'Domingo': 0,
      },
    };
    map.set(nombreRuta, group);
    return group;
  };

  for (const emp of empleados) {
    const group = ensureGroup(emp.nombreRuta);
    group.empleados.push(emp);
    group.totalEmpleados += 1;
    if (!group.paradas.includes(emp.parada)) group.paradas.push(emp.parada);
    group.turnosCount[emp.turno] = (group.turnosCount[emp.turno] ?? 0) + 1;
    
    // Add to daily capacity based on shift schedule and section.
    const schedule = getWorkingDays(emp.turno, emp.seccion);
    for (const day of schedule) {
      if (group.capacityPerDay[day] !== undefined) {
        group.capacityPerDay[day] += 1;
      }
    }
  }

  for (const empPrev of empleadosPrev) {
    const group = ensureGroup(empPrev.nombreRuta);
    group.empleadosPrev.push(empPrev);
    group.turnosCountPrev[empPrev.turno] = (group.turnosCountPrev[empPrev.turno] ?? 0) + 1;
  }

  // Populate max capacities
  for (const group of map.values()) {
    for (const cap of ROUTE_CAPACITIES) {
      if (cap.RUTAS === group.nombreRuta) {
        group.maxCapacityPerShift[cap.TURNO] = parseInt(cap.CAPACIDAD, 10);
      }
    }
    
    // Turno 4 acts as a wildcard shift, riding T1 on Sunday, T2 on Mon/Tue, and T3 on Wed/Thu.
    // Therefore, Turno 4's capacity is constrained by the SMALLEST bus it has to ride.
    const cap1 = group.maxCapacityPerShift['1'];
    const cap2 = group.maxCapacityPerShift['2'];
    const cap3 = group.maxCapacityPerShift['3'];
    
    const validCaps = [cap1, cap2, cap3].filter(c => c !== undefined);
    if (validCaps.length > 0) {
      group.maxCapacityPerShift['4'] = Math.min(...validCaps);
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.nombreRuta.localeCompare(b.nombreRuta)
  );
}

export function useRutas({ currentOnly = false }: { currentOnly?: boolean } = {}) {
  const [rawData, setRawData] = useState<EmpleadoRuta[]>([]);
  const [rawPrevData, setRawPrevData] = useState<EmpleadoRuta[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [hasComparison, setHasComparison] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setErrorMsg(null);
      try {
        const ids: PrivateDatasetId[] = currentOnly
          ? ['routes_current']
          : ['routes_current', 'routes_previous', 'routes_info'];
        const datasets = await loadPrivateAppDatasets(ids, controller.signal);
        if (controller.signal.aborted) return;
        const currentData = datasets.get('routes_current');
        if (!Array.isArray(currentData)) throw new Error('No se pudieron cargar las rutas actuales.');
        setRawData(currentData
          .map(normalizeEmpleadoRuta)
          .filter((emp): emp is EmpleadoRuta => emp !== null));

        const previousData = datasets.get('routes_previous');
        if (Array.isArray(previousData)) {
          const prevMapped = previousData
            .map(normalizeEmpleadoRuta)
            .filter((emp): emp is EmpleadoRuta => emp !== null);
          setRawPrevData(prevMapped);
          setHasComparison(true);
        }

        const infoData = datasets.get('routes_info');
        if (infoData && typeof infoData === 'object' && 'fecha' in infoData && typeof infoData.fecha === 'string') {
          setLastUpdated(infoData.fecha);
        }
      } catch (err: any) {
        if (controller.signal.aborted) return;
        setErrorMsg(err.message || 'Error al cargar las rutas');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [currentOnly]);

  const rutas = useMemo(() => groupByRuta(rawData, rawPrevData), [rawData, rawPrevData]);

  return { rutas, lastUpdated, hasComparison, loading, errorMsg };
}

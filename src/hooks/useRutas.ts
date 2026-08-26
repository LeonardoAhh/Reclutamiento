import { useEffect, useState, useMemo } from 'react';
import { mapClaveHorarioToTurno } from '@/lib/transporte-routes';

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
export interface EmpleadoRuta {
  numeroEmpleado: string;
  nombre: string;
  turno: string;
  nombreRuta: string;
  colonia: string;
  parada: string;
  seccion?: string;
}

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

export function useRutas() {
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
        const ts = Date.now();
        const base = import.meta.env.BASE_URL || '/';
        const urlRutas = (base.endsWith('/') ? base + 'rutas.json' : base + '/rutas.json') + '?t=' + ts;
        const urlAnterior = (base.endsWith('/') ? base + 'rutas-anterior.json' : base + '/rutas-anterior.json') + '?t=' + ts;
        const urlInfo = (base.endsWith('/') ? base + 'rutas-info.json' : base + '/rutas-info.json') + '?t=' + ts;
        
        console.log("Fetching rutas from:", urlRutas);

        const [res, resPrev, resInfo] = await Promise.all([
          fetch(urlRutas, { signal: controller.signal }),
          fetch(urlAnterior, { signal: controller.signal }).catch(() => null),
          fetch(urlInfo, { signal: controller.signal }).catch(() => null)
        ]);

        if (res && res.ok) {
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('text/html')) {
            throw new Error(`El servidor devolvió HTML (posible SPA fallback) en lugar de JSON.`);
          }

          const data = await res.json();
          const currentMapped = (Array.isArray(data) ? data : [])
            .map((emp: any) => ({
              numeroEmpleado: String(emp['numero empleado'] || emp.numeroEmpleado || emp.num_empleado || ''),
              nombre: String(emp.nombre || ''),
              turno: mapClaveHorarioToTurno(String(emp.turno || '')),
              nombreRuta: String(emp['nombre ruta'] || emp.nombreRuta || emp.ruta || ''),
              colonia: String(emp.colonia || ''),
              parada: String(emp.parada || ''),
              seccion: typeof emp.seccion === 'string' ? emp.seccion.trim() : undefined,
            }))
            .filter((emp: EmpleadoRuta) => emp.nombreRuta.trim() !== '');
          setRawData(currentMapped);
        } else {
          throw new Error(`No se pudo cargar rutas.json (status: ${res ? res.status : 'network error'})`);
        }

        if (resPrev && resPrev.ok) {
          const prevData = await resPrev.json();
          const prevMapped = (Array.isArray(prevData) ? prevData : [])
            .map((emp: any) => ({
              numeroEmpleado: String(emp['numero empleado'] || emp.numeroEmpleado || emp.num_empleado || ''),
              nombre: String(emp.nombre || ''),
              turno: mapClaveHorarioToTurno(String(emp.turno || '')),
              nombreRuta: String(emp['nombre ruta'] || emp.nombreRuta || emp.ruta || ''),
              colonia: String(emp.colonia || ''),
              parada: String(emp.parada || ''),
              seccion: typeof emp.seccion === 'string' ? emp.seccion.trim() : undefined,
            }))
            .filter((emp: EmpleadoRuta) => emp.nombreRuta.trim() !== '');
          setRawPrevData(prevMapped);
          setHasComparison(true);
        }

        if (resInfo && resInfo.ok) {
          const infoData = await resInfo.json();
          if (infoData.fecha) {
            setLastUpdated(infoData.fecha);
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setErrorMsg(err.message || 'Error al cargar los archivos de rutas');
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const rutas = useMemo(() => groupByRuta(rawData, rawPrevData), [rawData, rawPrevData]);

  return { rutas, lastUpdated, hasComparison, loading, errorMsg };
}

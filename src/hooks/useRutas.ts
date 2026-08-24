import { useEffect, useState, useMemo } from 'react';
import { mapClaveHorarioToTurno } from '@/lib/transporte-routes';
import { supabase } from '@/lib/supabase';

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

  for (const emp of empleados) {
    if (!map.has(emp.nombreRuta)) {
      map.set(emp.nombreRuta, {
        nombreRuta: emp.nombreRuta,
        empleados: [],
        empleadosPrev: [],
        totalEmpleados: 0,
        paradas: [],
        turnosCount: {},
        turnosCountPrev: {},
        maxCapacityPerShift: {},
        capacityPerDay: {
          'Lunes': 0, 'Martes': 0, 'Miércoles': 0, 'Jueves': 0, 'Viernes': 0, 'Sábado': 0, 'Domingo': 0
        }
      });
    }
    const group = map.get(emp.nombreRuta)!;
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
    if (map.has(empPrev.nombreRuta)) {
      const group = map.get(empPrev.nombreRuta)!;
      group.empleadosPrev.push(empPrev);
      group.turnosCountPrev[empPrev.turno] = (group.turnosCountPrev[empPrev.turno] ?? 0) + 1;
    }
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
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const { data: empleadosData, error: empleadosError } = await supabase
          .from('empleados')
          .select('num_empleado, nombre, turno, seccion, ruta, colonia, parada')
          .not('ruta', 'is', null)
          .neq('ruta', '');

        if (empleadosError) throw empleadosError;

        const { data: snapshotData, error: snapshotError } = await supabase
          .from('rutas_snapshots')
          .select('snapshot_data, created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (snapshotError) throw snapshotError;

        const currentMapped = (empleadosData || []).map(emp => ({
          numeroEmpleado: emp.num_empleado,
          nombre: emp.nombre,
          turno: mapClaveHorarioToTurno(emp.turno || ''),
          nombreRuta: emp.ruta || '',
          colonia: emp.colonia || '',
          parada: emp.parada || '',
          seccion: emp.seccion?.trim() || undefined,
        }));
        
        setRawData(currentMapped);

        if (snapshotData && snapshotData.snapshot_data) {
          const snapshotArr = Array.isArray(snapshotData.snapshot_data) ? snapshotData.snapshot_data : [];
          const prevMapped = snapshotArr.map(emp => ({
            numeroEmpleado: emp.numeroEmpleado || emp.numero_empleado,
            nombre: emp.nombre,
            turno: mapClaveHorarioToTurno(emp.turno || ''),
            nombreRuta: emp.nombreRuta || emp.ruta || '',
            colonia: emp.colonia || '',
            parada: emp.parada || '',
            seccion: emp.seccion?.trim() || undefined,
          }));
          setRawPrevData(prevMapped);
          setLastUpdated(new Date(snapshotData.created_at).toISOString());
        }

      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setErrorMsg(err.message || 'Error al cargar rutas desde Supabase');
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const rutas = useMemo(() => groupByRuta(rawData, rawPrevData), [rawData, rawPrevData]);

  return { rutas, lastUpdated, loading, errorMsg };
}

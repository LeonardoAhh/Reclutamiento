import { useEffect, useState, useMemo } from 'react';

const SHIFT_SCHEDULE: Record<string, string[]> = {
  '1': ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  '2': ['Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
  '3': ['Viernes', 'Sábado', 'Domingo', 'Lunes', 'Martes'],
  '4': ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves'],
};

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
  { "TURNO": "3", "RUTAS": "R6- AV. DE LA LUZ - PASEOS QUERETARO", "CAPACIDAD": "21" }
];

/* ─── Raw shape from JSON ─── */
interface EmpleadoRutaRaw {
  'numero empleado': string;
  nombre: string;
  turno: string;
  'nombre ruta': string;
  colonia: string;
  parada: string;
}

/* ─── Normalised internal types ─── */
export interface EmpleadoRuta {
  numeroEmpleado: string;
  nombre: string;
  turno: string;
  nombreRuta: string;
  colonia: string;
  parada: string;
}

export interface RutaAgrupada {
  nombreRuta: string;
  empleados: EmpleadoRuta[];
  totalEmpleados: number;
  paradas: string[];
  turnosCount: Record<string, number>;
  maxCapacityPerShift: Record<string, number>;
  capacityPerDay: Record<string, number>;
}

const RUTAS_URL = '/rutas.json';

function normalise(raw: EmpleadoRutaRaw): EmpleadoRuta {
  return {
    numeroEmpleado: raw['numero empleado'],
    nombre: raw.nombre,
    turno: raw.turno,
    nombreRuta: raw['nombre ruta'],
    colonia: raw.colonia,
    parada: raw.parada,
  };
}

function groupByRuta(empleados: EmpleadoRuta[]): RutaAgrupada[] {
  const map = new Map<string, RutaAgrupada>();

  for (const emp of empleados) {
    if (!map.has(emp.nombreRuta)) {
      map.set(emp.nombreRuta, {
        nombreRuta: emp.nombreRuta,
        empleados: [],
        totalEmpleados: 0,
        paradas: [],
        turnosCount: {},
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
    
    // Add to daily capacity based on shift schedule
    const schedule = SHIFT_SCHEDULE[emp.turno] || [];
    for (const day of schedule) {
      if (group.capacityPerDay[day] !== undefined) {
        group.capacityPerDay[day] += 1;
      }
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
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const res = await fetch(RUTAS_URL, { signal: controller.signal });

        if (!res.ok) throw new Error(`No se pudo cargar rutas.json (${res.status})`);

        const ct = res.headers.get('content-type') ?? '';
        if (ct.includes('text/html')) {
          throw new Error(
            'El servidor devolvió HTML en lugar de JSON. Verifica que rutas.json esté en public/.'
          );
        }

        const data: EmpleadoRutaRaw[] = await res.json();
        setRawData(data.map(normalise));
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setErrorMsg(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const rutas = useMemo(() => groupByRuta(rawData), [rawData]);

  return { rutas, loading, errorMsg };
}

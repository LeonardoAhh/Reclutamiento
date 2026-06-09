import { useEffect, useState, useMemo } from 'react';

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
      });
    }
    const group = map.get(emp.nombreRuta)!;
    group.empleados.push(emp);
    group.totalEmpleados += 1;
    if (!group.paradas.includes(emp.parada)) group.paradas.push(emp.parada);
    group.turnosCount[emp.turno] = (group.turnosCount[emp.turno] ?? 0) + 1;
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

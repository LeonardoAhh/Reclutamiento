import { canonicalizeKeyPart, canonicalizePuesto } from '@/lib/utils';
import { businessDaysBetween } from '@/lib/dates';
import { DEFAULT_VACANCY_SLA_DAYS } from '@/lib/types';
import type { AuthorizedPosition, Baja, Employee, VacancyRequest } from '@/lib/types';

export type AutoVacancyStatus = 'cubierta' | 'abierta';

export interface CoveringEmployee {
  num_empleado: string;
  nombre: string;
  fecha_ingreso: string;
}

export interface AutoVacancy {
  /** Identificador estable (id de la baja o su num_empleado). */
  key: string;
  baja: Baja;
  area: string;
  seccion: string;
  puesto: string;
  fechaBaja: string;
  status: AutoVacancyStatus;
  /** Cómo se cubrió: ingreso nuevo (auto) o marcada a mano (interna). */
  coberturaTipo: 'auto' | 'manual' | null;
  coveredBy: CoveringEmployee | null;
  /** Fecha en que se considera cubierta (ingreso del nuevo o fecha manual). */
  fechaCubierta: string | null;
  /** Reclutador asignado por el usuario. */
  reclutador: string | null;
  /** Días hábiles desde la baja hasta la cobertura (o hasta hoy si abierta). */
  dias: number;
  /** Meta de cobertura en días hábiles (SLA). */
  slaDays: number;
  /**
   * Cumplimiento del SLA:
   *  - cubierta: true = se cubrió en ≤ SLA (a tiempo), false = tarde.
   *  - abierta : true = aún dentro del SLA, false = vencida.
   */
  enTiempo: boolean;
}

/**
 * Clave de puesto: área + sección + puesto, normalizados.
 * El puesto usa `normalizePuesto` para ignorar el sufijo de categoría
 * (p. ej. "OPERADOR DE MÁQUINA D" == "OPERADOR DE MÁQUINA"), que en Bajas
 * viene pegado al puesto pero en Empleados va en `categoria`.
 */
function positionKey(x: { area: string; seccion: string; puesto: string }): string {
  // Quitamos espacios al final del key para que "GP-12" / "GP 12" / "GP12"
  // (y cualquier diferencia de espaciado) converjan al mismo valor.
  const sp = (s: string) => s.replace(/\s+/g, '');
  return `${sp(canonicalizeKeyPart(x.area))}||${sp(canonicalizeKeyPart(x.seccion))}||${sp(
    canonicalizePuesto(x.puesto)
  )}`;
}

function toTime(d: string | undefined | null): number {
  if (!d) return NaN;
  const t = new Date(d).getTime();
  return Number.isNaN(t) ? NaN : t;
}

/**
 * Deriva las vacantes a partir de las bajas y los empleados actuales.
 *
 * Reglas (definidas con el usuario):
 *  - Toda baja genera una vacante.
 *  - Se empareja por área + sección + puesto (exacto, normalizado).
 *  - Una baja se cubre con el empleado del MISMO puesto cuya `fecha_ingreso`
 *    sea ≥ `fecha_baja`, eligiendo el ingreso MÁS RECIENTE disponible.
 *  - Emparejamiento 1 a 1: cada ingreso cubre a lo sumo una baja. Se procesan
 *    las bajas de la más reciente a la más antigua.
 *  - Si la baja está marcada como cubierta a mano (promoción/transferencia
 *    interna), cuenta como cubierta y NO consume un ingreso nuevo.
 */
export function computeAutoVacancies(
  bajas: Baja[],
  employees: Employee[]
): AutoVacancy[] {
  // Empleados agrupados por puesto, ordenados por ingreso descendente.
  const empByKey = new Map<string, { emp: Employee; used: boolean }[]>();
  for (const emp of employees) {
    const k = positionKey(emp);
    const list = empByKey.get(k) ?? [];
    list.push({ emp, used: false });
    empByKey.set(k, list);
  }
  for (const list of empByKey.values()) {
    list.sort((a, b) => toTime(b.emp.fecha_ingreso) - toTime(a.emp.fecha_ingreso));
  }

  // Bajas agrupadas por puesto.
  const bajasByKey = new Map<string, Baja[]>();
  for (const b of bajas) {
    const k = positionKey(b);
    const list = bajasByKey.get(k) ?? [];
    list.push(b);
    bajasByKey.set(k, list);
  }

  const coverageByBaja = new Map<Baja, CoveringEmployee>();

  for (const [k, list] of bajasByKey) {
    const slots = empByKey.get(k) ?? [];
    // Solo las bajas NO cubiertas a mano compiten por ingresos nuevos.
    const autoBajas = list
      .filter((b) => !b.cubierta_manual)
      .sort((a, b) => toTime(b.fecha_baja) - toTime(a.fecha_baja));

    for (const baja of autoBajas) {
      const bajaTime = toTime(baja.fecha_baja);
      // slots ya está ordenado por ingreso desc → el primero libre con
      // ingreso ≥ fecha_baja es el "más reciente elegible".
      const slot = slots.find(
        (s) => !s.used && toTime(s.emp.fecha_ingreso) >= bajaTime
      );
      if (slot) {
        slot.used = true;
        coverageByBaja.set(baja, {
          num_empleado: slot.emp.num_empleado,
          nombre: slot.emp.nombre,
          fecha_ingreso: slot.emp.fecha_ingreso,
        });
      }
    }
  }

  const now = Date.now();

  return bajas.map((baja) => {
    const key = baja.id ?? baja.num_empleado;
    const auto = coverageByBaja.get(baja) ?? null;

    let status: AutoVacancyStatus = 'abierta';
    let coberturaTipo: 'auto' | 'manual' | null = null;
    let coveredBy: CoveringEmployee | null = null;
    let fechaCubierta: string | null = null;

    if (baja.cubierta_manual) {
      status = 'cubierta';
      coberturaTipo = 'manual';
      fechaCubierta = baja.cubierta_fecha ?? null;
    } else if (auto) {
      status = 'cubierta';
      coberturaTipo = 'auto';
      coveredBy = auto;
      fechaCubierta = auto.fecha_ingreso;
    }

    // "Días transcurridos" hábiles: 0 el mismo día de la baja.
    // Pasamos la fecha de cobertura como STRING para que se interprete en TZ
    // MX (evita un segundo desfase de zona horaria).
    const endArg: string | Date =
      status === 'cubierta' && fechaCubierta ? fechaCubierta : new Date(now);
    const dias = baja.fecha_baja
      ? Math.max(0, businessDaysBetween(baja.fecha_baja, endArg) - 1)
      : 0;

    const slaDays = DEFAULT_VACANCY_SLA_DAYS;
    const enTiempo = dias <= slaDays;

    return {
      key,
      baja,
      area: baja.area,
      seccion: baja.seccion,
      puesto: baja.puesto,
      fechaBaja: baja.fecha_baja,
      status,
      coberturaTipo,
      coveredBy,
      fechaCubierta,
      reclutador: baja.cubierta_reclutador ?? null,
      dias,
      slaDays,
      enTiempo,
    };
  });
}

/**
 * Adapta una vacante automática a la forma `VacancyRequest` que consumen los
 * KPIs y modales existentes (TTF, cobertura faltante). La "apertura" es la
 * fecha de baja y la "cobertura" la fecha de ingreso del nuevo / fecha manual.
 */
export function autoVacancyToRequest(v: AutoVacancy): VacancyRequest {
  return {
    id: v.key,
    puesto: v.puesto,
    area: v.area,
    seccion: v.seccion || null,
    fecha_apertura: v.fechaBaja,
    fecha_cubierta: v.fechaCubierta,
    reclutador_asignado: v.reclutador,
    status: v.status,
    prioridad: 'media',
    dias_sla: null,
    excluida_indicador: false,
  };
}


export interface SplitPair {
  autorizado: number;
  backup: number;
}

export interface VacancySplit {
  vacantes: SplitPair;
  cubiertas: SplitPair;
  abiertas: SplitPair;
  /** Cobertura en % (cubiertas / vacantes) por tipo. */
  cobertura: SplitPair;
}

/**
 * Divide las vacantes (derivadas de bajas) en AUTORIZADO vs BACKUP usando la
 * plantilla definida en código (`AuthorizedPosition`).
 *
 * Regla (definida con el usuario):
 *  - Por cada puesto (área + sección + puesto), la plantilla define
 *    `plantilla_autorizada = A` y `backup = B`.
 *  - Las vacantes del puesto se ordenan por fecha de baja ascendente; las
 *    primeras A cuentan como AUTORIZADO y las siguientes (hasta B) como BACKUP.
 *  - Cualquier excedente más allá de A + B vuelve a contar como AUTORIZADO
 *    (demanda del puesto base, no buffer).
 *  - Puestos sin entrada en la plantilla → todo AUTORIZADO.
 *
 * Cada vacante se clasifica una sola vez, de modo que los 4 indicadores
 * (totales, cubiertas, abiertas, cobertura) quedan internamente consistentes:
 * cubiertas + abiertas = total, por tipo.
 */
export function splitVacanciesByPlantilla(
  vacancies: AutoVacancy[],
  positions: AuthorizedPosition[]
): VacancySplit {
  const plantillaByKey = new Map<string, { A: number; B: number }>();
  for (const p of positions) {
    plantillaByKey.set(positionKey(p), {
      A: p.plantilla_autorizada,
      B: p.backup ?? 0,
    });
  }

  const byKey = new Map<string, AutoVacancy[]>();
  for (const v of vacancies) {
    const k = positionKey(v);
    const list = byKey.get(k) ?? [];
    list.push(v);
    byKey.set(k, list);
  }

  let vacAut = 0;
  let vacBak = 0;
  let cubAut = 0;
  let cubBak = 0;
  let abiAut = 0;
  let abiBak = 0;

  for (const [k, list] of byKey) {
    const plant = plantillaByKey.get(k);
    const A = plant ? plant.A : Number.POSITIVE_INFINITY;
    const B = plant ? plant.B : 0;
    const sorted = [...list].sort((a, b) => a.fechaBaja.localeCompare(b.fechaBaja));
    sorted.forEach((v, i) => {
      const isBackup = i >= A && i < A + B;
      const covered = v.status === 'cubierta';
      if (isBackup) {
        vacBak += 1;
        if (covered) cubBak += 1;
        else abiBak += 1;
      } else {
        vacAut += 1;
        if (covered) cubAut += 1;
        else abiAut += 1;
      }
    });
  }

  const pct = (c: number, t: number) => (t > 0 ? Math.round((c / t) * 100) : 0);

  return {
    vacantes: { autorizado: vacAut, backup: vacBak },
    cubiertas: { autorizado: cubAut, backup: cubBak },
    abiertas: { autorizado: abiAut, backup: abiBak },
    cobertura: { autorizado: pct(cubAut, vacAut), backup: pct(cubBak, vacBak) },
  };
}

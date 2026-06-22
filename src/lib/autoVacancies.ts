import { canonicalizeKeyPart, canonicalizePuesto } from '@/lib/utils';
import { businessDaysBetween, localTodayIso } from '@/lib/dates';
import { DEFAULT_VACANCY_SLA_DAYS } from '@/lib/types';
import type { Baja, Employee, VacancyRequest, AuthorizedPosition } from '@/lib/types';

export type AutoVacancyStatus = 'cubierta' | 'abierta';
export type VacancyType = 'autorizado' | 'backup';

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
  /** Tipo de vacante: plantilla autorizada o buffer de backup. */
  vacancyType: VacancyType;
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
  employees: Employee[],
  positions: AuthorizedPosition[] = []
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

  const result: AutoVacancy[] = bajas.map((baja) => {
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
      // Se asigna abajo en una segunda pasada por puesto.
      vacancyType: 'autorizado' as VacancyType,
    };
  });

  // ── Clasificación autorizado vs backup ──────────────────────────────────
  // Consistente con `calculatePositionCoverage` (la tabla resumen): por puesto
  // la plantilla real ocupa primero los lugares AUTORIZADOS (A) y luego el
  // buffer de BACKUP (B). Las vacantes abiertas se reparten igual: las primeras
  // (A − real) son de plantilla autorizada y las siguientes (hasta B) son
  // backup. Un puesto SIN backup declarado (B = 0) nunca genera vacantes
  // backup — corrige el caso en que operadores de producción aparecían como
  // backup pese a no tener buffer.
  const realByKey = new Map<string, number>();
  {
    const today = localTodayIso();
    const seen = new Set<string>();
    for (const emp of employees) {
      const num = (emp.num_empleado ?? '').trim();
      if (num) {
        if (seen.has(num)) continue;
        seen.add(num);
      }
      if (String(emp.fecha_ingreso).localeCompare(today) > 0) continue;
      const k = positionKey(emp);
      realByKey.set(k, (realByKey.get(k) ?? 0) + 1);
    }
  }

  const posByKey = new Map<string, AuthorizedPosition>();
  for (const p of positions) posByKey.set(positionKey(p), p);

  const openByKey = new Map<string, AutoVacancy[]>();
  for (const v of result) {
    if (v.status !== 'abierta') continue;
    const k = positionKey(v.baja);
    const list = openByKey.get(k) ?? [];
    list.push(v);
    openByKey.set(k, list);
  }

  for (const [k, list] of openByKey) {
    const pos = posByKey.get(k);
    if (!pos) continue; // sin puesto autorizado → quedan como 'autorizado'
    const A = pos.plantilla_autorizada;
    const B = pos.backup ?? 0;
    const real = realByKey.get(k) ?? 0;
    const authVac = Math.max(0, A - real);
    const backupVac = B <= 0 ? 0 : Math.max(0, Math.min(B, A + B - real));
    // Orden estable: las más antiguas (gap de plantilla) primero.
    list.sort((a, b) => toTime(a.fechaBaja) - toTime(b.fechaBaja));
    list.forEach((v, i) => {
      v.vacancyType =
        i >= authVac && i < authVac + backupVac ? 'backup' : 'autorizado';
    });
  }

  return result;
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

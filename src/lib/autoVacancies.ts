import { canonicalizeKeyPart, canonicalizePuesto, calculatePositionCoverage } from '@/lib/utils';
import { businessDaysBetween } from '@/lib/dates';
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
  /**
   * Baja que originó la vacante. Es `null` para vacantes ESTRUCTURALES: huecos
   * de plantilla/backup que existen según la tabla resumen (KPI) pero que no
   * tienen una baja registrada que los explique. Se generan para que el conteo
   * de la lista cuadre exactamente con el KPI.
   */
  baja: Baja | null;
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
  const slaDays = DEFAULT_VACANCY_SLA_DAYS;

  // Objeto base por baja (estado natural según el emparejamiento por ingresos).
  const baseByBaja = new Map<Baja, AutoVacancy>();
  for (const baja of bajas) {
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

    const endArg: string | Date =
      status === 'cubierta' && fechaCubierta ? fechaCubierta : new Date(now);
    const dias = baja.fecha_baja
      ? Math.max(0, businessDaysBetween(baja.fecha_baja, endArg) - 1)
      : 0;

    baseByBaja.set(baja, {
      key: baja.id ?? baja.num_empleado,
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
      enTiempo: dias <= slaDays,
      vacancyType: 'autorizado',
    });
  }

  // Sin catálogo de puestos (p. ej. desde KpisPage): comportamiento legacy,
  // una vacante por baja con su estado natural.
  if (positions.length === 0) {
    return bajas.map((b) => baseByBaja.get(b)!);
  }

  // ── Reconciliación con la tabla resumen (KPI manda) ──────────────────────
  // Las vacantes ABIERTAS y su tipo se derivan de `calculatePositionCoverage`
  // (la misma fuente del KPI), por lo que el conteo de la lista cuadra EXACTO:
  //   · abiertas autorizado = Σ vacantes autorizado del KPI
  //   · abiertas backup     = Σ vacantes backup del KPI
  // Por puesto se abren `vacAut + vacBackup` filas: se llenan con las bajas más
  // recientes (no cubiertas a mano); las bajas que sobran pasan a "cubiertas"
  // (puesto ya cubierto) y, si faltan bajas para el hueco real, se generan
  // filas ESTRUCTURALES (baja = null).
  const coverage = calculatePositionCoverage(employees, [], positions);
  const covByKey = new Map<string, (typeof coverage)[number]>();
  for (const c of coverage) covByKey.set(positionKey(c), c);

  const result: AutoVacancy[] = [];
  const handled = new Set<Baja>();
  let synthSeq = 0;

  for (const [k, cov] of covByKey) {
    const A = cov.plantilla_autorizada;
    const real = cov.plantilla_real;
    const vacAut = Math.max(0, A - Math.min(real, A));
    const vacBackup = Math.max(0, cov.backup - cov.excedente_backup);
    const total = vacAut + vacBackup;

    const group = bajasByKey.get(k) ?? [];
    const manual = group.filter((b) => b.cubierta_manual);
    const pool = group
      .filter((b) => !b.cubierta_manual)
      .sort((a, b) => toTime(b.fecha_baja) - toTime(a.fecha_baja));

    // Las `total` bajas más recientes quedan ABIERTAS; el resto, absorbidas.
    const openBajas = pool.slice(0, total);
    const absorbed = pool.slice(total);

    const typeFor = (idx: number): VacancyType =>
      idx < vacAut ? 'autorizado' : 'backup';

    openBajas.forEach((b, i) => {
      const base = baseByBaja.get(b)!;
      const dias = b.fecha_baja
        ? Math.max(0, businessDaysBetween(b.fecha_baja, new Date(now)) - 1)
        : 0;
      result.push({
        ...base,
        status: 'abierta',
        coberturaTipo: null,
        coveredBy: null,
        fechaCubierta: null,
        dias,
        enTiempo: dias <= slaDays,
        vacancyType: typeFor(i),
      });
      handled.add(b);
    });

    // Filas estructurales: hueco real sin baja que lo respalde.
    const synthNeeded = total - openBajas.length;
    for (let i = 0; i < synthNeeded; i++) {
      const idx = openBajas.length + i;
      result.push({
        key: `synthetic-${k}-${synthSeq++}`,
        baja: null,
        area: cov.area,
        seccion: cov.seccion,
        puesto: cov.puesto,
        fechaBaja: '',
        status: 'abierta',
        coberturaTipo: null,
        coveredBy: null,
        fechaCubierta: null,
        reclutador: null,
        dias: 0,
        slaDays,
        enTiempo: true,
        vacancyType: typeFor(idx),
      });
    }

    // Bajas absorbidas (puesto ya cubierto) → cubiertas.
    absorbed.forEach((b) => {
      const base = baseByBaja.get(b)!;
      result.push({
        ...base,
        status: 'cubierta',
        coberturaTipo: base.coberturaTipo === 'manual' ? 'manual' : 'auto',
      });
      handled.add(b);
    });

    // Cubiertas a mano: se conservan tal cual.
    manual.forEach((b) => {
      result.push(baseByBaja.get(b)!);
      handled.add(b);
    });
  }

  // Bajas de puestos que no existen en el catálogo: estado natural.
  for (const b of bajas) {
    if (!handled.has(b)) result.push(baseByBaja.get(b)!);
  }

  return result;
}

/**
 * Filtra las vacantes ABIERTAS que ya están "reservadas" por un empleado con
 * fecha de ingreso futura (próximo ingreso). Un empleado futuro no cuenta como
 * plantilla real todavía, por lo que la vacante sigue contando en el KPI, pero
 * NO debe ofrecerse de nuevo en el selector de alta para evitar duplicar la
 * contratación de un puesto ya comprometido.
 *
 * Por puesto se descarta una vacante por cada próximo ingreso (campo
 * `proximos_ingresos` de la cobertura), hasta agotar los ingresos pendientes.
 */
export function filterUnreservedVacancies(
  openVacancies: AutoVacancy[],
  employees: Employee[],
  positions: AuthorizedPosition[] = []
): AutoVacancy[] {
  if (positions.length === 0) return openVacancies;

  const coverage = calculatePositionCoverage(employees, [], positions);
  const reservedByKey = new Map<string, number>();
  for (const c of coverage) {
    if (c.proximos_ingresos > 0) {
      reservedByKey.set(positionKey(c), c.proximos_ingresos);
    }
  }
  if (reservedByKey.size === 0) return openVacancies;

  const remaining = new Map(reservedByKey);
  return openVacancies.filter((v) => {
    const k = positionKey(v);
    const left = remaining.get(k) ?? 0;
    if (left > 0) {
      remaining.set(k, left - 1);
      return false; // reservada por un ingreso futuro → no ofrecer
    }
    return true;
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

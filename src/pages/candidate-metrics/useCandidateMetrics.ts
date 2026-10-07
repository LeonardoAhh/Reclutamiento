import { useMemo } from 'react';
import { useCandidates } from '@/hooks/useCandidates';
import { useTeamDirectory } from '@/features/team/TeamProvider';
import type { Candidate, CandidateStatus } from '@/lib/types';
import { getPautaWeekRange, shiftPautaWeek } from '@/lib/dates';
import { normalizeString } from '@/lib/utils';

const CITADO_STATUSES: ReadonlySet<CandidateStatus> = new Set<CandidateStatus>([
  'entrevista',
  'entrega_documentos',
  'faltan_documentos',
  'feedback_pendiente',
]);

export type RecruiterStats = {
  name: string;
  total: number;
  citados: number;
  contratados: number;
  rechazados: number;
  no_asistio: number;
};

export interface WeekStat {
  startWed: Date;
  endTue: Date;
  total: number;
  contratados: number;
  efectividadContratacion?: number;
}

export function useCandidateMetrics(metricRecruiterId: string) {
  const { candidates, loading, error, refetch } = useCandidates();
  const { members, resolve } = useTeamDirectory();
  const { pautaStats, individualStats } = useMemo(() => {
    const getWeeklyStats = (cands: Candidate[], targetTotal?: number, targetContratados?: number) => {
      const groups = new Map<number, {
        startWed: Date;
        endTue: Date;
        total: number;
        contratados: number;
        targetTotal?: number;
        targetContratados?: number;
        efectividadVolumen?: number;
        efectividadContratacion?: number;
      }>();

      for (const c of cands) {
        // Agrupar por **fecha de entrevista** (`fecha_cita`), no por
        // fecha de contacto. Una semana de pauta agrupa los candidatos
        // citados a entrevista entre miércoles y martes (TZ MX).
        if (!c.fecha_cita) continue;
        const range = getPautaWeekRange(c.fecha_cita);
        if (!range) continue;

        const { startWed, endTue, timeKey } = range;
        if (!groups.has(timeKey)) {
          groups.set(timeKey, { startWed, endTue, total: 0, contratados: 0, targetTotal, targetContratados });
        }

        const bucket = groups.get(timeKey);
        if (!bucket) continue;
        bucket.total += 1;
        if (c.status === 'contratado') bucket.contratados += 1;
      }

      // Asegurar que aparezcan semana anterior / actual / siguiente
      // aun sin candidatos. Todo el cálculo es TZ-agnóstico (MX, sin DST).
      const currentRange = getPautaWeekRange(new Date());
      if (currentRange) {
        const prevRange = shiftPautaWeek(currentRange, -1);
        const nextRange = shiftPautaWeek(currentRange, 1);

        [prevRange, currentRange, nextRange].forEach(({ startWed, endTue, timeKey }) => {
          if (!groups.has(timeKey)) {
            groups.set(timeKey, { startWed, endTue, total: 0, contratados: 0, targetTotal, targetContratados });
          }
        });
      }

      return Array.from(groups.values()).map(stat => {
        // Cálculo de efectividad oculto (solo lógico)
        const efectividadVolumen = stat.targetTotal ? Math.round((stat.total / stat.targetTotal) * 100) : undefined;
        const efectividadContratacion = stat.targetContratados ? Math.round((stat.contratados / stat.targetContratados) * 100) : undefined;
        return { ...stat, efectividadVolumen, efectividadContratacion };
      }).sort((a, b) => b.startWed.getTime() - a.startWed.getTime());
    };

    return {
      // Pauta tiene un objetivo de 30/14. Reclutadoras tienen 20/7 por semana.
      pautaStats: getWeeklyStats(candidates.filter(c => normalizeString(c.source ?? '') === 'PAUTA'), 30, 14),
      individualStats: getWeeklyStats(candidates.filter(c => normalizeString(c.source ?? '') === 'PAUTA' && resolve(c.reclutador)?.id === metricRecruiterId), 20, 7),
    };
  }, [candidates, resolve, metricRecruiterId]);

  /**
   * KPIs por integrante del catálogo, incluyendo cuentas dadas de baja.
   * Cuenta candidatos cuyo `reclutador`
   * normalizado (mayusculas + sin acentos) coincide con uno de los
   * nombres canónicos o variantes del catálogo. Otros nombres se
   * descartan tanto del numerador como del denominador.
   */
  const recruiterStats = useMemo<RecruiterStats[]>(() => {
    const empty = (name: string): RecruiterStats => ({
      name,
      total: 0,
      citados: 0,
      contratados: 0,
      rechazados: 0,
      no_asistio: 0,
    });
    const acc = new Map<string, RecruiterStats>();
    for (const member of members.filter(member => member.selectable)) acc.set(member.canonical_name, empty(member.canonical_name));
    for (const c of candidates) {
      const norm = resolve(c.reclutador)?.canonical_name ?? normalizeString(c.reclutador ?? '');
      const bucket = acc.get(norm);
      if (!bucket) continue;
      bucket.total += 1;
      if (c.status === 'contratado') bucket.contratados += 1;
      else if (c.status === 'rechazado') bucket.rechazados += 1;
      else if (c.status === 'no_asistio') bucket.no_asistio += 1;
      else if (CITADO_STATUSES.has(c.status)) bucket.citados += 1;
    }
    return Array.from(acc.values());
  }, [candidates, members, resolve]);

  const scheduledCount = candidates.filter(candidate => CITADO_STATUSES.has(candidate.status)).length;
  return { members, loading, error, refetch, pautaStats, individualStats, recruiterStats, scheduledCount, candidateCount: candidates.length };
}

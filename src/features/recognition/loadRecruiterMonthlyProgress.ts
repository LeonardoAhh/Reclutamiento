import { differenceInCalendarWeeks, parseISO, startOfISOWeek } from 'date-fns';
import { getRecruitmentGoals } from '@/hooks/useIndicadoresStats';
import { findTeamMember, type TeamMember } from '@/features/team/types';
import { supabase } from '@/lib/supabase';

function recruiterName(value: string | null, members: readonly TeamMember[]) {
  const raw = value?.replace(/\s+/g, ' ').trim();
  if (!raw || raw === 'Sin Reclutador') return null;
  const first = raw.split(' ')[0];
  const name = first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  return findTeamMember(members, value)?.short_name ?? name;
}

export interface RecruiterMonthlyProgressData {
  total: number;
  monthlyGoal: number;
  weeklyGoal: number | null;
  isTop: boolean;
  isTie: boolean;
  improvement: number;
  consistent: boolean;
}

export interface TeamMonthlyProgressData {
  monthlyGoal: number;
  recruiters: { id: string; name: string; total: number }[];
}

async function loadRecruitmentRecords(start: string, end: string, signal: AbortSignal) {
  const [employees, departures] = await Promise.all([
    supabase
      .from('empleados')
      .select('reclutador, fecha_ingreso')
      .gte('fecha_ingreso', start)
      .lte('fecha_ingreso', end)
      .abortSignal(signal),
    supabase
      .from('bajas')
      .select('reclutador, fecha_ingreso')
      .gte('fecha_ingreso', start)
      .lte('fecha_ingreso', end)
      .abortSignal(signal),
  ]);
  if (employees.error) throw employees.error;
  if (departures.error) throw departures.error;
  return [...(employees.data ?? []), ...(departures.data ?? [])];
}

export async function loadTeamMonthlyProgress(
  members: readonly TeamMember[],
  signal: AbortSignal,
): Promise<TeamMonthlyProgressData> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
  const { monthlyGoal } = getRecruitmentGoals(now);
  const activeMembers = members.filter((member) => member.active && !member.archived_at && member.include_in_metrics);
  if (activeMembers.length === 0) return { monthlyGoal, recruiters: [] };

  const totals = new Map(activeMembers.map((member) => [member.id, 0]));
  const records = await loadRecruitmentRecords(monthStart, monthEnd, signal);
  for (const record of records) {
    const member = findTeamMember(members, record.reclutador);
    if (member && totals.has(member.id)) totals.set(member.id, (totals.get(member.id) ?? 0) + 1);
  }

  const recruiters = activeMembers
    .map((member) => ({ id: member.id, name: member.short_name, total: totals.get(member.id) ?? 0 }))
    .sort((first, second) => first.name.localeCompare(second.name, 'es-MX'));
  return { monthlyGoal, recruiters };
}

export async function loadRecruiterMonthlyProgress(
  profileId: string,
  members: readonly TeamMember[],
  signal: AbortSignal,
): Promise<RecruiterMonthlyProgressData | null> {
  const currentMember = members.find((member) => member.profile_id === profileId && member.active);
  if (!currentMember) return null;

  const now = new Date();
  const monthStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
  const { monthlyGoal, weeklyGoal } = getRecruitmentGoals(now);
  const records = await loadRecruitmentRecords(previousMonthStart, monthEnd, signal);
  const currentRecords = records.filter(
    (record) => record.fecha_ingreso && parseISO(record.fecha_ingreso) >= monthStartDate,
  );
  const previousRecords = records.filter(
    (record) => record.fecha_ingreso && parseISO(record.fecha_ingreso) < monthStartDate,
  );
  const total = currentRecords.filter(
    (record) => recruiterName(record.reclutador, members) === currentMember.short_name,
  ).length;
  const totals = new Map<string, number>();
  for (const record of currentRecords) {
    const name = recruiterName(record.reclutador, members);
    if (name) totals.set(name, (totals.get(name) ?? 0) + 1);
  }
  const topTotal = Math.max(0, ...totals.values());
  const isTop = total > 0 && total === topTotal;
  const isTie = isTop && [...totals.values()].filter((value) => value === topTotal).length > 1;
  const previousTotal = previousRecords.filter(
    (record) => recruiterName(record.reclutador, members) === currentMember.short_name,
  ).length;
  const weeklyTotals = new Map<number, number>();
  for (const record of currentRecords) {
    if (recruiterName(record.reclutador, members) !== currentMember.short_name || !record.fecha_ingreso) continue;
    const week = startOfISOWeek(parseISO(record.fecha_ingreso)).getTime();
    weeklyTotals.set(week, (weeklyTotals.get(week) ?? 0) + 1);
  }
  const qualifyingWeeks = [...weeklyTotals]
    .filter(([, value]) => weeklyGoal !== null && value >= weeklyGoal)
    .map(([week]) => week)
    .sort((first, second) => first - second);
  const consistent = qualifyingWeeks.some(
    (week, index) =>
      index > 0 && differenceInCalendarWeeks(week, qualifyingWeeks[index - 1], { weekStartsOn: 1 }) === 1,
  );

  return { total, monthlyGoal, weeklyGoal, isTop, isTie, improvement: total - previousTotal, consistent };
}

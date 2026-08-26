import { supabase } from '@/lib/supabase';
import { formatSupabaseError } from '@/lib/errors';
import type {
  EditableCriterion,
  EligibleProfileEmployee,
  ProfileCycle,
  ProfileEvaluation,
  ProfileTemplate,
} from './types';

function profileGeneralError(error: unknown): string {
  if (error && typeof error === 'object') {
    const value = error as { code?: string; message?: string };
    if (value.code === '42P01' || value.code === 'PGRST205') {
      return 'Perfil General todavía no está habilitado en la base de datos. Aplica la migración 029.';
    }
    if (value.code === '42501') return value.message || 'No tienes permiso para realizar esta acción.';
    if (value.message?.trim()) return value.message.trim();
  }
  return formatSupabaseError(error);
}

export interface ProfileGeneralData {
  cycles: ProfileCycle[];
  templates: ProfileTemplate[];
  evaluations: ProfileEvaluation[];
}

export async function fetchProfileGeneralData(): Promise<ProfileGeneralData> {
  const [cycleResult, templateResult, evaluationResult] = await Promise.all([
    supabase
      .from('profile_general_cycles')
      .select('id, name, starts_on, ends_on')
      .order('starts_on', { ascending: false }),
    supabase
      .from('profile_general_templates')
      .select('id, area, seccion, puesto, version, status, source, created_at, activated_at, criteria:profile_general_criteria(*)')
      .order('created_at', { ascending: false }),
    supabase
      .from('profile_general_evaluations')
      .select('*, items:profile_general_evaluation_items(*)')
      .order('updated_at', { ascending: false }),
  ]);

  const error = cycleResult.error ?? templateResult.error ?? evaluationResult.error;
  if (error) throw new Error(profileGeneralError(error));

  const templates = (templateResult.data ?? []).map((template) => ({
    ...template,
    criteria: [...(template.criteria ?? [])].sort(
      (left, right) => left.display_order - right.display_order,
    ),
  })) as ProfileTemplate[];

  return {
    cycles: (cycleResult.data ?? []) as ProfileCycle[],
    templates,
    evaluations: (evaluationResult.data ?? []) as ProfileEvaluation[],
  };
}

export async function saveProfileTemplate(input: {
  area: string;
  section: string;
  position: string;
  source: 'manual' | 'import';
  criteria: EditableCriterion[];
}): Promise<void> {
  const { error } = await supabase.rpc('save_profile_general_template', {
    p_area: input.area,
    p_seccion: input.section,
    p_puesto: input.position,
    p_source: input.source,
    p_criteria: input.criteria.map((criterion) => ({
      category: criterion.category,
      description: criterion.description,
      weight_bps: criterion.isScorable ? criterion.weightBps : 0,
      is_scorable: criterion.isScorable,
    })),
    p_activate: true,
  });
  if (error) throw new Error(profileGeneralError(error));
}

export async function saveProfileEvaluation(input: {
  cycleId: string;
  templateId: string;
  employee: EligibleProfileEmployee;
  responses: Record<string, boolean | undefined>;
  comments: string;
  submit: boolean;
}): Promise<void> {
  const { error } = await supabase.rpc('save_profile_general_evaluation', {
    p_cycle_id: input.cycleId,
    p_template_id: input.templateId,
    p_employee: {
      num: input.employee.num,
      name: input.employee.name,
      area: input.employee.area,
      section: input.employee.section,
      position: input.employee.position,
      entry_date: input.employee.entryDate,
      recruiter: input.employee.recruiter,
      source: input.employee.source,
      exit_date: input.employee.exitDate,
      exit_reason: input.employee.exitReason,
    },
    p_responses: Object.entries(input.responses)
      .filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean')
      .map(([criterionId, complies]) => ({ criterion_id: criterionId, complies })),
    p_comments: input.comments,
    p_submit: input.submit,
  });
  if (error) throw new Error(profileGeneralError(error));
}

export async function reopenProfileEvaluation(evaluationId: string): Promise<void> {
  const { error } = await supabase.rpc('reopen_profile_general_evaluation', {
    p_evaluation_id: evaluationId,
  });
  if (error) throw new Error(profileGeneralError(error));
}

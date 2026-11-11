import type { Dispatch, SetStateAction } from 'react';
import type { Language } from '@/contexts/LanguageContext';
import type { useCandidates } from '@/hooks/useCandidates';
import type { useSupabaseData } from '@/hooks/useSupabaseData';
import type { useVacancyRequests } from '@/hooks/useVacancyRequests';
import { TOAST_CONFIG } from '@/lib/constants';
import { buildCandidateReport } from '@/lib/candidateReport';
import { toast } from '@/lib/notify';
import { playSound } from '@/lib/sound';
import { copyTextToClipboard } from '@/lib/whatsappReport';
import type { Candidate, Employee } from '@/lib/types';
import type { TeamMember } from '@/features/team/types';

type CandidateMutationActions = Pick<ReturnType<typeof useCandidates>, 'markCandidateHired'> &
  Pick<ReturnType<typeof useSupabaseData>, 'addSingleEmployee'> &
  Pick<ReturnType<typeof useVacancyRequests>, 'coverVacancyForEmployee'>;

interface UseCandidatePipelineActionsOptions extends CandidateMutationActions {
  candidates: Candidate[];
  isAdmin: boolean;
  language: Language;
  members: TeamMember[];
  reportCopiedTimer: { current: number | null };
  setReportCopied: Dispatch<SetStateAction<boolean>>;
}

export function useCandidatePipelineActions({
  addSingleEmployee,
  candidates,
  coverVacancyForEmployee,
  isAdmin,
  language,
  markCandidateHired,
  members,
  reportCopiedTimer,
  setReportCopied,
}: UseCandidatePipelineActionsOptions) {
  const en = language === 'en';

  async function handleHire(input: {
    mode: 'create' | 'associate';
    employee: Employee;
    candidateId: string;
  }): Promise<{ ok: boolean; message?: string }> {
    if (input.mode === 'create') {
      const employeeResult = await addSingleEmployee(input.employee);
      if (!employeeResult.ok) {
        playSound('error');
        toast.error({ title: en ? 'Could not hire candidate' : 'No se pudo contratar' });
        return employeeResult;
      }
    }

    const candidateResult = await markCandidateHired(
      input.candidateId,
      input.employee.num_empleado,
      input.employee.fecha_ingreso,
    );

    if (!candidateResult.ok) {
      playSound('warning');
      const message =
        candidateResult.message ??
        (input.mode === 'create'
          ? en
            ? 'Employee created, but the candidate could not be updated.'
            : 'Empleado creado, pero no se pudo actualizar el candidato.'
          : en
            ? 'Could not link candidate.'
            : 'No se pudo vincular al candidato.');
      toast.warning({
        title:
          input.mode === 'create'
            ? en
              ? 'Hiring incomplete'
              : 'Contratación incompleta'
            : en
              ? 'Linking failed'
              : 'Vinculación fallida',
      });
      return { ok: false, message };
    }

    await coverVacancyForEmployee(input.employee, {
      source: `candidato:${input.candidateId}`,
    });

    toast.success({
      title:
        input.mode === 'create'
          ? en
            ? 'Candidate hired'
            : 'Candidato contratado'
          : en
            ? 'Candidate linked'
            : 'Candidato vinculado',
    });
    playSound('success');
    return { ok: true };
  }

  async function handleCopyReport() {
    if (!isAdmin) return;
    if (reportCopiedTimer.current !== null) window.clearTimeout(reportCopiedTimer.current);
    setReportCopied(false);
    const report = buildCandidateReport(candidates, members, language);
    if (!report) {
      playSound('warning');
      toast.info({ title: en ? 'No active candidates in process' : 'No hay candidatos activos en proceso' });
      return;
    }

    try {
      await copyTextToClipboard(report);
      playSound('success');
      setReportCopied(true);
      reportCopiedTimer.current = window.setTimeout(() => setReportCopied(false), TOAST_CONFIG.defaultDurationMs);
      toast.success({
        title: en ? 'Summary copied' : 'Resumen copiado',
      });
    } catch {
      playSound('error');
      toast.error({ title: en ? 'Could not copy summary' : 'No se pudo copiar el resumen' });
    }
  }

  return { handleCopyReport, handleHire };
}

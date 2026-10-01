import type { SupabaseClient } from '@supabase/supabase-js';

export function hasCompletedCareerJourney(metadata: unknown): boolean {
  return metadata !== null && typeof metadata === 'object'
    && 'career_journey_completed' in metadata
    && metadata.career_journey_completed === true;
}

type CompletionResult = { ok: true } | { ok: false; message: string };

export async function completeCareerJourney(
  auth: Pick<SupabaseClient['auth'], 'updateUser'>,
  userId: string,
): Promise<CompletionResult> {
  const failure: CompletionResult = {
    ok: false,
    message: 'No se pudo guardar el recorrido. Comprueba tu conexión y pulsa «¡Vamos!» para reintentar.',
  };
  try {
    const { data, error } = await auth.updateUser({ data: { career_journey_completed: true } });
    if (error) {
      if (error.status === 401 || error.status === 403 || error.name === 'AuthSessionMissingError') {
        return { ok: false, message: 'Tu sesión no está disponible. Vuelve a iniciar sesión para continuar.' };
      }
      return failure;
    }
    return data.user?.id === userId && hasCompletedCareerJourney(data.user.user_metadata)
      ? { ok: true } : failure;
  } catch {
    return failure;
  }
}

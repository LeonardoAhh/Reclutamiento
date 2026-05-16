import { supabase } from './supabase';
import type { Profile } from '@/hooks/useAuth';

/**
 * Lista de roles válidos en la app. Debe coincidir con el check constraint
 * en `profiles.role` (migración 005) y con la validación de la edge function
 * `create-user`.
 */
export const APP_ROLES = [
  'admin',
  'reclutador',
  'gerente',
  'auditor',
] as const;

export type AppRole = (typeof APP_ROLES)[number];

/** Etiquetas amigables para mostrar en UI; los valores almacenados son los técnicos. */
export const ROLE_LABEL: Record<AppRole, string> = {
  admin: 'Administrador',
  reclutador: 'Reclutador',
  gerente: 'Gerente',
  auditor: 'Auditor',
};

export interface CreateUserInput {
  username: string;
  password: string;
  display_name: string;
  role: AppRole;
}

export interface CreateUserResult {
  ok: boolean;
  message?: string;
  user?: { id: string; username: string; role: AppRole };
}

/**
 * Invoca la edge function `create-user`. La función corre con `service_role`
 * y verifica que el caller sea admin antes de crear nada. Ver
 * `supabase/functions/create-user/index.ts` para detalles.
 */
export async function createUser(
  input: CreateUserInput
): Promise<CreateUserResult> {
  const { data, error } = await supabase.functions.invoke('create-user', {
    body: input,
  });

  if (error) {
    // `FunctionsHttpError` trae `context.response` con el body de error real
    // que devolvió la función. Intentamos parsearlo para mostrar el mensaje
    // específico en lugar de "non-2xx status code".
    const ctx = (error as { context?: { response?: Response } }).context;
    if (ctx?.response) {
      try {
        const parsed = await ctx.response.clone().json();
        if (parsed && typeof parsed.message === 'string') {
          return { ok: false, message: parsed.message };
        }
      } catch {
        /* fallthrough */
      }
    }
    return { ok: false, message: error.message };
  }

  if (!data || typeof data !== 'object') {
    return { ok: false, message: 'Respuesta vacía de la función.' };
  }
  return data as CreateUserResult;
}

/**
 * Lista todos los profiles. Cualquiera autenticado puede leer (policy
 * `profiles_select_authenticated` de migración 005).
 */
export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, role, created_at, last_login_at')
    .order('username', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as Profile[];
}

/**
 * Actualiza el rol de un profile. Requiere que el caller sea admin
 * (policy `profiles_update_admin` de migración 012). Si el caller no es
 * admin, Postgres devuelve 0 rows y la función reporta el bloqueo.
 */
export async function updateProfileRole(
  id: string,
  role: AppRole
): Promise<{ ok: boolean; message?: string }> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', id)
    .select('id');

  if (error) {
    return { ok: false, message: error.message };
  }
  if (!data || data.length === 0) {
    return {
      ok: false,
      message:
        'No se actualizó ningún registro. Verifica que tu cuenta tenga rol admin.',
    };
  }
  return { ok: true };
}

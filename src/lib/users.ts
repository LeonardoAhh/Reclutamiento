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
  // Forzamos refresh / lectura de la session activa. Si el JWT ya expiró,
  // `getSession` lo renueva con el refresh token; si la sesión murió de plano
  // devuelve null y abortamos con mensaje claro (en lugar de mandar un POST
  // con JWT inválido que el gateway de Supabase rechaza con 401 críptico).
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    return {
      ok: false,
      message:
        'Tu sesión expiró. Cierra sesión y vuelve a iniciar para continuar.',
    };
  }

  const { data, error } = await supabase.functions.invoke('create-user', {
    body: input,
    // Pasamos el JWT explícito por si el cliente interno del SDK trae uno
    // stale en memoria distinto al de localStorage.
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (error) {
    // `FunctionsHttpError` trae el Response directamente en `error.context`
    // (NO en `error.context.response`). Lo parseamos para mostrar el mensaje
    // real que devolvió la edge function en lugar del genérico
    // "Edge Function returned a non-2xx status code" del SDK.
    const ctx = (error as { context?: unknown }).context;
    if (ctx && typeof ctx === 'object' && 'json' in ctx) {
      const resp = ctx as Response;
      // Caso especial: 401 del gateway de Supabase (NO de nuestro código).
      // Pasa cuando el JWT ya no es válido para el proyecto. Traducimos a
      // un mensaje accionable.
      if (resp.status === 401) {
        return {
          ok: false,
          message:
            'Sesión rechazada por Supabase (401). Cierra sesión y vuelve a iniciar.',
        };
      }
      try {
        const parsed = (await resp.clone().json()) as {
          message?: string;
        } | null;
        if (parsed && typeof parsed.message === 'string') {
          return { ok: false, message: parsed.message };
        }
      } catch {
        // El body no era JSON; intentamos como texto plano.
        try {
          const text = await resp.clone().text();
          if (text) return { ok: false, message: text };
        } catch {
          /* fallthrough */
        }
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

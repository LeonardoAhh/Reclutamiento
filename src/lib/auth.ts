import { supabase } from './supabase';

/**
 * Dominio sintético para mapear usuarios a emails que Supabase Auth pueda
 * procesar. Nunca se le muestra al usuario.
 */
export const AUTH_EMAIL_DOMAIN = 'reclutamiento.local';

/**
 * Convierte lo que el usuario escribió en el campo "Usuario" al email que
 * Supabase Auth espera para `signInWithPassword`.
 *
 * - Si lo escrito contiene `@`, se trata como email real y se usa tal cual
 *   (solo trim + lowercase). Permite que cuentas creadas en el Dashboard
 *   con su email real puedan loguearse.
 * - Si NO contiene `@`, se considera username corto y se le añade el
 *   dominio sintético `@reclutamiento.local`.
 *
 * Esto hace que el form acepte tanto `leonardo` como `leonardo@empresa.com`
 * sin que el usuario se preocupe por el dominio sintético.
 */
export function usernameToEmail(input: string): string {
  const v = input.trim().toLowerCase();
  if (v.includes('@')) return v;
  return `${v}@${AUTH_EMAIL_DOMAIN}`;
}

/**
 * Extrae el username del email sintético almacenado en `auth.users`.
 * Si el email no es del dominio interno, retorna el email completo.
 */
export function emailToUsername(email: string | null | undefined): string {
  if (!email) return '';
  const [user, domain] = email.split('@');
  if (domain === AUTH_EMAIL_DOMAIN) return user;
  return email;
}

export interface SignInResult {
  ok: boolean;
  message?: string;
}

/**
 * Inicia sesión con usuario + password. Internamente arma el email sintético
 * y se lo pasa a Supabase Auth.
 */
export async function signInWithUsername(
  username: string,
  password: string
): Promise<SignInResult> {
  const email = usernameToEmail(username);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Mapea los errores comunes de Supabase a mensajes en español más claros.
    const msg = error.message.toLowerCase();
    if (msg.includes('invalid login credentials') || msg.includes('invalid')) {
      return { ok: false, message: 'Usuario o contraseña incorrectos.' };
    }
    if (msg.includes('email not confirmed')) {
      return {
        ok: false,
        message:
          'Cuenta sin confirmar. Pide al admin que la marque como confirmada en Supabase.',
      };
    }
    return { ok: false, message: error.message };
  }

  // Las cuentas pendientes todavía no pueden escribir en profiles.
  if (data?.session?.user) {
    const { data: passwordRequired, error: passwordStatusError } = await supabase.rpc('password_change_required');
    if (!passwordStatusError && passwordRequired === false) {
      await supabase
        .from('profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.session.user.id);
    }
  }

  return { ok: true };
}

/** Cierra la sesión activa. */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; field: 'current' | 'new' | 'form'; message: string };

/** Cambia únicamente la contraseña de la cuenta de la sesión activa. */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<ChangePasswordResult> {
  try {
    const { data, error, response } = await supabase.functions.invoke<unknown>('change-password', {
      body: { currentPassword, newPassword },
    });
    if (error) {
      let message = 'El servicio de cambio de contraseña no está disponible. Intenta más tarde.';
      if (response?.status === 401 || response?.status === 403) {
        message = 'El servicio rechazó la sesión. Vuelve a iniciar sesión; si persiste, contacta al administrador.';
      } else if (response?.status === 404) {
        message = 'El servicio de cambio de contraseña no está publicado. Contacta al administrador.';
      } else if (response?.status === 429) {
        message = 'Se hicieron demasiados intentos. Espera unos minutos antes de volver a intentar.';
      } else if (!response) {
        message = 'No se pudo conectar con el servicio. Revisa tu conexión e intenta de nuevo.';
      }
      return { ok: false, field: 'form', message };
    }
    if (!error && typeof data === 'object' && data !== null && 'ok' in data) {
      if (data.ok === true) return { ok: true };
      if (data.ok === false && 'field' in data && 'message' in data &&
          (data.field === 'current' || data.field === 'new' || data.field === 'form') &&
          typeof data.message === 'string') {
        return { ok: false, field: data.field, message: data.message };
      }
    }
    return { ok: false, field: 'form', message: 'No se pudo cambiar la contraseña. Intenta de nuevo.' };
  } catch {
    return {
      ok: false,
      field: 'form',
      message: 'No se pudo conectar para cambiar la contraseña. Revisa tu conexión e intenta de nuevo.',
    };
  }
}

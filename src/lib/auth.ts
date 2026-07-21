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

  // Si el login fue exitoso, actualizamos last_login_at
  if (data?.session?.user) {
    await supabase
      .from('profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', data.session.user.id);
  }

  return { ok: true };
}

/** Cierra la sesión activa. */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Evento global que se dispara cuando alguna respuesta de Supabase indica
 * claramente que el JWT expiró o dejó de ser válido (401/403 con cuerpo
 * `JWT expired`, `PGRST301`, etc.).
 *
 * `useAuth` lo escucha y fuerza `signOut` local → AuthGuard redirige a /login.
 * Así los guardados/mutaciones ya no fallan en silencio con "sesión zombie".
 */
export const AUTH_JWT_EXPIRED_EVENT = 'auth:jwt-expired';

/**
 * `fetch` que envuelve al del navegador y, sin alterar la respuesta, la
 * inspecciona para detectar sesión expirada. La inspección se hace sobre un
 * `clone()` para no consumir el body original.
 *
 * Se filtra el caso `invalid_grant` para NO disparar el evento cuando el
 * login falla por credenciales incorrectas (mismo status 400/401, distinto
 * significado).
 */
async function authAwareFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status !== 401 && res.status !== 403) return res;

  try {
    const clone = res.clone();
    const text = await clone.text();
    const lower = text.toLowerCase();

    // Login con credenciales incorrectas: NO es sesión expirada.
    if (lower.includes('invalid_grant') || lower.includes('invalid login credentials')) {
      return res;
    }

    const isExpired =
      lower.includes('jwt expired') ||
      lower.includes('token is expired') ||
      lower.includes('token has expired') ||
      lower.includes('"code":"pgrst301"') || // PostgREST: JWT expired (viejo)
      lower.includes('"code":"pgrst302"') || // PostgREST: JWT invalid
      lower.includes('"code":"pgrst303"') || // PostgREST v12+: JWT expired
      lower.includes('invalid_token') ||
      lower.includes('token_expired') ||
      // Red final: cualquier 401/403 de Supabase con "expired" en el body.
      lower.includes('expired');

    if (isExpired && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(AUTH_JWT_EXPIRED_EVENT));
    }
  } catch {
    // Si no se puede leer el body no bloqueamos la respuesta original.
  }

  return res;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: authAwareFetch,
  },
});

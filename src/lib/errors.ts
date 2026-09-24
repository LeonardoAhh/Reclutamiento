/**
 * Serializa un error producido por una llamada a Supabase (o cualquier otro
 * origen) en una cadena legible. PostgrestError no es una instancia de
 * `Error`: es un objeto plano con `{ message, code, details, hint }`. Si lo
 * pasamos por `String(err)` obtenemos el famoso `"[object Object]"` y se
 * pierde la causa real (RLS violada, FK constraint, sesión expirada, etc).
 *
 * Esta función intenta, en orden:
 *   1. `Error.message` cuando es una instancia de Error nativa.
 *   2. El shape PostgrestError: `message [code] details — hint`.
 *   3. JSON.stringify como fallback.
 *   4. `String(err)` como último recurso.
 */
export function formatSupabaseError(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  if (err && typeof err === 'object') {
    const e = err as {
      message?: unknown;
      code?: unknown;
      details?: unknown;
      hint?: unknown;
    };
    const parts: string[] = [];
    if (typeof e.message === 'string' && e.message.trim()) {
      parts.push(e.message.trim());
    }
    if (typeof e.code === 'string' && e.code.trim()) {
      parts.push(`[${e.code.trim()}]`);
    }
    if (typeof e.details === 'string' && e.details.trim()) {
      parts.push(e.details.trim());
    }
    if (typeof e.hint === 'string' && e.hint.trim()) {
      parts.push(`— ${e.hint.trim()}`);
    }
    if (parts.length) return parts.join(' ');
    try {
      const json = JSON.stringify(err);
      if (json && json !== '{}') return json;
    } catch {
      // ignore — cae al String(err)
    }
  }
  return String(err);
}

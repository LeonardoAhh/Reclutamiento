export async function requirePasswordChangeComplete(
  request: Request,
  url: string | undefined,
  anonKey: string | undefined,
  corsHeaders: Record<string, string>,
): Promise<Response | null> {
  const reject = (message: string, status: number) => new Response(
    JSON.stringify({ ok: false, message, error: message, ...(status === 403 ? { code: 'PASSWORD_CHANGE_REQUIRED' } : {}) }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
  if (!url || !anonKey) return reject('No se pudo verificar el acceso.', 503);
  const authorization = request.headers.get('Authorization') ?? '';
  if (!/^Bearer\s+\S+$/i.test(authorization)) return reject('Sesión inválida o expirada.', 401);
  try {
    const response = await fetch(`${url}/rest/v1/rpc/password_change_required`, {
      method: 'POST',
      headers: { apikey: anonKey, Authorization: authorization, 'Content-Type': 'application/json' },
      body: '{}',
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return reject('No se pudo verificar el acceso.', response.status === 401 ? 401 : 503);
    const required: unknown = await response.json();
    if (required === true) return reject('Cambia tu contraseña antes de continuar.', 403);
    if (required !== false) return reject('No se pudo verificar el acceso.', 503);
    return null;
  } catch {
    return reject('No se pudo verificar el acceso.', 503);
  }
}

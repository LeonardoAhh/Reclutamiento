type EdgeRuntime = {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Promise<Response>): void;
};
const runtime = (globalThis as typeof globalThis & { Deno: EdgeRuntime }).Deno;
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});
const failure = (message: string, field = 'form') => json({ ok: false, field, message });
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

runtime.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ ok: false }, 405);
  const url = runtime.env.get('SUPABASE_URL');
  const anonKey = runtime.env.get('SUPABASE_ANON_KEY');
  const serviceKey = runtime.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anonKey || !serviceKey) return failure('El cambio de contraseña no está disponible. Intenta más tarde.');
  const authorization = request.headers.get('Authorization') ?? '';
  if (!/^Bearer\s+\S+$/i.test(authorization)) return failure('Vuelve a iniciar sesión para cambiar tu contraseña.');

  let body: unknown;
  try { body = await request.json(); } catch { return failure('Revisa los datos e intenta de nuevo.'); }
  if (!isRecord(body)) return failure('Revisa los datos e intenta de nuevo.');
  const { currentPassword, newPassword } = body;
  if (typeof currentPassword !== 'string' || !currentPassword) return failure('Ingresa tu contraseña actual.', 'current');
  if (typeof newPassword !== 'string' || newPassword.length < 8) return failure('Usa al menos 8 caracteres.', 'new');
  if (newPassword === currentPassword) return failure('Elige una contraseña distinta de la actual.', 'new');

  const headers = { apikey: anonKey, Authorization: authorization, 'Content-Type': 'application/json' };
  let passwordChanged = false;
  try {
    const identityResponse = await fetch(`${url}/auth/v1/user`, { headers, signal: AbortSignal.timeout(10_000) });
    const identity: unknown = await identityResponse.json();
    if (!identityResponse.ok || !isRecord(identity) || typeof identity.id !== 'string') {
      return failure('Vuelve a iniciar sesión para cambiar tu contraseña.');
    }
    // El identificador procede de Auth, nunca del payload enviado por el cliente.
    const changeStartedAt = new Date().toISOString();
    const updated = await fetch(`${url}/auth/v1/user`, {
      method: 'PUT', headers,
      body: JSON.stringify({ current_password: currentPassword, password: newPassword }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!updated.ok) {
      const error: unknown = await updated.json();
      const code = isRecord(error)
        ? typeof error.code === 'string' ? error.code
          : typeof error.error_code === 'string' ? error.error_code : undefined
        : undefined;
      if (code === 'invalid_credentials' || code === 'current_password_mismatch' || code === 'current_password_required') {
        return failure('La contraseña actual no coincide. Revísala e inténtalo de nuevo.', 'current');
      }
      if (code === 'same_password') return failure('Elige una contraseña distinta de la actual.', 'new');
      if (code === 'weak_password') return failure('Elige una contraseña que cumpla los requisitos de seguridad.', 'new');
      if (code === 'reauthentication_needed') return failure('Cierra sesión, vuelve a entrar e inténtalo de nuevo.');
      return failure('No se pudo cambiar la contraseña. Intenta de nuevo.');
    }
    passwordChanged = true;
    const completed = await fetch(`${url}/rest/v1/rpc/complete_required_password_change`, {
      method: 'POST',
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_user_id: identity.id, p_change_started_at: changeStartedAt }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!completed.ok || await completed.json() !== true) throw new Error('Completion unavailable');
    return json({ ok: true });
  } catch {
    return failure(passwordChanged
      ? 'Tu contraseña cambió, pero no se confirmó el acceso. Intenta cambiarla de nuevo usando la nueva como contraseña actual.'
      : 'No se pudo confirmar el cambio. Revisa tu conexión e intenta de nuevo.');
  }
});

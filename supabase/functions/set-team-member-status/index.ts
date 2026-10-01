import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { requirePasswordChangeComplete } from '../_shared/password-change-access.ts';

const cors = { 'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, 'Content-Type': 'application/json' },
});

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return reply({ ok: false, message: 'Método no permitido.' }, 405);
  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anon || !service) return reply({ ok: false, message: 'Servicio no configurado.' }, 503);
  const authorization = request.headers.get('Authorization') ?? '';
  if (!/^Bearer\s+\S+$/i.test(authorization)) return reply({ ok: false, message: 'Falta el token de sesión.' }, 401);
  const accessToken = authorization.replace(/^Bearer\s+/i, '').trim();
  const caller = createClient(url, anon, { global: { headers: { Authorization: authorization } } });
  const { data: { user }, error: userError } = await caller.auth.getUser(accessToken);
  if (userError || !user) return reply({ ok: false, message: 'Sesión inválida.' }, 401);
  const denied = await requirePasswordChangeComplete(request, url, anon, cors);
  if (denied) return denied;
  const admin = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(15_000) }) },
  });
  const { data: actor, error: actorError } = await admin.from('profiles').select('role').eq('id', user.id).single();
  const { data: actorMember, error: actorMemberError } = await admin.from('recruiter_directory').select('active').eq('profile_id', user.id).maybeSingle();
  if (actorError || actorMemberError || actor?.role !== 'admin' || actorMember?.active === false) {
    return reply({ ok: false, message: 'Solo administradores pueden cambiar el estado.' }, 403);
  }
  let body: unknown;
  try { body = await request.json(); } catch { return reply({ ok: false, message: 'Solicitud inválida.' }, 400); }
  if (!body || typeof body !== 'object' || !('id' in body) || typeof body.id !== 'string'
    || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(body.id)
    || !('active' in body) || typeof body.active !== 'boolean') return reply({ ok: false, message: 'Solicitud inválida.' }, 400);
  const { data: member, error } = await admin.from('recruiter_directory').select('profile_id, archived_at').eq('id', body.id).single();
  if (error || !member) return reply({ ok: false, message: 'Integrante no disponible.' }, 404);
  if (member.archived_at) return reply({ ok: false, message: 'El integrante ya fue eliminado de Equipo.' }, 409);
  if (member.profile_id === user.id) return reply({ ok: false, message: 'No puedes dar de baja tu propia cuenta.' }, 400);
  if (member.profile_id) {
    const { data: profile, error: profileError } = await admin.from('profiles').select('role').eq('id', member.profile_id).single();
    if (profileError || profile?.role !== 'reclutador') return reply({ ok: false, message: 'La baja está limitada a cuentas de reclutadores.' }, 400);
  }
  // Desactivar primero bloquea también JWT antiguos. Reactivar se confirma al final.
  const { data: operation, error: operationError } = await admin.rpc('acquire_recruiter_status_operation', { p_id: body.id, p_actor: user.id });
  if (operationError || typeof operation !== 'string') return reply({ ok: false, message: 'No se pudo iniciar el cambio. Puede haber otra operación en curso; vuelve a intentar.' }, 409);
  try {
  const { data: current, error: currentError } = await admin.from('recruiter_directory').select('profile_id').eq('id', body.id).single();
  if (currentError || !current || current.profile_id !== member.profile_id) return reply({ ok: false, message: 'La cuenta vinculada cambió. Vuelve a intentar con el estado actualizado.' }, 409);
  if (!body.active) {
    const { error: statusError } = await admin.rpc('set_recruiter_member_status', { p_id: body.id, p_active: false, p_actor: user.id, p_operation: operation });
    if (statusError) return reply({ ok: false, message: 'No se pudo dar de baja al integrante.' }, 409);
  }
  if (member.profile_id) {
    const { error: authError } = await admin.auth.admin.updateUserById(member.profile_id, { ban_duration: body.active ? 'none' : '876000h' });
    if (authError) return reply({ ok: false, message: body.active
      ? 'No se pudo reactivar el acceso. Vuelve a intentar.'
      : 'El acceso al sistema ya está bloqueado, pero falta confirmar el bloqueo de inicio de sesión. Vuelve a intentar para completar la baja.' }, 503);
  }
  if (body.active) {
    const { error: statusError } = await admin.rpc('set_recruiter_member_status', { p_id: body.id, p_active: true, p_actor: user.id, p_operation: operation });
    if (statusError) return reply({ ok: false, message: 'El integrante sigue inactivo. Vuelve a intentar para completar la reactivación.' }, 503);
  }
  return reply({ ok: true });
  } catch {
    return reply({ ok: false, message: 'No se pudo confirmar el estado final. Vuelve a intentar para completar la operación.' }, 503);
  } finally {
    try {
      const released = await admin.rpc('release_recruiter_status_operation', { p_id: body.id, p_operation: operation });
      if (released.error) console.warn('No se pudo liberar la operación de equipo; vencerá automáticamente.');
    } catch { console.warn('No se pudo liberar la operación de equipo; vencerá automáticamente.'); }
  }
});

// =============================================================================
// supabase/functions/create-user/index.ts
//
// Edge function que permite a un admin de la app crear nuevos usuarios sin
// salir a la consola de Supabase. Flujo:
//
//   1) Cliente envía POST con `{ username, password, display_name?, role? }`
//      y su access token (Supabase Auth JWT) en el header `Authorization`.
//   2) La función:
//        - Verifica el JWT contra Supabase Auth.
//        - Carga el profile del caller y exige que `role = 'admin'`.
//        - Valida payload (username/password mínimos, role en whitelist).
//        - Crea el user con `auth.admin.createUser({ email_confirm: true })`
//          usando email sintético `${username}@reclutamiento.local`.
//        - El trigger `on_auth_user_created` (migración 005) auto-crea el
//          row en `profiles` con role=reclutador.
//        - Aplica un UPDATE final para fijar `display_name` y `role`.
//   3) Devuelve `{ ok: true, user: { id, username, role } }` o `{ ok: false, message }`.
//
// CONFIGURACIÓN (manual, una sola vez):
//
//   # 1. Login a Supabase CLI
//   supabase login
//
//   # 2. Link al proyecto (desde la raíz del repo)
//   supabase link --project-ref <tu-project-ref>
//
//   # 3. Deploy
//   supabase functions deploy create-user
//
//   # 4. Setear el service-role key como secret de la función. La función ya
//   #    lee `SUPABASE_URL` y `SUPABASE_ANON_KEY` que vienen por default,
//   #    pero `SUPABASE_SERVICE_ROLE_KEY` hay que setearlo:
//   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
//
//   # 5. (opcional) verifica:
//   supabase functions list
//
// Después de eso, la página Settings ya puede crear usuarios.
// =============================================================================

// @ts-nocheck — entorno Deno; lint de TS-node se queja, pero es código que
// corre en Supabase Edge Runtime, no en el bundle del frontend.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const AUTH_EMAIL_DOMAIN = 'reclutamiento.local';

const ALLOWED_ROLES = ['admin', 'reclutador', 'gerente', 'auditor'] as const;
type AppRole = (typeof ALLOWED_ROLES)[number];

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
    },
  });
}

interface CreateUserPayload {
  username?: string;
  password?: string;
  display_name?: string;
  role?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, message: 'Método no permitido.' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return jsonResponse(
      {
        ok: false,
        message:
          'Configuración incompleta: faltan SUPABASE_URL / ANON_KEY / SERVICE_ROLE_KEY en los secrets de la función.',
      },
      500
    );
  }

  // ── Auth del caller ────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return jsonResponse(
      { ok: false, message: 'Falta el token de sesión.' },
      401
    );
  }

  // Cliente con el JWT del caller para resolver su identidad.
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user: callerUser },
    error: callerErr,
  } = await callerClient.auth.getUser();

  if (callerErr || !callerUser) {
    return jsonResponse(
      { ok: false, message: 'Sesión inválida o expirada.' },
      401
    );
  }

  // Cliente admin (service_role) para todo lo que sigue.
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: callerProfile, error: profileErr } = await admin
    .from('profiles')
    .select('id, role')
    .eq('id', callerUser.id)
    .single();

  if (profileErr || !callerProfile) {
    return jsonResponse(
      { ok: false, message: 'No se pudo verificar tu perfil.' },
      403
    );
  }

  if (callerProfile.role !== 'admin') {
    return jsonResponse(
      { ok: false, message: 'Solo administradores pueden crear usuarios.' },
      403
    );
  }

  // ── Payload ───────────────────────────────────────────────────────────
  let payload: CreateUserPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ ok: false, message: 'JSON inválido.' }, 400);
  }

  const username = (payload.username ?? '').trim().toLowerCase();
  const password = payload.password ?? '';
  const displayName = (payload.display_name ?? '').trim();
  const requestedRole = (payload.role ?? 'reclutador') as AppRole;

  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    return jsonResponse(
      {
        ok: false,
        message:
          'Usuario inválido. Usa 3–32 caracteres: letras minúsculas, números, punto, guion o guion bajo.',
      },
      400
    );
  }

  if (password.length < 8) {
    return jsonResponse(
      { ok: false, message: 'La contraseña debe tener al menos 8 caracteres.' },
      400
    );
  }

  if (!ALLOWED_ROLES.includes(requestedRole)) {
    return jsonResponse({ ok: false, message: 'Rol inválido.' }, 400);
  }

  const email = `${username}@${AUTH_EMAIL_DOMAIN}`;

  // ── Crear user ────────────────────────────────────────────────────────
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName || username },
  });

  if (createErr || !created.user) {
    const message = createErr?.message ?? 'No se pudo crear el usuario.';
    const status =
      message.toLowerCase().includes('already') ||
      message.toLowerCase().includes('duplicate')
        ? 409
        : 400;
    return jsonResponse({ ok: false, message }, status);
  }

  // El trigger `on_auth_user_created` ya creó el row en profiles con role
  // default 'reclutador'. Forzamos display_name y role en un UPDATE.
  const { error: updateErr } = await admin
    .from('profiles')
    .update({
      role: requestedRole,
      display_name: displayName || username,
    })
    .eq('id', created.user.id);

  if (updateErr) {
    return jsonResponse(
      {
        ok: false,
        message:
          'Usuario creado, pero no se pudo asignar el rol: ' + updateErr.message,
      },
      500
    );
  }

  return jsonResponse({
    ok: true,
    user: {
      id: created.user.id,
      username,
      role: requestedRole,
    },
  });
});

// Desplegar con `--no-verify-jwt`: la función valida explícitamente el JWT
// contra Supabase Auth y después exige el rol admin antes de usar service_role.
// @ts-nocheck — entorno Deno; este archivo no forma parte del bundle del frontend.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const PHOTO_BUCKET = "data-update-photos";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (request.method !== "POST") {
    return jsonResponse({ ok: false, message: "Método no permitido." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return jsonResponse({ ok: false, message: "El servicio de eliminación no está configurado." }, 500);
  }

  const authorization = request.headers.get("Authorization") ?? "";
  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return jsonResponse({ ok: false, message: "Falta el token de sesión." }, 401);
  }
  const accessToken = authorization.replace(/^bearer\s+/i, "").trim();
  if (!accessToken) {
    return jsonResponse({ ok: false, message: "Falta el token de sesión." }, 401);
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const {
    data: { user },
    error: userError,
  } = await callerClient.auth.getUser(accessToken);
  if (userError || !user) {
    return jsonResponse({ ok: false, message: "Sesión inválida o expirada." }, 401);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profileError || profile?.role !== "admin") {
    return jsonResponse({ ok: false, message: "Solo administradores pueden eliminar colaboradores de una campaña." }, 403);
  }

  let recordId = "";
  try {
    const body = await request.json();
    recordId = typeof body?.recordId === "string" ? body.recordId.trim() : "";
  } catch {
    return jsonResponse({ ok: false, message: "JSON inválido." }, 400);
  }
  if (!UUID_PATTERN.test(recordId)) {
    return jsonResponse({ ok: false, message: "Colaborador inválido." }, 400);
  }

  const { data: record, error: recordError } = await admin
    .from("data_update_records")
    .select("id, photo_path")
    .eq("id", recordId)
    .maybeSingle();
  if (recordError) {
    return jsonResponse({ ok: false, message: "No se pudo consultar al colaborador." }, 500);
  }
  if (!record) {
    return jsonResponse({ ok: true, deleted: false });
  }

  if (typeof record.photo_path === "string" && record.photo_path.length > 0) {
    const { error: photoError } = await admin.storage
      .from(PHOTO_BUCKET)
      .remove([record.photo_path]);
    if (photoError) {
      return jsonResponse({ ok: false, message: "No se pudo eliminar la fotografía. El colaborador se conservó." }, 500);
    }
  }

  const { data: deletedRecord, error: deleteError } = await admin
    .from("data_update_records")
    .delete()
    .eq("id", recordId)
    .select("id")
    .maybeSingle();
  if (deleteError || !deletedRecord) {
    return jsonResponse({ ok: false, message: "No se pudo eliminar al colaborador. Puedes volver a intentarlo." }, 500);
  }

  return jsonResponse({ ok: true, deleted: true });
});

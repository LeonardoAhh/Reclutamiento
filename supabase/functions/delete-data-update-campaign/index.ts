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
    return jsonResponse({ ok: false, message: "Solo administradores pueden eliminar campañas." }, 403);
  }

  let campaignId = "";
  try {
    const body = await request.json();
    campaignId = typeof body?.campaignId === "string" ? body.campaignId.trim() : "";
  } catch {
    return jsonResponse({ ok: false, message: "JSON inválido." }, 400);
  }
  if (!UUID_PATTERN.test(campaignId)) {
    return jsonResponse({ ok: false, message: "Campaña inválida." }, 400);
  }

  const { data: campaign, error: campaignError } = await admin
    .from("data_update_campaigns")
    .select("id")
    .eq("id", campaignId)
    .maybeSingle();
  if (campaignError) {
    return jsonResponse({ ok: false, message: "No se pudo consultar la campaña." }, 500);
  }
  if (!campaign) {
    return jsonResponse({ ok: true, deleted: false });
  }

  const { data: records, error: recordsError } = await admin
    .from("data_update_records")
    .select("photo_path")
    .eq("campaign_id", campaignId);
  if (recordsError) {
    return jsonResponse({ ok: false, message: "No se pudieron consultar las fotografías de la campaña." }, 500);
  }

  const photoPaths = (records ?? [])
    .map((record) => record.photo_path)
    .filter((path): path is string => typeof path === "string" && path.length > 0);
  if (photoPaths.length > 0) {
    const { error: photoError } = await admin.storage.from(PHOTO_BUCKET).remove(photoPaths);
    if (photoError) {
      return jsonResponse({ ok: false, message: "No se pudieron eliminar todas las fotografías. La campaña se conservó." }, 500);
    }
  }

  const { data: deletedCampaign, error: deleteError } = await admin
    .from("data_update_campaigns")
    .delete()
    .eq("id", campaignId)
    .select("id")
    .maybeSingle();
  if (deleteError || !deletedCampaign) {
    return jsonResponse({ ok: false, message: "No se pudo eliminar la campaña. Puedes volver a intentarlo." }, 500);
  }

  return jsonResponse({ ok: true, deleted: true });
});

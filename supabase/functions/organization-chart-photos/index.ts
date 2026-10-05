import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { requirePasswordChangeComplete } from "../_shared/password-change-access.ts";

// Only these user-approved employees may be exposed by this endpoint.
const EMPLOYEES = ["3160", "2099", "3818", "3376", "3884", "3520", "3999", "4097", "3853", "330", "3204", "4023"];
const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: HEADERS });

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: HEADERS });
  if (request.method !== "POST") return respond({ message: "Método no permitido." }, 405);
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !service) return respond({ message: "Servicio no configurado." }, 503);
  const authorization = request.headers.get("Authorization") ?? "";
  if (!/^Bearer\s+\S+$/i.test(authorization)) return respond({ message: "Sesión requerida." }, 401);

  try {
    const caller = createClient(url, anon, { global: { headers: { Authorization: authorization } } });
    const { data: { user }, error } = await caller.auth.getUser(authorization.replace(/^Bearer\s+/i, ""));
    if (error || !user) return respond({ message: "Sesión inválida o expirada." }, 401);
    const denied = await requirePasswordChangeComplete(request, url, anon, HEADERS);
    if (denied) return denied;

    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
    // Choose the latest available photo across campaigns, without returning personal records.
    const { data: records, error: queryError } = await admin.from("data_update_records")
      .select("id, campaign_id, employee_number, photo_path, updated_at")
      .in("employee_number", EMPLOYEES).not("photo_path", "is", null)
      .order("updated_at", { ascending: false }).order("id", { ascending: false });
    if (queryError) return respond({ message: "No se pudieron consultar las fotos." }, 500);
    const photos: Record<string, string | null> = Object.fromEntries(EMPLOYEES.map(number => [number, null]));
    const selected = new Set<string>();
    for (const record of records ?? []) {
      const number = record.employee_number;
      if (typeof number !== "string" || !EMPLOYEES.includes(number) || selected.has(number)) continue;
      if (typeof record.photo_path !== "string" || !record.photo_path.startsWith(`${record.campaign_id}/${record.id}/`)) {
        return respond({ message: "No se pudo validar una foto del organigrama." }, 500);
      }
      selected.add(number);
      const { data, error: signError } = await admin.storage.from("data-update-photos").createSignedUrl(record.photo_path, 3600);
      if (signError || !data?.signedUrl) return respond({ message: "No se pudieron cargar las fotos." }, 500);
      photos[number] = data.signedUrl;
    }
    return respond({ photos });
  } catch {
    return respond({ message: "No se pudieron cargar las fotos." }, 500);
  }
});

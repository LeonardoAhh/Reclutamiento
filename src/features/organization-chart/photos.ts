import { supabase } from "@/lib/supabase";

export async function loadOrganizationPhotos(): Promise<Record<string, string | null>> {
  const { data, error } = await supabase.functions.invoke("organization-chart-photos");
  if (error) throw new Error("No se pudieron cargar las fotos del organigrama.");
  const payload: unknown = data;
  if (!payload || typeof payload !== "object" || !("photos" in payload) ||
      !payload.photos || typeof payload.photos !== "object" || Array.isArray(payload.photos)) {
    throw new Error("El servicio devolvió fotos inválidas.");
  }
  const photos: Record<string, string | null> = {};
  for (const [number, value] of Object.entries(payload.photos)) {
    if (value !== null && (typeof value !== "string" || !value.startsWith("https://"))) {
      throw new Error("El servicio devolvió una foto inválida.");
    }
    photos[number] = value;
  }
  return photos;
}

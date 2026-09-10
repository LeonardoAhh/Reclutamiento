import { supabase } from "@/lib/supabase";
import { toNaturalCase } from "@/lib/utils";
import {
  DATA_UPDATE_PHOTO_BUCKET,
  DATA_UPDATE_SIGNED_URL_SECONDS,
} from "./constants";
import { getDataUpdatePhotoExtension, splitEmergencyContact } from "./validation";
import type {
  DataUpdateAuditEntry,
  DataUpdateCampaign,
  DataUpdateCampaignDetail,
  DataUpdateEditableData,
  DataUpdateImportResult,
  DataUpdateIncident,
  DataUpdateProfileOption,
  DataUpdateRecord,
} from "./types";

type UnknownRecord = Record<string, unknown>;

function objectValue(value: unknown): UnknownRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("La base de actualización devolvió datos inválidos.");
  }
  return value as UnknownRecord;
}

function textValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function nullableText(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function textArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(textValue);
}

function mapEditable(value: unknown): DataUpdateEditableData {
  const row = objectValue(value);
  const emergency = splitEmergencyContact(textValue(row.emergencyContact));
  return {
    route: textValue(row.route),
    stop: textValue(row.stop),
    location: textValue(row.location),
    birthState: textValue(row.birthState),
    civilStatus: textValue(row.civilStatus),
    email: textValue(row.email),
    receivesPayrollReceipts: textValue(row.receivesPayrollReceipts),
    mobilePhone: textValue(row.mobilePhone),
    emergencyContact: emergency.emergencyContact,
    emergencyRelationship: textValue(row.emergencyRelationship) || emergency.emergencyRelationship,
    emergencyPhone: textValue(row.emergencyPhone),
    street: textValue(row.street),
    fullAddress: textValue(row.fullAddress),
    municipality: textValue(row.municipality),
    educationLevel: textValue(row.educationLevel),
    bloodType: textValue(row.bloodType),
    allergies: textValue(row.allergies),
    locker: textValue(row.locker),
    shirtSize: textValue(row.shirtSize),
    shoeSize: textValue(row.shoeSize),
    childrenBirthDates: textArray(row.childrenBirthDates),
  };
}

function mapRecord(value: unknown): DataUpdateRecord {
  const row = objectValue(Array.isArray(value) ? value[0] : value);
  const assignedProfile =
    typeof row.assigned_profile === "object" && row.assigned_profile !== null
      ? objectValue(row.assigned_profile)
      : null;
  const campaign =
    typeof row.campaign === "object" && row.campaign !== null
      ? objectValue(row.campaign)
      : null;
  const original = objectValue(row.original_data);

  return {
    id: textValue(row.id),
    campaignId: textValue(row.campaign_id),
    campaignName: campaign ? textValue(campaign.name) : undefined,
    identity: {
      employeeNumber: textValue(row.employee_number),
      name: textValue(row.employee_name),
      area: textValue(row.area),
      section: textValue(row.section),
      position: textValue(row.position),
      shift: textValue(row.shift),
      hireDate: textValue(row.hire_date),
      birthDate: textValue(row.birth_date),
      curp: textValue(row.curp),
      rfc: textValue(row.rfc),
      socialSecurityNumber: textValue(row.social_security_number),
    },
    originalData: Object.fromEntries(
      Object.entries(original).map(([key, item]) => [key, textValue(item)]),
    ),
    data: mapEditable(row.current_data),
    assignedTo: textValue(row.assigned_to),
    assignedName: assignedProfile
      ? textValue(assignedProfile.display_name) || textValue(assignedProfile.username)
      : undefined,
    status: textValue(row.status) as DataUpdateRecord["status"],
    identityReview: textValue(row.identity_review) as DataUpdateRecord["identityReview"],
    currentStep: numberValue(row.current_step),
    photoPath: nullableText(row.photo_path),
    version: numberValue(row.version),
    startedAt: nullableText(row.started_at),
    completedAt: nullableText(row.completed_at),
    updatedAt: textValue(row.updated_at),
  };
}

function mapCampaign(value: unknown): DataUpdateCampaign {
  const row = objectValue(value);
  return {
    id: textValue(row.id),
    name: textValue(row.name),
    year: numberValue(row.year),
    status: textValue(row.status) as DataUpdateCampaign["status"],
    createdBy: textValue(row.created_by),
    createdAt: textValue(row.created_at),
  };
}

function mapIncident(value: unknown): DataUpdateIncident {
  const row = objectValue(value);
  const profile = row.profile ? objectValue(row.profile) : null;
  return {
    id: textValue(row.id),
    recordId: textValue(row.record_id),
    fieldName: textValue(row.field_name) as DataUpdateIncident["fieldName"],
    note: textValue(row.note),
    reportedBy: textValue(row.reported_by),
    reportedByName: profile
      ? textValue(profile.display_name) || textValue(profile.username)
      : undefined,
    createdAt: textValue(row.created_at),
  };
}

export function dataUpdateError(error: unknown): string {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? textValue(error.message)
      : "";
  if (message.includes("DATA_UPDATE_CONFLICT")) {
    return "Este registro cambió en otro dispositivo. Recarga antes de continuar.";
  }
  if (message.includes("DATA_UPDATE_NOT_FOUND")) return "El registro ya no está disponible.";
  if (message.includes("DATA_UPDATE_FORBIDDEN")) return "No tienes permiso para realizar esta acción.";
  if (message.includes("DATA_UPDATE_NAME_REQUIRED")) return "Escribe un nombre para la campaña.";
  if (message.includes("DATA_UPDATE_RECORDS_REQUIRED")) return "El archivo no contiene colaboradores válidos.";
  if (message.includes("DATA_UPDATE_PARTICIPANTS_REQUIRED")) return "Selecciona al menos un participante.";
  if (message.includes("DATA_UPDATE_INVALID_PARTICIPANT")) return "Uno de los participantes no está disponible o no tiene un rol permitido.";
  if (message.includes("DATA_UPDATE_ADMIN_PARTICIPATION_REQUIRED")) return "El administrador que crea la campaña debe participar en el reparto.";
  if (message.includes("DATA_UPDATE_INVALID_RECORD")) return "El archivo contiene un registro con estructura inválida.";
  if (message.includes("DATA_UPDATE_INVALID_DRAFT") || message.includes("DATA_UPDATE_INVALID_FIELDS")) return "El borrador contiene campos inválidos. Recarga el registro e inténtalo de nuevo.";
  if (message.includes("DATA_UPDATE_INVALID_REVIEW") || message.includes("DATA_UPDATE_INVALID_INCIDENT")) return "Revisa los campos y la observación de la incidencia.";
  if (message.includes("DATA_UPDATE_INCIDENT_REQUIRED")) return "Selecciona al menos un campo y escribe una observación.";
  if (message.includes("DATA_UPDATE_REQUIRED_FIELDS")) return "Completa todos los campos antes de finalizar.";
  if (message.includes("DATA_UPDATE_PHOTO_REQUIRED")) return "La fotografía es obligatoria.";
  if (message.includes("DATA_UPDATE_INVALID_PHOTO")) return "La fotografía no pertenece a este registro o ya no está disponible.";
  if (message.includes("DATA_UPDATE_IDENTITY_PENDING")) return "Confirma los datos de identificación o registra una incidencia.";
  if (message.includes("DATA_UPDATE_INVALID_TRANSPORT")) return "Selecciona una combinación válida de ruta, parada y ubicación.";
  if (message.includes("DATA_UPDATE_INVALID_CIVIL_STATUS")) return "Selecciona un estado civil válido para la campaña.";
  if (message.includes("DATA_UPDATE_INVALID_BIRTH_STATE")) return "Selecciona un Estado de nacimiento válido.";
  if (message.includes("DATA_UPDATE_INVALID_EMAIL")) return "Captura un correo con formato válido.";
  if (message.includes("DATA_UPDATE_INVALID_PAYROLL_RECEIPTS")) return "Indica si recibes tus recibos de nómina.";
  if (message.includes("DATA_UPDATE_INVALID_CHILD_BIRTH_DATES")) return "Captura una fecha de nacimiento válida para cada hijo.";
  if (message.includes("DATA_UPDATE_INVALID_LOCKER")) return "Captura el número de locker usando solo dígitos.";
  if (message.includes("DATA_UPDATE_LOCKER_ASSIGNED")) return "Este locker ya está asignado a otro colaborador.";
  if (message.includes("DATA_UPDATE_COMPLETED")) return "El registro está completado. Un administrador debe reabrirlo para editarlo.";
  if (message.includes("DATA_UPDATE_REOPEN_INVALID")) return "Solo se pueden reabrir registros completados.";
  if (message.includes("duplicate key value")) return "Hay información duplicada en la campaña.";
  if (message.includes("data_update_") || message.includes("Could not find")) {
    return "Actualización de datos aún no está habilitada. Aplica la migración 034.";
  }
  return message || "No fue posible completar la operación.";
}

const RECORD_SELECT = `
  *,
  assigned_profile:profiles!data_update_records_assigned_to_fkey(display_name, username),
  campaign:data_update_campaigns!data_update_records_campaign_id_fkey(name)
`;

export async function listDataUpdateCampaigns(): Promise<DataUpdateCampaign[]> {
  const { data, error } = await supabase
    .from("data_update_campaigns")
    .select("id, name, year, status, created_by, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(dataUpdateError(error));
  return (data ?? []).map(mapCampaign);
}

export async function listEligibleDataUpdateProfiles(): Promise<DataUpdateProfileOption[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, username, role")
    .in("role", ["admin", "reclutador"])
    .order("display_name", { ascending: true });
  if (error) throw new Error(dataUpdateError(error));
  return (data ?? []).map((value: unknown) => {
    const row = objectValue(value);
    return {
      id: textValue(row.id),
      label: toNaturalCase(
        textValue(row.display_name) || textValue(row.username),
        { preserveAcronyms: false },
      ),
      role: textValue(row.role) as DataUpdateProfileOption["role"],
    };
  });
}

export async function createDataUpdateCampaign(input: {
  name: string;
  year: number;
  participantIds: string[];
  parsed: DataUpdateImportResult;
}): Promise<string> {
  const { data, error } = await supabase.rpc("create_data_update_campaign", {
    p_name: input.name,
    p_year: input.year,
    p_participant_ids: input.participantIds,
    p_records: input.parsed.rows,
    p_transport_options: input.parsed.transportOptions,
    p_civil_statuses: input.parsed.civilStatuses,
  });
  if (error) throw new Error(dataUpdateError(error));
  if (typeof data !== "string") throw new Error("La campaña no devolvió un identificador válido.");
  return data;
}

export async function deleteDataUpdateCampaign(campaignId: string): Promise<void> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (sessionError || !accessToken) {
    throw new Error("Tu sesión ha caducado. Vuelve a iniciar sesión.");
  }

  const { data, error } = await supabase.functions.invoke("delete-data-update-campaign", {
    body: { campaignId },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (error) {
    let message = error.message;
    const context = "context" in error ? error.context : null;
    if (context instanceof Response) {
      try {
        const responseBody: unknown = await context.clone().json();
        if (typeof responseBody === "object" && responseBody !== null && "message" in responseBody) {
          const responseMessage = responseBody.message;
          if (typeof responseMessage === "string") message = responseMessage;
        }
      } catch {
        // Conserva el mensaje normalizado del cliente cuando la respuesta no es JSON.
      }
      if (context.status === 401 && message === error.message) {
        message = "No se pudo validar tu sesión en el servicio de eliminación.";
      }
    }
    throw new Error(dataUpdateError(message));
  }

  const response = objectValue(data);
  if (response.ok !== true) {
    throw new Error(dataUpdateError(response.message));
  }
}

export async function getDataUpdateCampaignDetail(
  campaignId: string,
): Promise<DataUpdateCampaignDetail> {
  const [campaignResult, recordsResult, participantsResult, transportResult, civilResult] = await Promise.all([
    supabase.from("data_update_campaigns").select("id, name, year, status, created_by, created_at").eq("id", campaignId).single(),
    supabase.from("data_update_records").select(RECORD_SELECT).eq("campaign_id", campaignId).order("employee_name"),
    supabase.from("data_update_campaign_participants").select("profile_id").eq("campaign_id", campaignId),
    supabase.from("data_update_transport_options").select("route, stop, location").eq("campaign_id", campaignId).order("route"),
    supabase.from("data_update_civil_statuses").select("value").eq("campaign_id", campaignId).order("value"),
  ]);
  const firstError = campaignResult.error ?? recordsResult.error ?? participantsResult.error ?? transportResult.error ?? civilResult.error;
  if (firstError) throw new Error(dataUpdateError(firstError));
  const campaign = mapCampaign(campaignResult.data);
  const records = (recordsResult.data ?? []).map(mapRecord);
  return {
    campaign,
    records,
    participantIds: (participantsResult.data ?? []).map((value: unknown) =>
      textValue(objectValue(value).profile_id),
    ),
    transportOptions: (transportResult.data ?? []).map((value: unknown) => {
      const row = objectValue(value);
      return { route: textValue(row.route), stop: textValue(row.stop), location: textValue(row.location) };
    }),
    civilStatuses: (civilResult.data ?? []).map((value: unknown) => textValue(objectValue(value).value)),
  };
}

export async function listDataUpdateIncidents(recordId: string): Promise<DataUpdateIncident[]> {
  const { data, error } = await supabase
    .from("data_update_incidents")
    .select("id, record_id, field_name, note, reported_by, created_at, profile:profiles!data_update_incidents_reported_by_fkey(display_name, username)")
    .eq("record_id", recordId)
    .order("created_at");
  if (error) throw new Error(dataUpdateError(error));
  return (data ?? []).map(mapIncident);
}

export async function listCampaignDataUpdateIncidents(
  recordIds: string[],
): Promise<DataUpdateIncident[]> {
  if (recordIds.length === 0) return [];
  const { data, error } = await supabase
    .from("data_update_incidents")
    .select("id, record_id, field_name, note, reported_by, created_at, profile:profiles!data_update_incidents_reported_by_fkey(display_name, username)")
    .in("record_id", recordIds)
    .order("created_at");
  if (error) throw new Error(dataUpdateError(error));
  return (data ?? []).map(mapIncident);
}

export async function saveDataUpdateRecord(input: {
  recordId: string;
  version: number;
  data: DataUpdateEditableData;
  step: number;
  photoPath: string | null;
}): Promise<DataUpdateRecord> {
  const { data, error } = await supabase.rpc("save_data_update_record", {
    p_record_id: input.recordId,
    p_expected_version: input.version,
    p_current_data: input.data,
    p_current_step: input.step,
    p_photo_path: input.photoPath,
  });
  if (error) throw new Error(dataUpdateError(error));
  return mapRecord(data);
}

export async function reviewDataUpdateIdentity(input: {
  recordId: string;
  version: number;
  status: "confirmado" | "incidencia";
  incidents: Array<{ fieldName: string; note: string }>;
}): Promise<DataUpdateRecord> {
  const { data, error } = await supabase.rpc("review_data_update_identity", {
    p_record_id: input.recordId,
    p_expected_version: input.version,
    p_status: input.status,
    p_incidents: input.incidents,
  });
  if (error) throw new Error(dataUpdateError(error));
  return mapRecord(data);
}

export async function completeDataUpdateRecord(recordId: string, version: number) {
  const { data, error } = await supabase.rpc("complete_data_update_record", {
    p_record_id: recordId,
    p_expected_version: version,
  });
  if (error) throw new Error(dataUpdateError(error));
  return mapRecord(data);
}

export async function reopenDataUpdateRecord(recordId: string) {
  const { data, error } = await supabase.rpc("reopen_data_update_record", {
    p_record_id: recordId,
  });
  if (error) throw new Error(dataUpdateError(error));
  return mapRecord(data);
}

export async function reassignDataUpdateRecord(recordId: string, profileId: string) {
  const { data, error } = await supabase.rpc("reassign_data_update_record", {
    p_record_id: recordId,
    p_assigned_to: profileId,
  });
  if (error) throw new Error(dataUpdateError(error));
  return mapRecord(data);
}

export async function assignDataUpdateLocker(recordId: string, locker: string): Promise<void> {
  const { error } = await supabase.rpc("assign_data_update_locker", {
    p_record_id: recordId,
    p_locker: locker,
  });
  if (error) throw new Error(dataUpdateError(error));
}

export async function listDataUpdateAudit(recordIds: string[]): Promise<DataUpdateAuditEntry[]> {
  if (recordIds.length === 0) return [];
  const { data, error } = await supabase
    .from("data_update_audit")
    .select("id, record_id, field_name, previous_value, next_value, changed_by, created_at, profile:profiles!data_update_audit_changed_by_fkey(display_name, username)")
    .in("record_id", recordIds)
    .order("created_at");
  if (error) throw new Error(dataUpdateError(error));
  return (data ?? []).map((value: unknown) => {
    const row = objectValue(value);
    const profile = row.profile ? objectValue(row.profile) : null;
    return {
      id: textValue(row.id),
      recordId: textValue(row.record_id),
      fieldName: textValue(row.field_name),
      previousValue: nullableText(row.previous_value),
      nextValue: nullableText(row.next_value),
      changedBy: textValue(row.changed_by),
      changedByName: profile ? textValue(profile.display_name) || textValue(profile.username) : undefined,
      createdAt: textValue(row.created_at),
    };
  });
}

export async function uploadDataUpdatePhoto(record: DataUpdateRecord, file: File): Promise<string> {
  const extension = getDataUpdatePhotoExtension(file);
  const path = `${record.campaignId}/${record.id}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(DATA_UPDATE_PHOTO_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(dataUpdateError(error));
  return path;
}

export async function removeDataUpdatePhoto(path: string): Promise<void> {
  const { error } = await supabase.storage.from(DATA_UPDATE_PHOTO_BUCKET).remove([path]);
  if (error) throw new Error(dataUpdateError(error));
}

export async function downloadDataUpdatePhoto(path: string): Promise<Blob> {
  const { data, error } = await supabase.storage.from(DATA_UPDATE_PHOTO_BUCKET).download(path);
  if (error || !data) throw new Error(dataUpdateError(error));
  return data;
}

export async function getDataUpdatePhotoUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(DATA_UPDATE_PHOTO_BUCKET)
    .createSignedUrl(path, DATA_UPDATE_SIGNED_URL_SECONDS);
  if (error || !data?.signedUrl) throw new Error(dataUpdateError(error));
  return data.signedUrl;
}

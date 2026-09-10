import { supabase } from "@/lib/supabase";
import { toTitleCase } from "@/lib/utils";
import {
  DAILY_WORK_FILES_BUCKET,
  DAILY_WORK_SIGNED_URL_TTL_SECONDS,
  getDailyWorkFileMimeType,
} from "./constants";
import type {
  DailyWorkActivity,
  DailyWorkActivityInput,
  DailyWorkAttachment,
  DailyWorkRecruiter,
} from "./types";

const DAILY_WORK_ACTIVITY_SELECT = `
  id,
  recruiter_id,
  work_date,
  description,
  start_time,
  end_time,
  created_at,
  updated_at,
  recruiter:profiles!daily_work_activities_recruiter_id_fkey(display_name, username),
  attachments:daily_work_activity_attachments(
    id,
    file_name,
    mime_type,
    size_bytes,
    storage_path,
    created_at
  )
`;

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function textValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function nullableTextValue(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalizeAttachment(value: unknown): DailyWorkAttachment | null {
  const row = asRecord(value);
  if (!row) return null;

  const id = textValue(row.id);
  const storagePath = textValue(row.storage_path);
  if (!id || !storagePath) return null;

  return {
    id,
    fileName: textValue(row.file_name),
    mimeType: textValue(row.mime_type),
    sizeBytes: numberValue(row.size_bytes),
    storagePath,
    createdAt: textValue(row.created_at),
  };
}

function normalizeActivity(value: unknown): DailyWorkActivity | null {
  const row = asRecord(value);
  if (!row) return null;

  const id = textValue(row.id);
  const recruiterId = textValue(row.recruiter_id);
  const workDate = textValue(row.work_date);
  const description = textValue(row.description);
  if (!id || !recruiterId || !workDate || !description) return null;

  const recruiter = asRecord(row.recruiter);
  const recruiterName =
    textValue(recruiter?.display_name) ||
    textValue(recruiter?.username) ||
    "Reclutador";

  const attachments = Array.isArray(row.attachments)
    ? row.attachments
        .map(normalizeAttachment)
        .filter((item): item is DailyWorkAttachment => item !== null)
    : [];

  return {
    id,
    recruiterId,
    recruiterName: toTitleCase(recruiterName),
    workDate,
    description,
    startTime: nullableTextValue(row.start_time),
    endTime: nullableTextValue(row.end_time),
    attachments,
    createdAt: textValue(row.created_at),
    updatedAt: textValue(row.updated_at),
  };
}

async function attachSignedUrls(
  activities: DailyWorkActivity[],
): Promise<DailyWorkActivity[]> {
  const paths = activities.flatMap((activity) =>
    activity.attachments.map((attachment) => attachment.storagePath),
  );
  if (paths.length === 0) return activities;

  const { data, error } = await supabase.storage
    .from(DAILY_WORK_FILES_BUCKET)
    .createSignedUrls(paths, DAILY_WORK_SIGNED_URL_TTL_SECONDS);
  if (error) throw error;

  const signedUrlByPath = new Map<string, string>();
  if (Array.isArray(data)) {
    data.forEach((value) => {
      const row = asRecord(value);
      const path = textValue(row?.path);
      const signedUrl = textValue(row?.signedUrl);
      if (path && signedUrl) signedUrlByPath.set(path, signedUrl);
    });
  }

  return activities.map((activity) => ({
    ...activity,
    attachments: activity.attachments.map((attachment) => ({
      ...attachment,
      signedUrl: signedUrlByPath.get(attachment.storagePath),
    })),
  }));
}

export async function fetchDailyWorkActivities(
  workDate: string,
  recruiterId?: string,
): Promise<DailyWorkActivity[]> {
  let query = supabase
    .from("daily_work_activities")
    .select(DAILY_WORK_ACTIVITY_SELECT)
    .eq("work_date", workDate)
    .order("start_time", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (recruiterId) query = query.eq("recruiter_id", recruiterId);

  const { data, error } = await query;
  if (error) throw error;

  const activities = Array.isArray(data)
    ? data
        .map(normalizeActivity)
        .filter((item): item is DailyWorkActivity => item !== null)
    : [];

  return attachSignedUrls(activities);
}

export async function fetchDailyWorkRecruiters(): Promise<
  DailyWorkRecruiter[]
> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, username")
    .eq("role", "reclutador")
    .order("display_name", { ascending: true });
  if (error) throw error;

  if (!Array.isArray(data)) return [];
  return data.flatMap((value) => {
    const row = asRecord(value);
    const id = textValue(row?.id);
    const displayName =
      textValue(row?.display_name) || textValue(row?.username);
    return id && displayName
      ? [{ id, displayName: toTitleCase(displayName) }]
      : [];
  });
}

export async function createDailyWorkActivity(
  recruiterId: string,
  input: DailyWorkActivityInput,
): Promise<string> {
  const { data, error } = await supabase
    .from("daily_work_activities")
    .insert({
      recruiter_id: recruiterId,
      work_date: input.workDate,
      description: input.description,
      start_time: input.startTime,
      end_time: input.endTime,
    })
    .select("id")
    .single();
  if (error) throw error;

  const id = textValue(asRecord(data)?.id);
  if (!id) throw new Error("No se recibió el identificador de la actividad.");
  return id;
}

export async function updateDailyWorkActivity(
  activityId: string,
  input: DailyWorkActivityInput,
): Promise<void> {
  const { error } = await supabase
    .from("daily_work_activities")
    .update({
      work_date: input.workDate,
      description: input.description,
      start_time: input.startTime,
      end_time: input.endTime,
    })
    .eq("id", activityId);
  if (error) throw error;
}

export async function deleteDailyWorkActivity(
  activity: DailyWorkActivity,
): Promise<{ attachmentCleanupFailed: boolean }> {
  const { data, error } = await supabase
    .from("daily_work_activities")
    .delete()
    .eq("id", activity.id)
    .select("id")
    .single();
  if (error) throw error;

  const deletedId = textValue(asRecord(data)?.id);
  if (deletedId !== activity.id) {
    throw new Error("No se confirmó la eliminación de la actividad.");
  }

  const storagePaths = activity.attachments.map(
    (attachment) => attachment.storagePath,
  );
  if (storagePaths.length === 0) return { attachmentCleanupFailed: false };

  const { error: storageError } = await supabase.storage
    .from(DAILY_WORK_FILES_BUCKET)
    .remove(storagePaths);

  return { attachmentCleanupFailed: Boolean(storageError) };
}

interface UploadDailyWorkFilesResult {
  uploadedCount: number;
  failedFileNames: string[];
}

function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  return lastDot >= 0 ? fileName.slice(lastDot).toLocaleLowerCase("es-MX") : "";
}

export async function uploadDailyWorkFiles(
  activityId: string,
  recruiterId: string,
  files: File[],
): Promise<UploadDailyWorkFilesResult> {
  const result: UploadDailyWorkFilesResult = {
    uploadedCount: 0,
    failedFileNames: [],
  };

  for (const file of files) {
    const mimeType = getDailyWorkFileMimeType(file);
    if (!mimeType) {
      result.failedFileNames.push(file.name);
      continue;
    }

    const storagePath = `${recruiterId}/${activityId}/${crypto.randomUUID()}${getFileExtension(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from(DAILY_WORK_FILES_BUCKET)
      .upload(storagePath, file, { contentType: mimeType, upsert: false });

    if (uploadError) {
      result.failedFileNames.push(file.name);
      continue;
    }

    const { error: metadataError } = await supabase
      .from("daily_work_activity_attachments")
      .insert({
        activity_id: activityId,
        storage_path: storagePath,
        file_name: file.name,
        mime_type: mimeType,
        size_bytes: file.size,
        uploaded_by: recruiterId,
      });

    if (metadataError) {
      await supabase.storage.from(DAILY_WORK_FILES_BUCKET).remove([storagePath]);
      result.failedFileNames.push(file.name);
      continue;
    }

    result.uploadedCount += 1;
  }

  return result;
}

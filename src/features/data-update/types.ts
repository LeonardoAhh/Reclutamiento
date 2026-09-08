export const DATA_UPDATE_PATH = "/actualizacion-datos";

export type DataUpdateRecordStatus = "pendiente" | "en_proceso" | "completado";
export type DataUpdateCampaignStatus = "activa" | "completada" | "archivada";
export type IdentityReviewStatus = "pendiente" | "confirmado" | "incidencia";

export interface DataUpdateIdentity {
  employeeNumber: string;
  name: string;
  area: string;
  section: string;
  position: string;
  shift: string;
  hireDate: string;
  birthDate: string;
  curp: string;
  rfc: string;
  socialSecurityNumber: string;
}

export interface DataUpdateEditableData {
  route: string;
  stop: string;
  location: string;
  birthState: string;
  civilStatus: string;
  email: string;
  mobilePhone: string;
  emergencyContact: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  street: string;
  fullAddress: string;
  municipality: string;
  educationLevel: string;
  bloodType: string;
  allergies: string;
  locker: string;
}

export interface DataUpdateCampaign {
  id: string;
  name: string;
  year: number;
  status: DataUpdateCampaignStatus;
  createdBy: string;
  createdAt: string;
}

export interface DataUpdateRecord {
  id: string;
  campaignId: string;
  campaignName?: string;
  identity: DataUpdateIdentity;
  originalData: Record<string, string>;
  data: DataUpdateEditableData;
  assignedTo: string;
  assignedName?: string;
  status: DataUpdateRecordStatus;
  identityReview: IdentityReviewStatus;
  currentStep: number;
  photoPath: string | null;
  version: number;
  startedAt: string | null;
  completedAt: string | null;
  updatedAt: string;
}

export interface DataUpdateIncident {
  id: string;
  recordId: string;
  fieldName: keyof DataUpdateIdentity;
  note: string;
  reportedBy: string;
  reportedByName?: string;
  createdAt: string;
}

export interface DataUpdateAuditEntry {
  id: string;
  recordId: string;
  fieldName: string;
  previousValue: string | null;
  nextValue: string | null;
  changedBy: string;
  changedByName?: string;
  createdAt: string;
}

export interface DataUpdateTransportOption {
  route: string;
  stop: string;
  location: string;
}

export interface DataUpdateProfileOption {
  id: string;
  label: string;
  role: "admin" | "reclutador";
}

export interface DataUpdateImportRow {
  identity: DataUpdateIdentity;
  originalData: Record<string, string>;
  data: DataUpdateEditableData;
}

export interface DataUpdateImportResult {
  rows: DataUpdateImportRow[];
  transportOptions: DataUpdateTransportOption[];
  civilStatuses: string[];
  errors: string[];
  warnings: string[];
}

export interface DataUpdateCampaignDetail {
  campaign: DataUpdateCampaign;
  records: DataUpdateRecord[];
  participantIds: string[];
  transportOptions: DataUpdateTransportOption[];
  civilStatuses: string[];
}

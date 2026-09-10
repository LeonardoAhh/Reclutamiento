import {
  TRANSPORTE_NA,
  isNaMarker,
  matchParada,
  matchRuta,
  normalizeRuta,
} from "@/lib/transporte-routes";
import { normalizeString } from "@/lib/utils";
import { localTodayIso } from "@/lib/dates";
import {
  DATA_UPDATE_PHOTO_MAX_BYTES,
  DATA_UPDATE_RAW_FIELDS,
  EDITABLE_FIELDS,
  MEXICO_STATES,
  PAYROLL_RECEIPT_OPTIONS,
  SHOE_SIZE_OPTIONS,
} from "./constants";
import type {
  DataUpdateEditableData,
  DataUpdateImportResult,
  DataUpdateImportRow,
  DataUpdateTransportOption,
} from "./types";

type RawRecord = Record<string, unknown>;

function asText(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value).replace(/\s+/g, " ").trim();
  }
  return "";
}

function matchBirthState(value: string): string {
  const normalized = normalizeString(value);
  return MEXICO_STATES.find((state) => normalizeString(state) === normalized) ?? "";
}

function canonicalCivilStatus(value: string, known: Map<string, string>): string {
  const clean = asText(value);
  if (!clean) return "";
  const key = normalizeString(clean);
  const existing = known.get(key);
  if (existing) return existing;
  known.set(key, clean);
  return clean;
}

export function splitEmergencyContact(value: string): {
  emergencyContact: string;
  emergencyRelationship: string;
} {
  const separatorIndex = value.lastIndexOf("/");
  if (separatorIndex <= 0 || separatorIndex === value.length - 1) {
    return { emergencyContact: value, emergencyRelationship: "" };
  }
  return {
    emergencyContact: value.slice(0, separatorIndex).trim(),
    emergencyRelationship: value.slice(separatorIndex + 1).trim(),
  };
}

function parseRow(
  raw: RawRecord,
  civilStatuses: Map<string, string>,
): DataUpdateImportRow {
  const originalData = Object.fromEntries(
    DATA_UPDATE_RAW_FIELDS.map((field) => [field, asText(raw[field])]),
  );
  const route = matchRuta(originalData["Nombre Ruta"]) ?? originalData["Nombre Ruta"];
  const stop = matchParada(originalData.Parada) ?? originalData.Parada;
  const emergency = splitEmergencyContact(originalData["Contacto Emergencia"]);

  return {
    identity: {
      employeeNumber: originalData["Numero Empleado"],
      name: originalData.Nombre,
      area: originalData.Area,
      section: originalData.Seccion,
      position: originalData.Puesto,
      shift: originalData.Turno,
      hireDate: originalData["Fecha Ingreso"],
      birthDate: originalData["Fecha Nacimiento"],
      curp: originalData.CURP,
      rfc: originalData.RFC,
      socialSecurityNumber: originalData["Numero Seguro Social"],
    },
    originalData,
    data: {
      route,
      stop,
      location: originalData.Ubicacion,
      birthState: matchBirthState(originalData["Lugar Nacimiento"]),
      civilStatus: canonicalCivilStatus(originalData["Edo Civil"], civilStatuses),
      email: originalData.Correo,
      receivesPayrollReceipts: "",
      mobilePhone: originalData["Telefono Movil"],
      emergencyContact: emergency.emergencyContact,
      emergencyRelationship: emergency.emergencyRelationship,
      emergencyPhone: originalData["Telefono Emergencia"],
      street: originalData.Calle,
      fullAddress: originalData["Direccion Completa"],
      municipality: originalData.Estado,
      educationLevel: originalData["Ultimo Grado Estudios"],
      bloodType: originalData["Tipo Sangre"],
      allergies: originalData.Alergias,
      locker: originalData.Locker,
      shirtSize: "",
      shoeSize: "",
      childrenBirthDates: [],
    },
  };
}

export function parseDataUpdateImport(source: unknown): DataUpdateImportResult {
  if (!Array.isArray(source)) {
    return {
      rows: [],
      transportOptions: [],
      civilStatuses: [],
      errors: ["El archivo debe contener un arreglo JSON de colaboradores."],
      warnings: [],
    };
  }

  const rows: DataUpdateImportRow[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  const employeeNumbers = new Set<string>();
  const civilStatuses = new Map<string, string>();
  const transportOptions = new Map<string, DataUpdateTransportOption>();

  source.forEach((value, index) => {
    const rowNumber = index + 1;
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      errors.push(`Fila ${rowNumber}: debe ser un objeto.`);
      return;
    }
    const raw = value as RawRecord;
    const missing = DATA_UPDATE_RAW_FIELDS.filter((field) => !(field in raw));
    if (missing.length > 0) {
      errors.push(`Fila ${rowNumber}: faltan columnas: ${missing.join(", ")}.`);
      return;
    }

    const row = parseRow(raw, civilStatuses);
    const requiredIdentity = Object.values(row.identity).every(Boolean);
    if (!requiredIdentity) {
      errors.push(`Fila ${rowNumber}: los datos de identificación no pueden estar vacíos.`);
      return;
    }
    if (employeeNumbers.has(row.identity.employeeNumber)) {
      errors.push(`Fila ${rowNumber}: número de empleado duplicado ${row.identity.employeeNumber}.`);
      return;
    }
    employeeNumbers.add(row.identity.employeeNumber);
    rows.push(row);

    const canonicalRoute = matchRuta(row.originalData["Nombre Ruta"]);
    const canonicalStop = matchParada(row.originalData.Parada);
    const location = row.originalData.Ubicacion;
    if (canonicalRoute && canonicalStop && location) {
      const option = { route: canonicalRoute, stop: canonicalStop, location };
      transportOptions.set(
        [normalizeRuta(option.route), normalizeRuta(option.stop), normalizeRuta(option.location)].join("\u0000"),
        option,
      );
    } else {
      warnings.push(
        `Fila ${rowNumber}: Ruta, Parada o Ubicación no pertenece al catálogo disponible; deberá corregirse.`,
      );
    }
    if (!row.data.birthState) {
      warnings.push(`Fila ${rowNumber}: deberá seleccionar el Estado de nacimiento.`);
    }
  });

  const naOption = { route: TRANSPORTE_NA, stop: TRANSPORTE_NA, location: TRANSPORTE_NA };
  transportOptions.set(
    [TRANSPORTE_NA, TRANSPORTE_NA, TRANSPORTE_NA].join("\u0000"),
    naOption,
  );
  civilStatuses.set(normalizeString(TRANSPORTE_NA), TRANSPORTE_NA);

  return {
    rows,
    transportOptions: [...transportOptions.values()],
    civilStatuses: [...civilStatuses.values()],
    errors,
    warnings,
  };
}

export function validateEditableData(data: DataUpdateEditableData): string[] {
  return Object.values(getEditableDataErrors(data));
}

export function getEditableDataErrors(
  data: DataUpdateEditableData,
): Partial<Record<keyof DataUpdateEditableData, string>> {
  const errors: Partial<Record<keyof DataUpdateEditableData, string>> = {};
  EDITABLE_FIELDS.forEach(({ key, label }) => {
    if (!data[key].trim()) errors[key] = `${label} es obligatorio.`;
  });
  if (data.childrenBirthDates.some((value) => !isDataUpdateBirthDateValid(value))) {
    errors.childrenBirthDates = "Captura una fecha de nacimiento válida para cada hijo.";
  }
  if (data.email && !isDataUpdateEmailValid(data.email)) {
    errors.email = "Escribe un correo válido, por ejemplo nombre@gmail.com.";
  }
  if (!isDataUpdatePayrollReceiptStatusValid(data.receivesPayrollReceipts)) {
    errors.receivesPayrollReceipts = "Indica si recibes tus recibos de nómina.";
  }
  if (!SHOE_SIZE_OPTIONS.some((option) => option.value === data.shoeSize)) {
    errors.shoeSize = "Selecciona una talla de zapatos entera entre 15 y 31 cm.";
  }
  if (data.mobilePhone && !isDataUpdatePhoneValid(data.mobilePhone)) {
    errors.mobilePhone = "Escribe un teléfono móvil de 10 dígitos.";
  }
  if (data.emergencyPhone && !isDataUpdatePhoneValid(data.emergencyPhone)) {
    errors.emergencyPhone = "Escribe un teléfono de emergencia de 10 dígitos.";
  }
  return errors;
}

export function isDataUpdateBirthDateValid(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) return false;

  return value <= localTodayIso();
}

export function isDataUpdateEmailValid(value: string): boolean {
  return isNaMarker(value) || /^\S+@\S+\.\S+$/.test(value);
}

export function isDataUpdatePhoneValid(value: string): boolean {
  return /^\d{10}$/.test(value);
}

export function isDataUpdatePayrollReceiptStatusValid(value: string): boolean {
  return PAYROLL_RECEIPT_OPTIONS.some((option) => option === value);
}

const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validateDataUpdatePhoto(file: File): string | null {
  if (!PHOTO_TYPES.has(file.type)) return "Selecciona una imagen JPEG, PNG o WebP.";
  if (file.size > DATA_UPDATE_PHOTO_MAX_BYTES) return "La imagen debe pesar máximo 5 MB.";
  return null;
}

export function getDataUpdatePhotoExtension(file: File): string {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

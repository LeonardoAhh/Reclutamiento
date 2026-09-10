import type {
  DataUpdateEditableTextKey,
  DataUpdateIdentity,
  DataUpdateRecord,
} from "./types";

export const DATA_UPDATE_PHOTO_BUCKET = "data-update-photos";
export const DATA_UPDATE_PHOTO_ACCEPT = "image/jpeg,image/png,image/webp";
export const DATA_UPDATE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const DATA_UPDATE_PHOTO_EXPORT_JPEG_QUALITY = 0.95;
export const DATA_UPDATE_SIGNED_URL_SECONDS = 300;
export const DATA_UPDATE_STEP_COUNT = 8;
export const DATA_UPDATE_AUTOSAVE_DELAY_MS = 800;
export const DATA_UPDATE_PAGE_SIZE = 12;
export const DATA_UPDATE_OTHER_RELATIONSHIP = "OTRO";
export const PAYROLL_RECEIPT_OPTIONS = ["SI", "NO"] as const;

export const SHIRT_SIZE_OPTIONS = [
  { value: "XS", label: "XS — EXTRA CHICA" },
  { value: "S", label: "S — CHICA (CH)" },
  { value: "M", label: "M — MEDIANA (M)" },
  { value: "L", label: "L — GRANDE (G)" },
  { value: "XL", label: "XL — EXTRA GRANDE (XG)" },
  { value: "XXL", label: "XXL — DOBLE EXTRA GRANDE (XXG)" },
  { value: "3XL", label: "3XL — TRIPLE EXTRA GRANDE" },
] as const;

export const SHOE_SIZE_OPTIONS = [
  { value: "15", label: "15" },
  { value: "16", label: "16" },
  { value: "17", label: "17" },
  { value: "18", label: "18" },
  { value: "19", label: "19" },
  { value: "20", label: "20" },
  { value: "21", label: "21" },
  { value: "22", label: "22" },
  { value: "23", label: "23" },
  { value: "24", label: "24" },
  { value: "25", label: "25" },
  { value: "26", label: "26" },
  { value: "27", label: "27" },
  { value: "28", label: "28" },
  { value: "29", label: "29" },
  { value: "30", label: "30" },
  { value: "31", label: "31" },
] as const;

export const EMERGENCY_RELATIONSHIPS = [
  "MADRE",
  "PADRE",
  "ESPOSA",
  "ESPOSO",
  "HIJA",
  "HIJO",
  "HERMANA",
  "HERMANO",
  "PAREJA",
  "TUTOR",
  DATA_UPDATE_OTHER_RELATIONSHIP,
] as const;

const dataUpdateRecordCollator = new Intl.Collator("es-MX", {
  numeric: true,
  sensitivity: "base",
});

export function compareDataUpdateRecords(left: DataUpdateRecord, right: DataUpdateRecord) {
  return dataUpdateRecordCollator.compare(left.identity.area, right.identity.area)
    || dataUpdateRecordCollator.compare(left.identity.section, right.identity.section)
    || dataUpdateRecordCollator.compare(left.identity.shift, right.identity.shift)
    || dataUpdateRecordCollator.compare(left.identity.name, right.identity.name)
    || dataUpdateRecordCollator.compare(left.identity.employeeNumber, right.identity.employeeNumber);
}

export function compareDataUpdateEmployeeNumbers(left: DataUpdateRecord, right: DataUpdateRecord) {
  return dataUpdateRecordCollator.compare(
    left.identity.employeeNumber,
    right.identity.employeeNumber,
  );
}

export const MEXICO_STATES = [
  "Aguascalientes",
  "Baja California",
  "Baja California Sur",
  "Campeche",
  "Chiapas",
  "Chihuahua",
  "Ciudad de México",
  "Coahuila",
  "Colima",
  "Durango",
  "Estado de México",
  "Guanajuato",
  "Guerrero",
  "Hidalgo",
  "Jalisco",
  "Michoacán",
  "Morelos",
  "Nayarit",
  "Nuevo León",
  "Oaxaca",
  "Puebla",
  "Querétaro",
  "Quintana Roo",
  "San Luis Potosí",
  "Sinaloa",
  "Sonora",
  "Tabasco",
  "Tamaulipas",
  "Tlaxcala",
  "Veracruz",
  "Yucatán",
  "Zacatecas",
] as const;

export const IDENTITY_FIELDS: ReadonlyArray<{
  key: keyof DataUpdateIdentity;
  label: string;
}> = [
  { key: "employeeNumber", label: "Número de empleado" },
  { key: "name", label: "Nombre" },
  { key: "area", label: "Área" },
  { key: "section", label: "Sección" },
  { key: "position", label: "Puesto" },
  { key: "shift", label: "Turno" },
  { key: "hireDate", label: "Fecha de ingreso" },
  { key: "birthDate", label: "Fecha de nacimiento" },
  { key: "curp", label: "CURP" },
  { key: "rfc", label: "RFC" },
  { key: "socialSecurityNumber", label: "Número de Seguro Social" },
];

export const EDITABLE_FIELDS: ReadonlyArray<{
  key: DataUpdateEditableTextKey;
  label: string;
}> = [
  { key: "route", label: "Nombre de ruta" },
  { key: "stop", label: "Parada" },
  { key: "location", label: "Ubicación" },
  { key: "birthState", label: "Estado de nacimiento" },
  { key: "civilStatus", label: "Estado civil" },
  { key: "email", label: "Correo" },
  { key: "receivesPayrollReceipts", label: "Recibe recibos de nómina" },
  { key: "mobilePhone", label: "Teléfono móvil" },
  { key: "emergencyContact", label: "Contacto de emergencia" },
  { key: "emergencyRelationship", label: "Parentesco" },
  { key: "emergencyPhone", label: "Teléfono de emergencia" },
  { key: "street", label: "Calle" },
  { key: "fullAddress", label: "Dirección completa" },
  { key: "municipality", label: "Municipio" },
  { key: "educationLevel", label: "Último grado de estudios" },
  { key: "bloodType", label: "Tipo de sangre" },
  { key: "allergies", label: "Alergias" },
  { key: "locker", label: "Locker" },
  { key: "shirtSize", label: "Talla de playera" },
  { key: "shoeSize", label: "Talla de zapatos" },
];

export const DATA_UPDATE_RAW_FIELDS = [
  "Numero Empleado",
  "Nombre",
  "Area",
  "Seccion",
  "Puesto",
  "Turno",
  "Fecha Ingreso",
  "Nombre Ruta",
  "Parada",
  "Ubicacion",
  "Fecha Nacimiento",
  "Lugar Nacimiento",
  "Edo Civil",
  "CURP",
  "RFC",
  "Numero Seguro Social",
  "Correo",
  "Telefono Movil",
  "Contacto Emergencia",
  "Telefono Emergencia",
  "Calle",
  "Direccion Completa",
  "Estado",
  "Ultimo Grado Estudios",
  "Tipo Sangre",
  "Alergias",
  "Locker",
] as const;

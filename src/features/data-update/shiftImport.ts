import type { DataUpdateRecord } from "./types";

export interface DataUpdateShiftChange {
  employeeNumber: string;
  employeeName: string;
  previousShift: string;
  shift: string;
  expectedVersion: number;
}

export interface DataUpdateShiftPreview {
  changes: DataUpdateShiftChange[];
  unchanged: number;
  errors: string[];
}

function fieldText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isSafeInteger(value)) return String(value);
  return "";
}

export function previewDataUpdateShifts(
  source: unknown,
  records: DataUpdateRecord[],
): DataUpdateShiftPreview {
  if (!Array.isArray(source) || source.length === 0) {
    return {
      changes: [],
      unchanged: 0,
      errors: ["El archivo debe contener un arreglo JSON de empleados."],
    };
  }

  const recordsByNumber = new Map(records.map((record) => [record.identity.employeeNumber, record]));
  const seen = new Set<string>();
  const preview: DataUpdateShiftPreview = { changes: [], unchanged: 0, errors: [] };

  source.forEach((value: unknown, index) => {
    const rowNumber = index + 1;
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      preview.errors.push(`Fila ${rowNumber}: debe ser un objeto.`);
      return;
    }

    const row = value as Record<string, unknown>;
    if (Object.keys(row).length !== 2 || !("Numero Empleado" in row) || !("Turno" in row)) {
      preview.errors.push(`Fila ${rowNumber}: usa solo "Numero Empleado" y "Turno".`);
      return;
    }

    const employeeNumber = fieldText(row["Numero Empleado"]);
    const shift = fieldText(row.Turno);
    if (!employeeNumber || !shift) {
      preview.errors.push(`Fila ${rowNumber}: número de empleado y turno son obligatorios.`);
      return;
    }
    if (seen.has(employeeNumber)) {
      preview.errors.push(`Fila ${rowNumber}: el número ${employeeNumber} está duplicado.`);
      return;
    }
    seen.add(employeeNumber);

    const record = recordsByNumber.get(employeeNumber);
    if (!record) {
      preview.errors.push(`Fila ${rowNumber}: el número ${employeeNumber} no existe en esta campaña.`);
      return;
    }
    if (record.identity.shift === shift) {
      preview.unchanged += 1;
      return;
    }

    preview.changes.push({
      employeeNumber,
      employeeName: record.identity.name,
      previousShift: record.identity.shift,
      shift,
      expectedVersion: record.version,
    });
  });

  return preview;
}

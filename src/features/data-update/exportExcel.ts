import { EDITABLE_FIELDS, IDENTITY_FIELDS } from "./constants";
import { downloadBlob, safeFileName } from "./download";
import type {
  DataUpdateAuditEntry,
  DataUpdateCampaignDetail,
  DataUpdateIncident,
} from "./types";

const EXCEL_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function photoFileName(value: string | null): string {
  return value?.split("/").pop() ?? "";
}

function addTable(
  worksheet: import("exceljs").Worksheet,
  name: string,
  headers: string[],
  rows: Array<Array<string | number>>,
) {
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.addTable({
    name,
    ref: "A1",
    headerRow: true,
    style: { theme: "TableStyleMedium2", showRowStripes: true },
    columns: headers.map((header) => ({ name: header, filterButton: true })),
    rows,
  });
  worksheet.columns = headers.map((header, columnIndex) => ({
    width: Math.min(
      44,
      Math.max(
        14,
        header.length + 2,
        ...rows.map((row) => String(row[columnIndex] ?? "").length + 2),
      ),
    ),
  }));
}

export async function exportDataUpdateCampaign(input: {
  detail: DataUpdateCampaignDetail;
  audit: DataUpdateAuditEntry[];
  incidents: DataUpdateIncident[];
}) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sistema de Reclutamiento";
  workbook.created = new Date();

  const summary = workbook.addWorksheet("Resumen");
  const completed = input.detail.records.filter((record) => record.status === "completado").length;
  addTable(
    summary,
    "ResumenCampana",
    ["Campaña", "Año", "Estado", "Colaboradores", "Completados", "Pendientes"],
    [[
      input.detail.campaign.name,
      input.detail.campaign.year,
      input.detail.campaign.status,
      input.detail.records.length,
      completed,
      input.detail.records.length - completed,
    ]],
  );

  const dataSheet = workbook.addWorksheet("Datos finales");
  const maximumChildren = input.detail.records.reduce(
    (maximum, record) => Math.max(maximum, record.data.childrenBirthDates.length),
    0,
  );
  const childBirthDateHeaders = Array.from(
    { length: maximumChildren },
    (_, index) => `Fecha de nacimiento del hijo ${index + 1}`,
  );
  const dataHeaders = [
    ...IDENTITY_FIELDS.map((field) => field.label),
    ...EDITABLE_FIELDS.map((field) => field.label),
    "Cantidad de hijos",
    ...childBirthDateHeaders,
    "Responsable",
    "Estado de revisión",
    "Revisión de identificación",
    "Fotografía",
    "Archivo de fotografía",
    "Fecha de finalización",
  ];
  const dataRows = input.detail.records.map((record) => [
    ...IDENTITY_FIELDS.map((field) => record.identity[field.key]),
    ...EDITABLE_FIELDS.map((field) => record.data[field.key]),
    record.data.childrenBirthDates.length,
    ...Array.from(
      { length: maximumChildren },
      (_, index) => record.data.childrenBirthDates[index] ?? "",
    ),
    record.assignedName ?? record.assignedTo,
    record.status,
    record.identityReview,
    record.photoPath ? "Capturada" : "Pendiente",
    photoFileName(record.photoPath),
    record.completedAt ?? "",
  ]);
  addTable(dataSheet, "DatosActualizados", dataHeaders, dataRows);

  const recordsById = new Map(input.detail.records.map((record) => [record.id, record]));
  const fieldLabels = new Map<string, string>([
    ...IDENTITY_FIELDS.map((field) => [field.key, field.label] as const),
    ...EDITABLE_FIELDS.map((field) => [
      field.key,
      field.key === "municipality" ? "Municipio (columna original: Estado)" : field.label,
    ] as const),
    ["childrenBirthDates", "Fechas de nacimiento de hijos"],
    ["status", "Estado de revisión"],
    ["identityReview", "Revisión de identificación"],
    ["assignedTo", "Responsable"],
    ["photoPath", "Fotografía"],
  ]);
  const logRows: Array<Array<string | number>> = [
    ...input.audit.map((entry) => {
      const record = recordsById.get(entry.recordId);
      return [
        "Cambio",
        record?.identity.employeeNumber ?? "",
        record?.identity.name ?? "",
        fieldLabels.get(entry.fieldName) ?? entry.fieldName,
        entry.fieldName === "photoPath" ? photoFileName(entry.previousValue) : entry.previousValue ?? "",
        entry.fieldName === "photoPath" ? photoFileName(entry.nextValue) : entry.nextValue ?? "",
        "",
        entry.changedByName ?? entry.changedBy,
        entry.createdAt,
      ];
    }),
    ...input.incidents.map((incident) => {
      const record = recordsById.get(incident.recordId);
      return [
        "Incidencia",
        record?.identity.employeeNumber ?? "",
        record?.identity.name ?? "",
        fieldLabels.get(incident.fieldName) ?? incident.fieldName,
        "",
        "",
        incident.note,
        incident.reportedByName ?? incident.reportedBy,
        incident.createdAt,
      ];
    }),
  ];
  logRows.sort((left, right) => String(left[8]).localeCompare(String(right[8])));
  const logSheet = workbook.addWorksheet("Bitácora");
  addTable(
    logSheet,
    "BitacoraActualizacion",
    ["Tipo", "Número de empleado", "Nombre", "Campo", "Valor anterior", "Valor nuevo", "Observación", "Responsable", "Fecha"],
    logRows,
  );

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([new Uint8Array(buffer)], { type: EXCEL_MIME_TYPE }),
    `${safeFileName(input.detail.campaign.name) || "actualizacion-datos"}-${input.detail.campaign.year}.xlsx`,
  );
}

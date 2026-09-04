import type {
  BonoAsistenciaEmployee,
  BonoAsistenciaRecord,
} from './data';

const EXCEL_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const DOWNLOAD_URL_LIFETIME_MS = 60_000;

interface BonoAsistenciaExportScope {
  week: string;
  department: string;
  searchTerm: string;
}

export interface BonoAsistenciaExportInput {
  records: BonoAsistenciaRecord[];
  employees: BonoAsistenciaEmployee[];
  scope: BonoAsistenciaExportScope;
}

function buildScopeDescription(
  employeeCount: number,
  scope: BonoAsistenciaExportScope,
): string {
  const parts = [
    `${employeeCount} ${employeeCount === 1 ? 'empleado' : 'empleados'}`,
    scope.week,
    scope.department,
  ];

  if (scope.searchTerm.trim()) {
    parts.push(`Búsqueda: ${scope.searchTerm.trim()}`);
  }

  return parts.join(' · ');
}

function configureWorksheet(
  worksheet: import('exceljs').Worksheet,
  columnWidths: readonly number[],
) {
  worksheet.views = [
    {
      state: 'frozen',
      ySplit: 4,
      activeCell: 'A5',
      showGridLines: false,
    },
  ];
  worksheet.properties.defaultRowHeight = 18;
  worksheet.columns = columnWidths.map((width) => ({ width }));
  worksheet.getRow(1).height = 24;
  worksheet.getRow(1).font = { bold: true, size: 16 };
  worksheet.getRow(2).font = { italic: true };
  worksheet.getRow(4).height = 22;
}

function addSummaryWorksheet(
  workbook: import('exceljs').Workbook,
  input: BonoAsistenciaExportInput,
) {
  const worksheet = workbook.addWorksheet('Resumen');
  configureWorksheet(worksheet, [14, 36, 22, 28, 32, 12, 14, 30]);

  worksheet.getCell('A1').value = 'Bono de asistencia';
  worksheet.getCell('A2').value = buildScopeDescription(
    input.employees.length,
    input.scope,
  );

  worksheet.addTable({
    name: 'ResumenBonoAsistencia',
    ref: 'A4',
    headerRow: true,
    totalsRow: false,
    style: {
      theme: 'TableStyleMedium2',
      showRowStripes: true,
      showColumnStripes: false,
    },
    columns: [
      { name: 'Empleado', filterButton: true },
      { name: 'Nombre', filterButton: true },
      { name: 'Departamento', filterButton: true },
      { name: 'Área', filterButton: true },
      { name: 'Puesto', filterButton: true },
      { name: 'Registros', filterButton: true },
      { name: 'Estado', filterButton: true },
      { name: 'Semanas', filterButton: true },
    ],
    rows: input.employees.map((employee) => [
      employee.employeeNumber,
      employee.name,
      employee.department,
      employee.area,
      employee.position,
      employee.occurrences,
      employee.isBaja ? 'Baja' : '',
      employee.weeks.join('\n'),
    ]),
  });

  worksheet.getColumn(6).numFmt = '#,##0';
  worksheet.getColumn(6).alignment = { horizontal: 'right' };
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    if (row.number > 4) {
      row.alignment = { vertical: 'top', wrapText: true };
    }
  });
}

function addDetailWorksheet(
  workbook: import('exceljs').Workbook,
  input: BonoAsistenciaExportInput,
) {
  const worksheet = workbook.addWorksheet('Detalle');
  configureWorksheet(worksheet, [14, 36, 22, 28, 32, 24, 14]);

  worksheet.getCell('A1').value = 'Detalle por semana';
  worksheet.getCell('A2').value = buildScopeDescription(
    input.employees.length,
    input.scope,
  );

  worksheet.addTable({
    name: 'DetalleBonoAsistencia',
    ref: 'A4',
    headerRow: true,
    totalsRow: false,
    style: {
      theme: 'TableStyleMedium2',
      showRowStripes: true,
      showColumnStripes: false,
    },
    columns: [
      { name: 'Empleado', filterButton: true },
      { name: 'Nombre', filterButton: true },
      { name: 'Departamento', filterButton: true },
      { name: 'Área', filterButton: true },
      { name: 'Puesto', filterButton: true },
      { name: 'Semana', filterButton: true },
      { name: 'Estado', filterButton: true },
    ],
    rows: input.records.map((record) => [
      record.employeeNumber,
      record.name,
      record.department,
      record.area,
      record.position,
      record.week,
      record.comments.toLocaleUpperCase('es-MX') === 'BAJA' ? 'Baja' : '',
    ]),
  });

  worksheet.eachRow({ includeEmpty: false }, (row) => {
    if (row.number > 4) {
      row.alignment = { vertical: 'top', wrapText: true };
    }
  });
}

export async function buildBonoAsistenciaWorkbook(
  input: BonoAsistenciaExportInput,
) {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const createdAt = new Date();

  workbook.creator = 'Sistema de Reclutamiento';
  workbook.created = createdAt;
  workbook.modified = createdAt;
  workbook.title = 'Bono de asistencia';
  workbook.subject = 'Histórico de pérdida de bono de asistencia';

  addSummaryWorksheet(workbook, input);
  addDetailWorksheet(workbook, input);

  return workbook;
}

function createFileDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), DOWNLOAD_URL_LIFETIME_MS);
}

export async function downloadBonoAsistenciaExcel(
  input: BonoAsistenciaExportInput,
): Promise<void> {
  const workbook = await buildBonoAsistenciaWorkbook(input);
  const buffer = await workbook.xlsx.writeBuffer();
  const bytes = new Uint8Array(buffer);
  const file = new Blob([bytes], { type: EXCEL_MIME_TYPE });

  downloadBlob(file, `bono-asistencia-${createFileDate(new Date())}.xlsx`);
}

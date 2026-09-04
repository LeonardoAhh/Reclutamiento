export interface BonoAsistenciaRecord {
  employeeNumber: string;
  name: string;
  department: string;
  area: string;
  position: string;
  week: string;
  comments: string;
}

export interface BonoAsistenciaEmployee {
  employeeNumber: string;
  name: string;
  department: string;
  area: string;
  position: string;
  occurrences: number;
  weeks: string[];
  isBaja: boolean;
}

const BONO_DATA_URL = '/bono-asistencia/empleados.json';

const SPANISH_MONTH_INDEX: Readonly<Record<string, number>> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
};

type BonoAsistenciaJsonRecord = {
  'No.': unknown;
  Nombre: unknown;
  Departamento: unknown;
  'Área': unknown;
  Puesto: unknown;
  Semana: unknown;
  Comentarios: unknown;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getWeekEndSortValue(week: string): number | null {
  const match = week.trim().match(/(\d{1,2})\s+([\p{L}]+)$/u);
  if (!match) return null;

  const day = Number(match[1]);
  const monthName = match[2]
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-MX');
  const monthIndex = SPANISH_MONTH_INDEX[monthName];

  if (!Number.isInteger(day) || day < 1 || day > 31 || monthIndex === undefined) {
    return null;
  }

  return monthIndex * 31 + day;
}

export function compareBonoWeeksNewestFirst(
  left: string,
  right: string,
): number {
  const leftValue = getWeekEndSortValue(left);
  const rightValue = getWeekEndSortValue(right);

  if (leftValue === null && rightValue === null) return 0;
  if (leftValue === null) return 1;
  if (rightValue === null) return -1;
  return rightValue - leftValue;
}

function readRequiredString(
  record: Record<string, unknown>,
  field: keyof BonoAsistenciaJsonRecord,
): string {
  const value = record[field];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`El campo ${field} no contiene texto válido.`);
  }
  return value.trim();
}

function readOptionalString(
  record: Record<string, unknown>,
  field: keyof BonoAsistenciaJsonRecord,
): string {
  const value = record[field];
  if (typeof value !== 'string') {
    throw new Error(`El campo ${field} no contiene texto válido.`);
  }
  return value.trim();
}

export function parseBonoAsistenciaData(
  value: unknown,
): BonoAsistenciaRecord[] {
  if (!Array.isArray(value)) {
    throw new Error('El archivo de bono debe contener una lista de personas.');
  }

  return value.map((item, index) => {
    if (!isObject(item)) {
      throw new Error(`El registro ${index + 1} no tiene un formato válido.`);
    }

    return {
      employeeNumber: readRequiredString(item, 'No.'),
      name: readRequiredString(item, 'Nombre'),
      department: readRequiredString(item, 'Departamento'),
      area: readRequiredString(item, 'Área'),
      position: readRequiredString(item, 'Puesto'),
      week: readRequiredString(item, 'Semana'),
      comments: readOptionalString(item, 'Comentarios'),
    };
  });
}

export function groupBonoAsistenciaRecords(
  records: BonoAsistenciaRecord[],
): BonoAsistenciaEmployee[] {
  const employees = new Map<string, BonoAsistenciaEmployee>();
  const recordsByRecency = [...records].sort((left, right) =>
    compareBonoWeeksNewestFirst(left.week, right.week),
  );

  recordsByRecency.forEach((record) => {
    const current = employees.get(record.employeeNumber);
    const isBaja = record.comments.toLocaleUpperCase('es-MX') === 'BAJA';

    if (current) {
      current.occurrences += 1;
      if (!current.weeks.includes(record.week)) current.weeks.push(record.week);
      current.isBaja = current.isBaja || isBaja;
      return;
    }

    employees.set(record.employeeNumber, {
      employeeNumber: record.employeeNumber,
      name: record.name,
      department: record.department,
      area: record.area,
      position: record.position,
      occurrences: 1,
      weeks: [record.week],
      isBaja,
    });
  });

  return Array.from(employees.values());
}

export async function loadBonoAsistenciaData(
  signal?: AbortSignal,
): Promise<BonoAsistenciaRecord[]> {
  const response = await fetch(BONO_DATA_URL, {
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('No fue posible consultar el archivo del bono.');
  }

  const payload: unknown = await response.json();
  return parseBonoAsistenciaData(payload);
}

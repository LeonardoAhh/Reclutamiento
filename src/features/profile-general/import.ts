import type { EditableCriterion } from './types';

type ImportedRow = Record<string, unknown>;

const METADATA_LABELS = new Set([
  'NO DE EMPLEADO',
  'NUM EMPLEADO',
  'NOMBRE',
  'FECHA DE INGRESO',
  'RECLUTADOR',
  'RECLUTADORA',
  '% DE CUMPLIMIENTO',
  'COMENTARIOS',
  'FECHA DE BAJA',
  'MOTIVO DE BAJA',
]);

const clean = (value: unknown) => String(value ?? '').trim().replace(/\s+/g, ' ');
const canonical = (value: string) => value.toLocaleUpperCase('es-MX');
const canonicalField = (value: string) => canonical(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^A-Z0-9]+/g, '_')
  .replace(/^_|_$/g, '');

function rowField(row: ImportedRow, field: string): unknown {
  const entry = Object.entries(row).find(([key]) => canonicalField(key) === field);
  return entry?.[1];
}

function parseScorable(value: unknown, rowNumber: number): boolean {
  if (value === undefined || value === null || clean(value) === '') return true;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number' && (value === 0 || value === 1)) return value === 1;
  const normalized = canonical(clean(value));
  if (['TRUE', 'VERDADERO', 'SI', 'SÍ', '1'].includes(normalized)) return true;
  if (['FALSE', 'FALSO', 'NO', '0'].includes(normalized)) return false;
  throw new Error(`El valor "evaluable" de la fila ${rowNumber} debe ser verdadero o falso.`);
}

function parseWeightBps(value: unknown, rowNumber: number): number {
  if (value === undefined || value === null || clean(value) === '') return 0;
  const normalized = typeof value === 'number'
    ? value
    : Number(clean(value).replace('%', '').replace(',', '.'));
  if (!Number.isFinite(normalized) || normalized < 0 || normalized > 100) {
    throw new Error(`El peso de la fila ${rowNumber} debe estar entre 0 y 100.`);
  }
  return Math.round(normalized * 100);
}

function parseDelimitedLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && line[index + 1] === '"' && quoted) {
      current += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === delimiter && !quoted) {
      cells.push(current.trim());
      current = '';
    } else {
      current += character;
    }
  }
  cells.push(current.trim());
  return cells;
}

function parseCsv(text: string): ImportedRow[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) {
    throw new Error('El contenido necesita una fila de encabezados y al menos un criterio.');
  }
  const delimiter = ['\t', ';', ',']
    .map((candidate) => ({
      candidate,
      columns: parseDelimitedLine(lines[0], candidate).length,
    }))
    .sort((left, right) => right.columns - left.columns)[0];
  if (delimiter.columns < 2) {
    throw new Error('Separa las columnas con tabulación, coma o punto y coma.');
  }
  const headers = parseDelimitedLine(lines[0], delimiter.candidate);
  return lines.slice(1).map((line) => {
    const cells = parseDelimitedLine(line, delimiter.candidate);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']));
  });
}

function isImportedRow(value: unknown): value is ImportedRow {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseProfileImport(text: string, fileName: string): ImportedRow[] {
  if (fileName.toLocaleLowerCase('es-MX').endsWith('.csv')) return parseCsv(text);
  const parsed: unknown = JSON.parse(text);
  if (!Array.isArray(parsed) || !parsed.every(isImportedRow)) {
    throw new Error('El JSON debe contener una lista de filas.');
  }
  if (parsed.length === 0) throw new Error('El archivo no contiene filas.');
  return parsed;
}

export function criteriaFromImportedRows(rows: ImportedRow[]): EditableCriterion[] {
  const firstRow = rows[0];
  const isStructured = rowField(firstRow, 'CRITERIO') !== undefined;

  if (isStructured) {
    return rows.map((row, index) => {
      const rowNumber = index + 1;
      const description = clean(rowField(row, 'CRITERIO'));
      if (!description) throw new Error(`Falta el criterio en la fila ${rowNumber}.`);
      const isScorable = parseScorable(rowField(row, 'EVALUABLE'), rowNumber);
      const weightBps = parseWeightBps(rowField(row, 'PESO'), rowNumber);
      if (!isScorable && weightBps !== 0) {
        throw new Error(`El criterio informativo de la fila ${rowNumber} debe tener peso 0.`);
      }
      return {
        key: crypto.randomUUID(),
        category: clean(rowField(row, 'CATEGORIA')) || 'General',
        description,
        weightBps,
        isScorable,
      };
    });
  }

  const extractCandidates = (candidates: unknown[]) => {
    const seen = new Set<string>();
    return candidates.map(clean).filter((value) => {
      const normalized = canonical(value);
      if (!value || seen.has(normalized) || METADATA_LABELS.has(normalized)) return false;
      if (['VERDADERO', 'FALSO'].includes(normalized) || /^\d+(?:\.\d+)?%$/.test(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  };
  // Los Excel desplazados traen los criterios en los valores de la primera
  // fila. Si esa fila sólo contiene resultados, usamos sus encabezados.
  const values = extractCandidates(Object.values(firstRow));
  const descriptions = values.length > 0 ? values : extractCandidates(Object.keys(firstRow));

  return descriptions.map((description) => ({
    key: crypto.randomUUID(),
    category: 'General',
    description,
    weightBps: 0,
    isScorable: true,
  }));
}

export function distributeCriteriaWeights(criteria: EditableCriterion[]): EditableCriterion[] {
  const scorable = criteria.filter((criterion) => criterion.isScorable);
  if (scorable.length === 0) return criteria;
  const base = Math.floor(10000 / scorable.length);
  let remainder = 10000 - base * scorable.length;
  return criteria.map((criterion) => {
    if (!criterion.isScorable) return { ...criterion, weightBps: 0 };
    const extra = remainder > 0 ? 1 : 0;
    remainder -= extra;
    return { ...criterion, weightBps: base + extra };
  });
}

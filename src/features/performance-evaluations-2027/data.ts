import sourceData from './data.json';
import type { EvaluationProgramData, EvaluationStatus } from './types';

const EVALUATION_STATUSES: readonly EvaluationStatus[] = [
  'Pendiente',
  'En proceso',
  'Entregado',
  'Revisado',
];

function isEvaluationStatus(value: string): value is EvaluationStatus {
  return EVALUATION_STATUSES.some((status) => status === value);
}

function readStatus(value: string, areaId: string): EvaluationStatus {
  if (!isEvaluationStatus(value)) {
    throw new Error(`Estado no reconocido en el seguimiento "${areaId}".`);
  }

  return value;
}

function readPositions(
  positions: (typeof sourceData.areas)[number]['positions'],
  areaId: string,
) {
  if (positions.length === 0) {
    throw new Error(`El área "${areaId}" debe incluir al menos un puesto.`);
  }

  return positions.map((position) => ({
    ...position,
    status: readStatus(position.status, `${areaId}/${position.id}`),
  }));
}

export const evaluationProgram: EvaluationProgramData = {
  ...sourceData,
  areas: sourceData.areas.map((area) => ({
    ...area,
    status: readStatus(area.status, area.id),
    positions: readPositions(area.positions, area.id),
  })),
};

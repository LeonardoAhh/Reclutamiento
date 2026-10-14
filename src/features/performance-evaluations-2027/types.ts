export const PERFORMANCE_EVALUATIONS_2027_PATH = '/performance-evaluations-2027';

export type EvaluationStatus =
  | 'Pendiente'
  | 'En proceso'
  | 'Entregado'
  | 'Revisado';

export interface EvaluationPosition {
  id: string;
  title: string;
  status: EvaluationStatus;
  category?: string;
}

export interface EvaluationArea {
  id: string;
  name: string;
  responsibleName: string;
  responsibleTitle: string;
  status: EvaluationStatus;
  positions: EvaluationPosition[];
}

export interface EvaluationProgramData {
  startDate: string;
  deadline: string;
  periods: {
    first: Record<'es' | 'en', string>;
    second: Record<'es' | 'en', string>;
  };
  areas: EvaluationArea[];
}

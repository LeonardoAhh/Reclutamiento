import type { Language } from '@/contexts/LanguageContext';
import type { EvaluationStatus } from './types';

const COPY = {
  es: {
    title: 'Seguimiento de Evaluaciones 2027',
    chartTitle: 'Avance del seguimiento',
    copyEmail: 'Copiar mensaje para correo',
    emailCopied: 'Mensaje para correo copiado',
    emailCopyError: 'No se pudo copiar el mensaje',
    emailGreeting: 'Buen día, líderes de área:',
    emailIntroduction: 'Comparto el avance del seguimiento de las Evaluaciones de Desempeño 2027.',
    elapsedTime: 'Tiempo transcurrido',
    generalCompliance: 'Cumplimiento general',
    startDate: 'Inicio',
    deadline: 'Fecha límite',
    day: 'día',
    days: 'días',
    positionCompleted: 'puesto completado',
    positionsCompleted: 'puestos completados',
    of: 'de',
    areas: 'Seguimiento por área',
    responsible: 'Responsable',
    status: 'Estado',
    progress: 'Avance',
    areaNavigation: 'Navegación de áreas',
    previousArea: 'Área anterior',
    nextArea: 'Área siguiente',
    positions: 'Puestos del personal evaluado',
    position: 'Puesto',
    category: 'Categoría',
    completed: 'Completado',
    pending: 'Pendiente',
    statusLabels: {
      Pendiente: 'Pendiente',
      'En proceso': 'En proceso',
      Entregado: 'Entregado',
      Revisado: 'Revisado',
    },
  },
  en: {
    title: '2027 Performance Evaluation Tracking',
    chartTitle: 'Tracking progress',
    copyEmail: 'Copy email message',
    emailCopied: 'Email message copied',
    emailCopyError: 'Could not copy the message',
    emailGreeting: 'Hello, area leaders:',
    emailIntroduction: 'I am sharing the current progress of the 2027 Performance Evaluations.',
    elapsedTime: 'Time elapsed',
    generalCompliance: 'Overall completion',
    startDate: 'Start date',
    deadline: 'Deadline',
    day: 'day',
    days: 'days',
    positionCompleted: 'position completed',
    positionsCompleted: 'positions completed',
    of: 'of',
    areas: 'Area tracking',
    responsible: 'Responsible manager',
    status: 'Status',
    progress: 'Progress',
    areaNavigation: 'Area navigation',
    previousArea: 'Previous area',
    nextArea: 'Next area',
    positions: 'Positions included in the evaluation',
    position: 'Position',
    category: 'Category',
    completed: 'Completed',
    pending: 'Pending',
    statusLabels: {
      Pendiente: 'Pending',
      'En proceso': 'In progress',
      Entregado: 'Submitted',
      Revisado: 'Reviewed',
    },
  },
} as const;

export function getEvaluationCopy(language: Language) {
  return COPY[language];
}

export function getEvaluationStatusLabel(
  status: EvaluationStatus,
  language: Language,
) {
  return COPY[language].statusLabels[status];
}

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { Modal } from './Modal';
import { businessDaysBetween } from '@/lib/dates';
import type { VacancyRequest } from '@/lib/types';
import './TtfHistoryModal.css';

interface TtfHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  vacancies: VacancyRequest[];
}

interface MonthlyTtf {
  month: string;
  year: number;
  ttfAvg: number;
  count: number;
  vacancies: Array<{
    puesto: string;
    area: string;
    dias: number;
    fecha_apertura: string;
    fecha_cubierta: string;
  }>;
}

function getMonthName(month: number): string {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[month - 1] || '';
}

export function TtfHistoryModal({ isOpen, onClose, vacancies }: TtfHistoryModalProps) {
  const monthlyData = useMemo(() => {
    // Agrupar vacantes cubiertas por mes
    const grouped = new Map<string, MonthlyTtf>();

    const cubiertasConFechas = vacancies.filter(
      (v) =>
        v.status === 'cubierta' &&
        v.fecha_apertura &&
        v.fecha_cubierta &&
        !v.excluida_indicador
    );

    cubiertasConFechas.forEach((v) => {
      const fechaCubierta = new Date(v.fecha_cubierta!);
      const year = fechaCubierta.getFullYear();
      const month = fechaCubierta.getMonth() + 1; // 1-12
      const key = `${year}-${String(month).padStart(2, '0')}`;

      const dias = businessDaysBetween(v.fecha_apertura!, v.fecha_cubierta!);

      if (!grouped.has(key)) {
        grouped.set(key, {
          month: getMonthName(month),
          year,
          ttfAvg: 0,
          count: 0,
          vacancies: [],
        });
      }

      const entry = grouped.get(key)!;
      entry.vacancies.push({
        puesto: v.puesto || 'Sin puesto',
        area: v.area || 'Sin área',
        dias,
        fecha_apertura: v.fecha_apertura!,
        fecha_cubierta: v.fecha_cubierta!,
      });
    });

    // Calcular promedios
    grouped.forEach((entry) => {
      const sum = entry.vacancies.reduce((acc, v) => acc + v.dias, 0);
      entry.count = entry.vacancies.length;
      entry.ttfAvg = entry.count > 0 ? Math.round(sum / entry.count) : 0;
    });

    // Ordenar por año y mes descendente (más reciente primero)
    return Array.from(grouped.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([_, data]) => data);
  }, [vacancies]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Histórico TTF (Días Hábiles)"
      icon={<BarChart3 size={20} />}
      className="ttf-history-modal"
      labelledById="ttf-history-title"
    >
      <div className="modal-body ttf-history-modal__body">
        <div className="ttf-history-modal__content">
          {monthlyData.length === 0 ? (
            <div className="ttf-history-modal__empty">
              <p>No hay vacantes cubiertas con fechas registradas</p>
            </div>
          ) : (
            <div className="ttf-history-modal__list">
              {monthlyData.map((data, index) => {
                const prevAvg = index < monthlyData.length - 1 ? monthlyData[index + 1].ttfAvg : data.ttfAvg;
                const diff = data.ttfAvg - prevAvg;
                const trend = diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral';

                return (
                  <details key={`${data.year}-${data.month}`} className="ttf-history-modal__month">
                    <summary className="ttf-history-modal__month-summary">
                      <div className="ttf-history-modal__month-header">
                        <h3 className="ttf-history-modal__month-title">
                          {data.month} {data.year}
                        </h3>
                        <div className="ttf-history-modal__month-meta">
                          <span className="ttf-history-modal__month-count">
                            {data.count} {data.count === 1 ? 'vacante' : 'vacantes'}
                          </span>
                        </div>
                      </div>
                      <div className="ttf-history-modal__month-stats">
                        <div className="ttf-history-modal__month-avg">
                          {data.ttfAvg} días
                        </div>
                        {index < monthlyData.length - 1 && (
                          <div className={`ttf-history-modal__month-trend ttf-history-modal__month-trend--${trend}`}>
                            {trend === 'up' && <TrendingUp size={14} aria-hidden="true" />}
                            {trend === 'down' && <TrendingDown size={14} aria-hidden="true" />}
                            {trend === 'neutral' && <Minus size={14} aria-hidden="true" />}
                            <span>{diff > 0 ? '+' : ''}{diff}</span>
                          </div>
                        )}
                      </div>
                    </summary>

                    <div className="ttf-history-modal__month-details">
                      <table className="ttf-history-modal__table">
                        <thead>
                          <tr>
                            <th>Puesto</th>
                            <th>Área</th>
                            <th>Días hábiles</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.vacancies
                            .sort((a, b) => b.dias - a.dias)
                            .map((v, idx) => (
                              <tr key={idx}>
                                <td>{v.puesto}</td>
                                <td>{v.area}</td>
                                <td className="ttf-history-modal__table-dias">{v.dias}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

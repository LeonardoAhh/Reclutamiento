import React, { useMemo } from 'react';
import { Activity } from 'lucide-react';
import { CartesianGrid, Line, LineChart, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import type { NoCitado } from '@/lib/types';

interface NoCitadosChartProps {
  data: NoCitado[];
}

const COLORS = [
  'var(--color-accent-purple)',
  'var(--color-accent-sky)',
  'var(--color-accent-pink)',
  'var(--color-accent-teal)',
  'var(--color-accent-orange)',
  'var(--color-accent-green)',
];

export function NoCitadosChart({ data }: NoCitadosChartProps) {
  const chartData = useMemo(() => {
    // 1. Sort records by date ascending
    const sortedData = [...data].sort((a, b) => a.fecha.localeCompare(b.fecha));
    
    // 2. Group by date and count per recruiter
    const grouped = sortedData.reduce((acc, curr) => {
      const date = curr.fecha;
      const rec = curr.reclutador;
      if (!acc[date]) {
        acc[date] = { date };
      }
      if (!acc[date][rec]) {
        acc[date][rec] = 0;
      }
      acc[date][rec] += 1;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped);
  }, [data]);

  const activeRecruiters = useMemo(() => {
    const recruiters = new Set<string>();
    data.forEach(r => recruiters.add(r.reclutador));
    return Array.from(recruiters).sort();
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="no-citados-chart-card">
        <div className="no-citados-chart-header">
          <div className="no-citados-chart-title-group">
            <h4 className="no-citados-chart-title">Tendencia de No Citados</h4>
            <p className="no-citados-chart-description">
              Total de registros en el periodo: 0
            </p>
          </div>
        </div>
        <div className="no-citados-chart-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '250px' }}>
          <div className="animated-empty-state">
            <div className="animated-empty-state__icon">
              <Activity aria-hidden="true" />
            </div>
            <div className="animated-empty-state__title">Aún no hay registros en este periodo</div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate totals for the header
  const total = data.length;

  return (
    <div className="no-citados-chart-card">
      <div className="no-citados-chart-header">
        <div className="no-citados-chart-title-group">
          <h4 className="no-citados-chart-title">Tendencia de No Citados</h4>
          <p className="no-citados-chart-description">
            Total de registros en el periodo: {total}
          </p>
        </div>
        <div className="no-citados-chart-legend">
          {activeRecruiters.map((rec, index) => (
            <div key={rec} className="no-citados-chart-legend-item">
              <span 
                className="no-citados-chart-legend-color" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="no-citados-chart-legend-label">
                {rec.charAt(0).toUpperCase() + rec.slice(1).toLowerCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="no-citados-chart-content">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart
            data={chartData}
            margin={{ top: 12, left: 12, right: 12, bottom: 12 }}
          >
            <CartesianGrid vertical={false} stroke="var(--color-hairline)" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tick={{ fontSize: 12, fill: 'var(--color-muted)' }}
              tickFormatter={(value) => {
                const date = new Date(value + 'T00:00:00'); // Force local time
                return date.toLocaleDateString("es-MX", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <RechartsTooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const date = new Date(label + 'T00:00:00');
                  return (
                    <div className="no-citados-chart-tooltip popover-content">
                      <div className="no-citados-chart-tooltip-date">
                        {date.toLocaleDateString("es-MX", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <div className="no-citados-chart-tooltip-items">
                        {payload.map((entry: any, index: number) => (
                          <div key={index} className="no-citados-chart-tooltip-item">
                            <span 
                              className="no-citados-chart-tooltip-indicator" 
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="no-citados-chart-tooltip-name">
                              {entry.name.charAt(0).toUpperCase() + entry.name.slice(1).toLowerCase()}
                            </span>
                            <span className="no-citados-chart-tooltip-value">
                              {entry.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {activeRecruiters.map((rec, index) => (
              <Line
                key={rec}
                type="monotone"
                dataKey={rec}
                name={rec}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 1.5, fill: 'var(--color-surface)' }}
                activeDot={{ r: 5, strokeWidth: 0, fill: COLORS[index % COLORS.length] }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

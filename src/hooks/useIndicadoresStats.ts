import { useState, useEffect, useMemo } from 'react';
import { getISOWeek } from 'date-fns';
import { supabase } from '@/lib/supabase';

export interface IndicadorRecord {
  "No.": string;
  "Nombre": string;
  "Puesto": string;
  "Turno": string;
  "Fecha Ingreso": string;
  "Ruta": string;
  "Parada": string;
  "Ubicacion": string;
  "Fuente de Reclutamiento": string;
  "Reclutador": string;
  "Fecha Baja"?: string;
}

export const RECRUITER_TONES = 5;

export function getRecruiterTone(index: number) {
  return `data-tone-${index % RECRUITER_TONES}`;
}

export function parseDate(dateStr: string) {
  if (!dateStr) return new Date(0);
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  }
  const dashParts = dateStr.split('-');
  if (dashParts.length === 3 && dashParts[0].length === 4) {
    const [year, month, day] = dashParts;
    // Evita bug de timezone al parsear YYYY-MM-DD
    return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day.substring(0,2), 10));
  }
  return new Date(dateStr);
}

export function useIndicadoresStats(selectedMonth: Date) {
  const [data, setData] = useState<IndicadorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    
    async function fetchSupabaseData() {
      try {
        const [empleadosRes, bajasRes] = await Promise.all([
          supabase.from('empleados').select('*').gte('fecha_ingreso', '2026-01-01'),
          supabase.from('bajas').select('*').gte('fecha_ingreso', '2026-01-01')
        ]);

        if (empleadosRes.error) throw empleadosRes.error;
        if (bajasRes.error) throw bajasRes.error;

        const combined: IndicadorRecord[] = [];

        empleadosRes.data?.forEach(e => {
          combined.push({
            "No.": e.num_empleado || '',
            "Nombre": e.nombre || '',
            "Puesto": e.puesto || '',
            "Turno": e.turno || '',
            "Fecha Ingreso": e.fecha_ingreso || '',
            "Ruta": e.ruta || '',
            "Parada": e.parada || '',
            "Ubicacion": '',
            "Fuente de Reclutamiento": '',
            "Reclutador": e.reclutador || 'Sin Reclutador',
            "Fecha Baja": undefined
          });
        });

        bajasRes.data?.forEach(b => {
          combined.push({
            "No.": b.num_empleado || '',
            "Nombre": b.nombre || '',
            "Puesto": b.puesto || '',
            "Turno": b.turno || '',
            "Fecha Ingreso": b.fecha_ingreso || '',
            "Ruta": '',
            "Parada": '',
            "Ubicacion": '',
            "Fuente de Reclutamiento": '',
            "Reclutador": b.reclutador || 'Sin Reclutador',
            "Fecha Baja": b.fecha_baja || undefined
          });
        });

        if (isMounted) {
          setData(combined);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching Supabase indicadores:', err);
          setError('No se pudieron cargar los datos de indicadores.');
          setLoading(false);
        }
      }
    }

    fetchSupabaseData();
    return () => { isMounted = false; };
  }, []);

  const { chartData, recruiters, tableData, kpi } = useMemo(() => {
    if (!data || data.length === 0) {
      return { chartData: [] as any[], recruiters: [] as string[], tableData: [] as any[], kpi: null };
    }

    const groupedByDate: Record<string, Record<string, number>> = {};
    const recruiterSet = new Set<string>();
    
    let totalBajasMes = 0;
    let totalDiasPermanenciaMes = 0;
    let bajasCountMes = 0;
    let prevMonthTotalIngresos = 0;

    const prevMonthDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1);
    const recruiterStats: Record<string, { totalIngresos: number; totalBajas: number; totalDiasPermanencia: number }> = {};
    
    const bajasList: { numEmpleado: string; nombre: string; reclutador: string; fechaIngreso: string; fechaBaja: string; dias: number }[] = [];

    data.forEach(record => {
      const date = record["Fecha Ingreso"] || 'Sin Fecha';
      const parsed = parseDate(date);
      
      const isCurrentMonth = parsed.getMonth() === selectedMonth.getMonth() && parsed.getFullYear() === selectedMonth.getFullYear();
      const isPrevMonth = parsed.getMonth() === prevMonthDate.getMonth() && parsed.getFullYear() === prevMonthDate.getFullYear();

      if (!isCurrentMonth && !isPrevMonth) {
        return;
      }

      if (isPrevMonth) {
        prevMonthTotalIngresos += 1;
        return;
      }

      let rawRecruiter = record["Reclutador"] ? record["Reclutador"].replace(/\s+/g, ' ').trim() : 'Sin Reclutador';
      let recruiter = rawRecruiter === 'Sin Reclutador' ? rawRecruiter : rawRecruiter.split(' ')[0];

      if (recruiter !== 'Sin Reclutador') {
        recruiter = recruiter.charAt(0).toUpperCase() + recruiter.slice(1).toLowerCase();
        if (recruiter === 'Nayeli') {
          recruiter = 'Alexandra';
        }
      }

      if (recruiter === 'Thalia' || recruiter === 'Leonardo') {
        return;
      }

      recruiterSet.add(recruiter);

      if (!groupedByDate[date]) groupedByDate[date] = {};
      if (!groupedByDate[date][recruiter]) groupedByDate[date][recruiter] = 0;
      groupedByDate[date][recruiter] += 1;
      
      if (!recruiterStats[recruiter]) {
        recruiterStats[recruiter] = { totalIngresos: 0, totalBajas: 0, totalDiasPermanencia: 0 };
      }
      recruiterStats[recruiter].totalIngresos += 1;

      const rawFechaBaja = record["Fecha Baja"]?.trim();
      if (rawFechaBaja && rawFechaBaja !== '-' && rawFechaBaja.toLowerCase() !== 'sin fecha') {
        const fechaBaja = parseDate(rawFechaBaja);
        if (!isNaN(fechaBaja.getTime()) && !isNaN(parsed.getTime())) {
          const msDiff = fechaBaja.getTime() - parsed.getTime();
          const diasPermanencia = Math.max(0, Math.floor(msDiff / (1000 * 60 * 60 * 24)));
          
          recruiterStats[recruiter].totalBajas += 1;
          recruiterStats[recruiter].totalDiasPermanencia += diasPermanencia;
          
          totalBajasMes += 1;
          totalDiasPermanenciaMes += diasPermanencia;
          bajasCountMes += 1;
          
          bajasList.push({
            numEmpleado: record["No."] || '',
            nombre: record["Nombre"] || 'Sin Nombre',
            reclutador: recruiter,
            fechaIngreso: date,
            fechaBaja: rawFechaBaja,
            dias: diasPermanencia
          });
        }
      }
    });

    const recruiterList = Array.from(recruiterSet).sort();

    const formattedData = Object.entries(groupedByDate).map(([date, counts]) => {
      let total = 0;
      recruiterList.forEach(rec => { total += counts[rec] || 0; });
      return { date, parsedDate: parseDate(date), total, ...counts } as any;
    });

    formattedData.sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

    const isBeforeJune2026 = selectedMonth.getFullYear() < 2026 || (selectedMonth.getFullYear() === 2026 && selectedMonth.getMonth() < 5);
    const metaMensual = isBeforeJune2026 ? 13 : 28;
    const metaSemanal = isBeforeJune2026 ? null : 7;

    const totalIngresos = formattedData.reduce((acc, row) => acc + row.total, 0);
    const promedio = formattedData.length ? Math.round((totalIngresos / formattedData.length) * 10) / 10 : 0;
    const recruiterTotals = recruiterList.map(rec => ({
      name: rec,
      total: formattedData.reduce((acc, row) => acc + (row[rec] || 0), 0),
      tone: getRecruiterTone(recruiterList.indexOf(rec))
    }));
    const highestRecruiterTotal = recruiterTotals.length
      ? Math.max(...recruiterTotals.map((recruiter) => recruiter.total))
      : 0;
    const topRecruiters = recruiterTotals.filter(
      (recruiter) => recruiter.total === highestRecruiterTotal,
    );
    const reclutadoresEnMeta = recruiterTotals.filter(r => r.total >= metaMensual).length;
    const promedioPermanenciaGlobal = bajasCountMes > 0 ? Math.round(totalDiasPermanenciaMes / bajasCountMes) : 0;

    const groupedByWeek: Record<string, any> = {};
    formattedData.forEach(row => {
      if (row.date === 'Sin Fecha') return;
      const weekNum = getISOWeek(row.parsedDate);
      const weekKey = `Semana ${weekNum}`;
      if (!groupedByWeek[weekKey]) {
        groupedByWeek[weekKey] = { date: weekKey, parsedDate: row.parsedDate, total: 0 };
      }
      groupedByWeek[weekKey].total += row.total;
      recruiterList.forEach(rec => {
        if (!groupedByWeek[weekKey][rec]) groupedByWeek[weekKey][rec] = 0;
        groupedByWeek[weekKey][rec] += (row[rec] || 0);
      });
    });
    const tableDataByWeek = Object.values(groupedByWeek).sort((a: any, b: any) => a.parsedDate.getTime() - b.parsedDate.getTime());

    return {
      chartData: formattedData,
      recruiters: recruiterList,
      tableData: tableDataByWeek,
      kpi: { 
        totalIngresos, 
        promedio, 
        topRecruiters,
        reclutadoresEnMeta, 
        recruiterTotals,
        totalBajasMes,
        promedioPermanenciaGlobal,
        recruiterStats,
        prevMonthTotalIngresos,
        bajasList,
        metaMensual,
        metaSemanal
      }
    };
  }, [data, selectedMonth]);

  const historicalGoals = useMemo(() => {
    const statsByMonthRecruiter: Record<string, Record<string, number>> = {};
    const recruiterSet = new Set<string>();
    
    data.forEach(record => {
      const dateStr = record["Fecha Ingreso"];
      if (!dateStr) return;
      const parsed = parseDate(dateStr);
      if (isNaN(parsed.getTime())) return;
      
      const year = parsed.getFullYear();
      const month = parsed.getMonth();
      const monthKey = `${year}-${month}`;
      
      let rawRecruiter = record["Reclutador"] ? record["Reclutador"].replace(/\s+/g, ' ').trim() : 'Sin Reclutador';
      let recruiter = rawRecruiter === 'Sin Reclutador' ? rawRecruiter : rawRecruiter.split(' ')[0];
      
      if (recruiter !== 'Sin Reclutador') {
        recruiter = recruiter.charAt(0).toUpperCase() + recruiter.slice(1).toLowerCase();
        if (recruiter === 'Nayeli') {
          recruiter = 'Alexandra';
        }
      }
      
      if (recruiter === 'Sin Reclutador' || recruiter === 'Thalia' || recruiter === 'Leonardo') return;
      
      recruiterSet.add(recruiter);
      
      if (!statsByMonthRecruiter[monthKey]) statsByMonthRecruiter[monthKey] = {};
      if (!statsByMonthRecruiter[monthKey][recruiter]) statsByMonthRecruiter[monthKey][recruiter] = 0;
      
      statsByMonthRecruiter[monthKey][recruiter] += 1;
    });
    
    const recruiterMonthsCompleted: Record<string, { total: number, details: { monthName: string, meta: number, count: number }[] }> = {};
    Array.from(recruiterSet).forEach(rec => recruiterMonthsCompleted[rec] = { total: 0, details: [] });
    
    const sortedMonths = Object.entries(statsByMonthRecruiter).sort((a, b) => {
      const [yearA, monthA] = a[0].split('-').map(Number);
      const [yearB, monthB] = b[0].split('-').map(Number);
      return yearA !== yearB ? yearA - yearB : monthA - monthB;
    });

    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    sortedMonths.forEach(([monthKey, recruiters]) => {
      const [yearStr, monthStr] = monthKey.split('-');
      const y = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10);
      
      const isBeforeJune2026 = y < 2026 || (y === 2026 && m < 5);
      const meta = isBeforeJune2026 ? 13 : 28;
      const monthName = `${monthNames[m]} ${y}`;
      
      Object.entries(recruiters).forEach(([rec, count]) => {
         if (count >= meta) {
             recruiterMonthsCompleted[rec].total += 1;
             recruiterMonthsCompleted[rec].details.push({ monthName, meta, count });
         }
      });
    });
    
    const recruiterList = Array.from(recruiterSet).sort();
    return recruiterList.map((name, index) => ({
      name,
      tone: getRecruiterTone(index),
      monthsCompleted: recruiterMonthsCompleted[name].total,
      details: recruiterMonthsCompleted[name].details
    })).sort((a, b) => b.monthsCompleted - a.monthsCompleted);
  }, [data]);

  return { data, loading, error, chartData, recruiters, tableData, kpi, historicalGoals };
}

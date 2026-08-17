import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { validarComentario } from '@/lib/profanity';

export interface IncidenciaTransporte {
  id: string;
  created_at: string;
  numero_empleado: string;
  nombre_empleado: string;
  ruta: string;
  turno: string;
  tipo: string;
  comentarios: string;
  status: string;
}

export type NuevoReporte = Omit<IncidenciaTransporte, 'id' | 'created_at' | 'status'>;

export function useIncidenciasTransporte() {
  const [incidencias, setIncidencias] = useState<IncidenciaTransporte[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchIncidencias = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase
        .from('incidencias_transporte')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIncidencias(data as IncidenciaTransporte[]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al cargar incidencias');
    } finally {
      setLoading(false);
    }
  }, []);

  const enviarIncidencia = async (reporte: NuevoReporte) => {
    setErrorMsg(null);
    try {
      // 1. Validar si el empleado existe y obtener su nombre real
      const { data: emp, error: empError } = await supabase
        .from('empleados')
        .select('nombre')
        .eq('num_empleado', reporte.numero_empleado)
        .maybeSingle();

      if (empError || !emp) {
        throw new Error('No fue posible validar la información. Revisa que tus datos estén correctos e intenta de nuevo.');
      }

      // 2. Verificar que no haya enviado un reporte en las últimas 12 horas (Rate Limiting)
      const doceHorasAtras = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
      const { data: reportesPrevios, error: rateError } = await supabase
        .from('incidencias_transporte')
        .select('id')
        .eq('numero_empleado', reporte.numero_empleado)
        .gte('created_at', doceHorasAtras)
        .limit(1);

      if (rateError) {
        throw new Error('Error al verificar el historial de reportes.');
      }

      if (reportesPrevios && reportesPrevios.length > 0) {
        throw new Error('Ya enviaste un reporte hoy. Espera 12h.');
      }

      // 3. Validar groserías en los comentarios con el filtro avanzado
      if (reporte.comentarios && !validarComentario(reporte.comentarios, { modoSuave: true })) {
        throw new Error('El comentario contiene lenguaje inapropiado. Por favor, mantén un tono profesional.');
      }

      // 2. Insertar con el nombre real
      const { error } = await supabase
        .from('incidencias_transporte')
        .insert([{ 
          ...reporte, 
          nombre_empleado: emp.nombre, // Sobrescribimos con el nombre de la BD
          status: 'nuevo' 
        }]);

      if (error) throw error;
      return true;
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al enviar la incidencia');
      return false;
    }
  };

  return {
    incidencias,
    loading,
    errorMsg,
    fetchIncidencias,
    enviarIncidencia,
  };
}

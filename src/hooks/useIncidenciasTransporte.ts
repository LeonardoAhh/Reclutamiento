import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { TRANSPORT_INCIDENTS_CONFIG } from '@/lib/constants';
import { validarComentario } from '@/lib/profanity';
import {
  TRANSPORT_INCIDENT_IMAGE_BUCKET,
  getTransportIncidentImageExtension,
  validateTransportIncidentImage,
} from '@/lib/transport-incident-image';
import {
  isValidTransportReportEmployeeNumber,
} from '@/lib/transport-report-employee-number';
import {
  isValidTransportReportComment,
  normalizeTransportReportComment,
  TRANSPORT_REPORT_COMMENT_MAX_LENGTH,
} from '@/lib/transport-report-comment';

export interface IncidenciaTransporte {
  id: string;
  created_at: string;
  numero_empleado: string;
  nombre_empleado: string;
  ruta: string;
  turno: string;
  tipo: string;
  comentarios: string;
  imagen_path?: string | null;
  status: string;
}

export type NuevoReporte = Omit<
  IncidenciaTransporte,
  'id' | 'created_at' | 'imagen_path' | 'status'
>;

const TRANSPORT_INCIDENT_SELECT =
  'id, created_at, numero_empleado, nombre_empleado, ruta, turno, tipo, comentarios, imagen_path, status';

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return fallback;
}

export function useIncidenciasTransporte() {
  const [incidencias, setIncidencias] = useState<IncidenciaTransporte[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const requestIdRef = useRef(0);
  const clearError = useCallback(() => setErrorMsg(null), []);

  const fetchIncidencias = useCallback(async (page = 1) => {
    const requestId = ++requestIdRef.current;
    const from = (page - 1) * TRANSPORT_INCIDENTS_CONFIG.pageSize;
    const to = from + TRANSPORT_INCIDENTS_CONFIG.pageSize - 1;
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error, count } = await supabase
        .from('incidencias_transporte')
        .select(TRANSPORT_INCIDENT_SELECT, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      if (requestId !== requestIdRef.current) return;
      setIncidencias(data as IncidenciaTransporte[]);
      setTotalCount(count ?? 0);
    } catch (error: unknown) {
      if (requestId !== requestIdRef.current) return;
      setErrorMsg(getErrorMessage(error, 'Error al cargar incidencias'));
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  const fetchIncidenciasForExport = useCallback(async () => {
    const allIncidents: IncidenciaTransporte[] = [];
    const { exportBatchSize } = TRANSPORT_INCIDENTS_CONFIG;

    for (let from = 0; ; from += exportBatchSize) {
      const { data, error } = await supabase
        .from('incidencias_transporte')
        .select(TRANSPORT_INCIDENT_SELECT)
        .order('created_at', { ascending: false })
        .range(from, from + exportBatchSize - 1);

      if (error) throw error;
      const batch = (data ?? []) as IncidenciaTransporte[];
      allIncidents.push(...batch);
      if (batch.length < exportBatchSize) break;
    }

    return allIncidents;
  }, []);

  const enviarIncidencia = async (
    reporte: NuevoReporte,
    imagen?: File | null,
  ) => {
    setErrorMsg(null);
    let imagenPath: string | null = null;

    try {
      const employeeNumber = reporte.numero_empleado.trim();
      if (!isValidTransportReportEmployeeNumber(employeeNumber)) {
        throw new Error('El número de empleado debe contener de 1 a 4 dígitos.');
      }

      const comment = normalizeTransportReportComment(reporte.comentarios);
      if (!isValidTransportReportComment(comment)) {
        throw new Error(
          `El comentario debe contener entre 1 y ${TRANSPORT_REPORT_COMMENT_MAX_LENGTH} caracteres.`,
        );
      }

      if (imagen) {
        const validationError = validateTransportIncidentImage(imagen);
        if (validationError) throw new Error(validationError);
      }

      // 1. Validar si el empleado existe y obtener su nombre real
      const { data: emp, error: empError } = await supabase
        .from('empleados')
        .select('nombre')
        .eq('num_empleado', employeeNumber)
        .maybeSingle();

      if (empError || !emp) {
        throw new Error('No pudimos validar que trabajas en ViñoPlastic Inyección Querétaro');
      }

      // 2. Verificar que no haya enviado un reporte en las últimas 12 horas (Rate Limiting)
      const doceHorasAtras = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
      const { data: reportesPrevios, error: rateError } = await supabase
        .from('incidencias_transporte')
        .select('id')
        .eq('numero_empleado', employeeNumber)
        .gte('created_at', doceHorasAtras)
        .limit(1);

      if (rateError) {
        throw new Error('Error al verificar el historial de reportes.');
      }

      if (reportesPrevios && reportesPrevios.length > 0) {
        throw new Error('Ya enviaste un reporte hoy. Espera 12h.');
      }

      // 3. Validar groserías en los comentarios con el filtro avanzado
      if (!validarComentario(comment, { modoSuave: true })) {
        throw new Error('El comentario contiene lenguaje inapropiado. Por favor, mantén un tono profesional.');
      }

      // 4. Subir evidencia después de validar el reporte para evitar archivos innecesarios.
      if (imagen) {
        const extension = getTransportIncidentImageExtension(imagen);
        imagenPath = `${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from(TRANSPORT_INCIDENT_IMAGE_BUCKET)
          .upload(imagenPath, imagen, {
            contentType: imagen.type,
            upsert: false,
          });

        if (uploadError) {
          throw new Error('No fue posible adjuntar la imagen. Intenta nuevamente.');
        }
      }

      // 5. Insertar con el nombre real y la ruta privada de la evidencia.
      const imageFields = imagenPath ? { imagen_path: imagenPath } : {};
      const { error } = await supabase
        .from('incidencias_transporte')
        .insert([{
          ...reporte,
          ...imageFields,
          numero_empleado: employeeNumber,
          comentarios: comment,
          nombre_empleado: emp.nombre, // Sobrescribimos con el nombre de la BD
          status: 'nuevo'
        }]);

      if (error) {
        if (imagenPath) {
          await supabase.storage
            .from(TRANSPORT_INCIDENT_IMAGE_BUCKET)
            .remove([imagenPath]);
        }
        throw error;
      }
      return true;
    } catch (error: unknown) {
      setErrorMsg(getErrorMessage(error, 'Error al enviar la incidencia'));
      return false;
    }
  };

  const getIncidenciaImageUrl = useCallback(async (path: string) => {
    const { data, error } = await supabase.storage
      .from(TRANSPORT_INCIDENT_IMAGE_BUCKET)
      .createSignedUrl(path, 60);

    if (error || !data?.signedUrl) {
      throw new Error('No fue posible abrir la imagen. Intenta nuevamente.');
    }

    return data.signedUrl;
  }, []);

  return {
    incidencias,
    totalCount,
    loading,
    errorMsg,
    clearError,
    fetchIncidencias,
    fetchIncidenciasForExport,
    enviarIncidencia,
    getIncidenciaImageUrl,
  };
}

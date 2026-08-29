import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { validarComentario } from '@/lib/profanity';
import {
  TRANSPORT_INCIDENT_IMAGE_BUCKET,
  getTransportIncidentImageExtension,
  validateTransportIncidentImage,
} from '@/lib/transport-incident-image';

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
    } catch (error: unknown) {
      setErrorMsg(getErrorMessage(error, 'Error al cargar incidencias'));
    } finally {
      setLoading(false);
    }
  }, []);

  const enviarIncidencia = async (
    reporte: NuevoReporte,
    imagen?: File | null,
  ) => {
    setErrorMsg(null);
    let imagenPath: string | null = null;

    try {
      if (imagen) {
        const validationError = validateTransportIncidentImage(imagen);
        if (validationError) throw new Error(validationError);
      }

      // 1. Validar si el empleado existe y obtener su nombre real
      const { data: emp, error: empError } = await supabase
        .from('empleados')
        .select('nombre')
        .eq('num_empleado', reporte.numero_empleado)
        .maybeSingle();

      if (empError || !emp) {
        throw new Error('Error. No pudimos validar que trabajas en ViñoPlastic Inyección Querétaro');
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
    loading,
    errorMsg,
    fetchIncidencias,
    enviarIncidencia,
    getIncidenciaImageUrl,
  };
}

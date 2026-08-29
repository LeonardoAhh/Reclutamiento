import { useEffect, useMemo, useState } from 'react';
import { FileSpreadsheet, Inbox, TriangleAlert } from 'lucide';
import {
  useIncidenciasTransporte,
  type IncidenciaTransporte,
} from '@/hooks/useIncidenciasTransporte';
import { useAuth } from '@/hooks/useAuth';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { formatReadableDate } from '@/lib/dates';
import { toast } from '@/lib/notify';
import { BoneyardSkeleton } from '@/components/ui/BoneyardSkeleton';
import { LightboxModal } from '@/components/ui/LightboxModal';
import { MorphingIcon } from '@/components/ui/MorphingIcon';
import { TransportIncidentGroup } from '@/components/transporte/TransportIncidentGroup';
import './IncidenciasTable.css';

export function IncidenciasTable() {
  const { profile } = useAuth();
  const {
    incidencias,
    loading,
    errorMsg,
    fetchIncidencias,
    getIncidenciaImageUrl,
  } = useIncidenciasTransporte();
  const [loadingImageId, setLoadingImageId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ src: string; alt: string } | null>(
    null,
  );
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const isAdmin = profile?.role === 'admin';
  const isDesktop = useMediaQuery('(min-width: 1080px)');

  useEffect(() => {
    fetchIncidencias();
  }, [fetchIncidencias]);

  const groupedIncidents = useMemo(
    () =>
      Object.entries(
        incidencias.reduce<Record<string, IncidenciaTransporte[]>>(
          (groups, incident) => {
            const dateLabel = formatReadableDate(incident.created_at);
            groups[dateLabel] ??= [];
            groups[dateLabel].push(incident);
            return groups;
          },
          {},
        ),
      ),
    [incidencias],
  );

  const toggleCard = (id: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDownloadCsv = () => {
    if (incidencias.length === 0) return;

    const header = [
      'ID',
      'Fecha',
      'Numero Empleado',
      'Nombre',
      'Ruta',
      'Turno',
      'Tipo de Incidencia',
      'Comentarios',
      'Imagen adjunta',
      'Estatus',
    ];
    const rows = incidencias.map((incident) => [
      incident.id,
      incident.created_at,
      incident.numero_empleado,
      incident.nombre_empleado || '',
      incident.ruta,
      incident.turno,
      incident.tipo,
      incident.comentarios || '',
      incident.imagen_path ? 'Sí' : 'No',
      incident.status,
    ]);
    const csvContent = [
      header.join(','),
      ...rows.map((row) =>
        row
          .map((field) => `"${String(field).replace(/"/g, '""')}"`)
          .join(','),
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Incidencias_Transporte_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleOpenImage = async (incident: IncidenciaTransporte) => {
    if (!incident.imagen_path) return;

    setLoadingImageId(incident.id);
    try {
      const src = await getIncidenciaImageUrl(incident.imagen_path);
      setPreview({
        src,
        alt: `Evidencia del reporte de ${incident.nombre_empleado || incident.numero_empleado}`,
      });
    } catch (error: unknown) {
      toast.error({
        title: 'No se pudo abrir la imagen',
        description:
          error instanceof Error ? error.message : 'Intenta nuevamente.',
      });
    } finally {
      setLoadingImageId(null);
    }
  };

  if (errorMsg) {
    return (
      <div className="incidencias-state" role="alert">
        <MorphingIcon
          icon={TriangleAlert}
          size="var(--icon-size-lg)"
          className="incidencias-state__icon incidencias-state__icon--error"
        />
        <div className="incidencias-state__copy">
          <h3>Error al cargar</h3>
          <p>{errorMsg}</p>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => void fetchIncidencias()}
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (incidencias.length === 0) {
    return (
      <BoneyardSkeleton
        name="configuracion-incidencias"
        loading={loading}
        loadingLabel="Cargando incidencias de transporte…"
      >
        <div className="incidencias-state">
          <MorphingIcon
            icon={Inbox}
            size="var(--icon-size-lg)"
            className="incidencias-state__icon"
          />
          <div className="incidencias-state__copy">
            <h3>Sin incidencias</h3>
            <p>No hay incidencias reportadas todavía.</p>
          </div>
        </div>
      </BoneyardSkeleton>
    );
  }

  return (
    <>
      <BoneyardSkeleton
        name="configuracion-incidencias"
        loading={loading}
        loadingLabel="Cargando incidencias de transporte…"
      >
        <div className="incidencias-panel">
          <div
            className="incidencias-table-actions"
            role="toolbar"
            aria-label="Acciones de incidencias"
          >
            <button
              type="button"
              className="btn-secondary incidencias-table-actions__download"
              aria-label={`Descargar ${incidencias.length} incidencias para Excel`}
              onClick={handleDownloadCsv}
            >
              <MorphingIcon
                icon={FileSpreadsheet}
                size="var(--icon-size-sm)"
              />
              Excel
            </button>
          </div>

          <div className="incidencias-day-group">
            {groupedIncidents.map(([dateLabel, incidents]) => (
              <TransportIncidentGroup
                key={dateLabel}
                dateLabel={dateLabel}
                incidents={incidents}
                desktop={isDesktop}
                admin={isAdmin}
                loadingImageId={loadingImageId}
                expanded={expanded}
                onToggle={toggleCard}
                onOpenImage={handleOpenImage}
              />
            ))}
          </div>
        </div>
      </BoneyardSkeleton>

      <LightboxModal
        isOpen={Boolean(preview)}
        onClose={() => setPreview(null)}
        src={preview?.src ?? null}
        title="Imagen del reporte"
        alt={preview?.alt ?? 'Imagen adjunta al reporte'}
      />
    </>
  );
}

import { useEffect } from 'react';
import { Download, AlertCircle } from 'lucide-react';
import { useIncidenciasTransporte } from '@/hooks/useIncidenciasTransporte';
import { formatReadableDate } from '@/lib/dates';
import { SkeletonTable } from '@/components/ui/PageSkeletons';
import './IncidenciasTable.css';

export function IncidenciasTable() {
  const { incidencias, loading, errorMsg, fetchIncidencias } = useIncidenciasTransporte();

  useEffect(() => {
    fetchIncidencias();
  }, [fetchIncidencias]);

  const handleDownloadExcel = () => {
    if (incidencias.length === 0) return;

    // Generar CSV
    const header = ['ID', 'Fecha', 'Numero Empleado', 'Nombre', 'Ruta', 'Turno', 'Tipo de Incidencia', 'Comentarios', 'Estatus'];
    const rows = incidencias.map(inc => [
      inc.id,
      inc.created_at,
      inc.numero_empleado,
      inc.nombre_empleado || '',
      inc.ruta,
      inc.turno,
      inc.tipo,
      inc.comentarios || '',
      inc.status
    ]);

    const csvContent = [
      header.join(','),
      ...rows.map(e => e.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Incidencias_Transporte_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <SkeletonTable rows={5} />;
  }

  if (errorMsg) {
    return (
      <div className="table-empty">
        <AlertCircle size={24} className="text-danger" />
        <p className="type-body-sm mt-sm">Error: {errorMsg}</p>
      </div>
    );
  }

  if (incidencias.length === 0) {
    return (
      <div className="table-empty">
        <p className="type-body-sm text-muted">No hay incidencias reportadas aún.</p>
      </div>
    );
  }

  return (
    <div className="table-container card">
      <div className="card__header" style={{ display: 'flex', justifyContent: 'flex-end', padding: 'var(--spacing-md)' }}>
        <button type="button" className="btn-secondary btn-sm" onClick={handleDownloadExcel}>
          <Download size={16} />
          Descargar CSV
        </button>
      </div>
      
      <div className="incidencias-table-wrapper">
        <table className="incidencias-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Num. Emp</th>
              <th>Nombre</th>
              <th>Ruta</th>
              <th>Turno</th>
              <th>Tipo</th>
              <th>Comentarios</th>
            </tr>
          </thead>
          <tbody>
            {incidencias.map((inc) => (
              <tr key={inc.id}>
                <td className="type-body-sm" style={{ whiteSpace: 'nowrap' }} title={inc.created_at}>
                  {formatReadableDate(inc.created_at)}
                </td>
                <td className="type-body-sm strong" style={{ whiteSpace: 'nowrap' }}>{inc.numero_empleado}</td>
                <td className="type-body-sm" style={{ whiteSpace: 'nowrap' }}>{inc.nombre_empleado || '-'}</td>
                <td className="type-body-sm" style={{ whiteSpace: 'nowrap' }}>{inc.ruta.split('-')[0].trim()}</td>
                <td className="type-body-sm">{inc.turno}</td>
                <td className="type-body-sm" style={{ whiteSpace: 'nowrap' }}>{inc.tipo}</td>
                <td className="type-body-sm text-muted" style={{ minWidth: '200px' }}>
                  {inc.comentarios || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

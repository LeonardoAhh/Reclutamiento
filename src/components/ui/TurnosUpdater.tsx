import { useRef, useState } from 'react';
import { CircleAlert, CircleCheckBig, Upload, X } from 'lucide-react';
import type { BajaRaw } from '@/lib/types';
import './JsonImporter.css';
import './TurnosUpdater.css';

interface TurnosUpdaterProps {
  onPreview: (data: BajaRaw[]) => Promise<{
    ok: boolean;
    preview: Array<{
      num_empleado: string;
      nombre: string;
      turno_anterior: string | undefined;
      turno_nuevo: string;
    }>;
    updated: number;
    notFound: number;
  }>;
  onApply: (data: BajaRaw[]) => Promise<{ ok: boolean; updated: number }>;
}

/**
 * Componente para actualizar SOLO el campo turno de las bajas existentes.
 * Muestra un preview de los cambios antes de aplicarlos.
 */
export function TurnosUpdater({ onPreview, onApply }: TurnosUpdaterProps) {
  const [status, setStatus] = useState<'idle' | 'preview' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [previewData, setPreviewData] = useState<{
    preview: Array<{
      num_empleado: string;
      nombre: string;
      turno_anterior: string | undefined;
      turno_nuevo: string;
    }>;
    updated: number;
    notFound: number;
    raw: BajaRaw[];
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        const arr: BajaRaw[] = Array.isArray(json) ? json : [json];

        const getKey = (obj: BajaRaw, key: string): string | undefined => {
          if (obj[key] !== undefined) return obj[key] as string;
          const variant = Object.keys(obj).find((k) => k.trim() === key);
          return variant ? (obj[variant] as string) : undefined;
        };

        const valid = arr.every(
          (item) => getKey(item, 'Num Empleado') !== undefined && getKey(item, 'Turno') !== undefined,
        );

        if (!valid) {
          setStatus('error');
          setMessage('JSON inválido. Requiere "Num Empleado" y "Turno".');
          return;
        }

        const result = await onPreview(arr);
        setPreviewData({
          ...result,
          raw: arr,
        });
        setStatus('preview');
        setMessage(
          `${result.updated} actualizaciones disponibles${
            result.notFound > 0 ? `, ${result.notFound} no encontrados` : ''
          }.`,
        );
      } catch (err) {
        setStatus('error');
        setMessage('Error al parsear JSON. Verifica formato.');
        console.error(err);
      } finally {
        if (fileRef.current) fileRef.current.value = '';
      }
    };
    reader.readAsText(file);
  }

  async function handleApply() {
    if (!previewData) return;

    try {
      const result = await onApply(previewData.raw);
      setStatus('success');
      setMessage(`${result.updated} turno(s) actualizado(s).`);
      setPreviewData(null);
    } catch (err) {
      setStatus('error');
      setMessage('Error al aplicar cambios.');
      console.error(err);
    }
  }

  function handleCancel() {
    setStatus('idle');
    setPreviewData(null);
    setMessage('');
  }

  return (
    <div className="turnos-updater">
      <input ref={fileRef} type="file" accept=".json" onChange={handleFile} hidden id="turnos-json-input" />
      <button
        type="button"
        className="btn-secondary"
        onClick={() => fileRef.current?.click()}
        title="Actualizar turnos (solo turno, no modifica otros datos)"
        aria-label="Actualizar turnos"
        disabled={status === 'preview'}
      >
        <Upload size={18} aria-hidden="true" />
        <span>Actualizar Turnos</span>
      </button>

      {status !== 'idle' && status !== 'preview' && (
        <output className={`json-importer__status json-importer__status--${status}`}>
          {status === 'success' ? (
            <>
              <CircleCheckBig size={14} aria-hidden="true" />
              <span>{message}</span>
            </>
          ) : (
            <>
              <CircleAlert size={14} aria-hidden="true" />
              <span>{message}</span>
            </>
          )}
        </output>
      )}

      {status === 'preview' && previewData && (
        <div className="turnos-updater__preview-modal">
          <button
            type="button"
            className="turnos-updater__preview-backdrop"
            onClick={handleCancel}
            aria-label="Cerrar vista previa"
            tabIndex={-1}
          />
          <div className="turnos-updater__preview-content">
            <header className="turnos-updater__preview-header">
              <div>
                <h3>Preview de Actualización de Turnos</h3>
                <p className="turnos-updater__preview-subtitle">{message}</p>
              </div>
              <button type="button" className="turnos-updater__close-btn" onClick={handleCancel} aria-label="Cerrar">
                <X size={20} />
              </button>
            </header>

            <div className="turnos-updater__preview-body">
              {previewData.preview.length === 0 ? (
                <p className="turnos-updater__empty">No hay cambios para aplicar.</p>
              ) : (
                <table className="turnos-updater__table data-table data-table--cards">
                  <caption className="sr-only">Vista previa de cambios de turno</caption>
                  <thead>
                    <tr>
                      <th scope="col">Num. Empleado</th>
                      <th scope="col">Nombre</th>
                      <th scope="col">Turno Anterior</th>
                      <th scope="col">Turno Nuevo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.preview.map((item) => (
                      <tr key={item.num_empleado}>
                        <td data-label="Num. Empleado">{item.num_empleado}</td>
                        <th scope="row" data-label="Nombre">
                          {item.nombre}
                        </th>
                        <td data-label="Turno Anterior" className="turnos-updater__turno-old">
                          {item.turno_anterior || '—'}
                        </td>
                        <td data-label="Turno Nuevo" className="turnos-updater__turno-new">
                          {item.turno_nuevo}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <footer className="turnos-updater__preview-footer">
              <button type="button" className="btn-secondary" onClick={handleCancel}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleApply}
                disabled={previewData.preview.length === 0}
              >
                <CircleCheckBig size={16} />
                Aplicar {previewData.updated} cambio(s)
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

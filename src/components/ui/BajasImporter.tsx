import { useRef, useState } from 'react';
import { Upload, FileJson, Check, AlertCircle } from 'lucide-react';
import type { BajaRaw } from '@/lib/types';
import './JsonImporter.css';

interface BajasImporterProps {
  onImport: (data: BajaRaw[]) => Promise<{ ok: boolean; inserted: number; skipped: number; message?: string }>;
}

/**
 * Importer especializado para el JSON de bajas. Reusa los estilos del
 * `JsonImporter` clásico, solo cambia validación y mensajes.
 */
export function BajasImporter({ onImport }: BajasImporterProps) {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [count, setCount] = useState(0);
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
          if (obj[key] !== undefined) return obj[key];
          const variant = Object.keys(obj).find((k) => k.trim() === key);
          return variant ? obj[variant] : undefined;
        };

        const valid = arr.every(
          (item) =>
            getKey(item, 'Num Empleado') !== undefined &&
            getKey(item, 'Fecha Baja') !== undefined &&
            getKey(item, 'Puesto') !== undefined
        );

        if (!valid) {
          setStatus('error');
          setMessage('JSON inválido. Requiere "Num Empleado", "Fecha Baja", "Puesto".');
          return;
        }

        const result = await onImport(arr);
        setCount(result.inserted);
        setStatus('success');
        setMessage(
          result.skipped > 0
            ? `${result.inserted} bajas; ${result.skipped} omitidas (faltan datos).`
            : `${result.inserted} baja(s) cargada(s).`
        );
      } catch {
        setStatus('error');
        setMessage('Error al parsear JSON. Verifica formato.');
      } finally {
        if (fileRef.current) fileRef.current.value = '';
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="json-importer">
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        onChange={handleFile}
        hidden
        id="bajas-json-input"
      />
      <button
        type="button"
        className="btn-secondary"
        onClick={() => fileRef.current?.click()}
        title="Importar bajas (JSON)"
      >
        <Upload size={16} aria-hidden="true" />
        <span>Importar bajas</span>
      </button>

      {status !== 'idle' && (
        <div className={`json-importer__status json-importer__status--${status}`} role="status">
          {status === 'success' ? (
            <>
              <Check size={14} aria-hidden="true" />
              <FileJson size={14} aria-hidden="true" />
              <span>{count} registros</span>
            </>
          ) : (
            <>
              <AlertCircle size={14} aria-hidden="true" />
              <span>{message}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

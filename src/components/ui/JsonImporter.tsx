import { useState, useRef } from 'react';
import { Upload, FileJson, Check, AlertCircle } from 'lucide-react';
import type { EmployeeRaw } from '@/lib/types';
import './JsonImporter.css';

interface JsonImporterProps {
  onImport: (data: EmployeeRaw[]) => void;
}

export function JsonImporter({ onImport }: JsonImporterProps) {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [count, setCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        const arr = Array.isArray(json) ? json : [json];

        // Validate minimum fields
        const valid = arr.every(
          (item: EmployeeRaw) =>
            item['Num Empleado'] !== undefined &&
            item['Nombre'] !== undefined &&
            item['Area'] !== undefined &&
            item['Puesto'] !== undefined
        );

        if (!valid) {
          setStatus('error');
          setMessage('JSON inválido. Campos requeridos: Num Empleado, Nombre, Area, Puesto.');
          return;
        }

        setCount(arr.length);
        setStatus('success');
        setMessage(`${arr.length} empleado(s) cargado(s) correctamente.`);
        onImport(arr);
      } catch {
        setStatus('error');
        setMessage('Error al parsear JSON. Verifica formato.');
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
        id="json-file-input"
      />
      <button
        id="btn-import-json"
        className="btn-secondary"
        onClick={() => fileRef.current?.click()}
      >
        <Upload size={16} />
      </button>

      {status !== 'idle' && (
        <div className={`json-importer__status json-importer__status--${status}`}>
          {status === 'success' ? (
            <>
              <Check size={14} />
              <FileJson size={14} />
              <span>{count} registros</span>
            </>
          ) : (
            <>
              <AlertCircle size={14} />
              <span>{message}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

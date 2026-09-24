import { useRef, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { FileUp } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import {
  criteriaFromImportedRows,
  distributeCriteriaWeights,
  parseProfileImport,
} from './import';
import type { EditableCriterion } from './types';

interface ProfileImportModalProps {
  onClose: () => void;
  onImported: (criteria: EditableCriterion[]) => void;
}

export function ProfileImportModal({ onClose, onImported }: ProfileImportModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedContent, setPastedContent] = useState('');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');

  const canImport = activeTab === 'file'
    ? selectedFile !== null
    : pastedContent.trim().length > 0;

  const handleImport = async () => {
    if (!canImport || importing) return;
    setImporting(true);
    setError('');

    try {
      let content: string;
      let sourceName: string;
      if (activeTab === 'file') {
        if (!selectedFile) return;
        content = await selectedFile.text();
        sourceName = selectedFile.name;
      } else {
        content = pastedContent;
        sourceName = /^[\s]*[\[{]/.test(content) ? 'contenido.json' : 'contenido.csv';
      }
      const rows = parseProfileImport(content, sourceName);
      const imported = criteriaFromImportedRows(rows);
      if (imported.length === 0) throw new Error('No encontramos criterios para previsualizar.');

      onImported(imported.some((criterion) => criterion.weightBps > 0)
        ? imported
        : distributeCriteriaWeights(imported));
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos leer la información.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".json,.csv,application/json,text/csv"
        hidden
        onChange={(event) => {
          setSelectedFile(event.target.files?.[0] ?? null);
          setError('');
        }}
      />
      <Modal
        isOpen
        onClose={() => {
          if (!importing) onClose();
        }}
        title="Importar plantilla"
        labelledById="profile-template-import-title"
        icon={<FileUp size={20} aria-hidden="true" />}
        size="md"
        footerActions={(
          <>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={importing}>
              Cancelar
            </button>
            <button type="button" className="btn-primary" onClick={() => void handleImport()} disabled={!canImport || importing}>
              {importing ? 'Importando…' : 'Importar'}
            </button>
          </>
        )}
      >
        <div className="modal-body profile-general__import-modal">
          <section className="profile-general__import-guide" aria-labelledby="profile-template-import-guide-title">
            <h3 id="profile-template-import-guide-title">Estructura del Excel</h3>
            <p>Cada renglón debe representar un criterio. La primera fila debe contener estos encabezados:</p>
            <p className="profile-general__import-example">
              <strong>Encabezados:</strong> CATEGORIA · CRITERIO · PESO · EVALUABLE
            </p>
            <p className="profile-general__import-example">
              <strong>Ejemplo:</strong> DATOS GENERALES · MAYOR DE 18 AÑOS · 5 · SI
            </p>
            <p>No uses celdas fusionadas ni columnas como “CRITERIO 1”. Puedes guardar como CSV o copiar el rango completo y pegarlo directamente.</p>
          </section>

          <Tabs.Root value={activeTab} onValueChange={(value) => {
            if (value !== 'file' && value !== 'text') return;
            setActiveTab(value);
            setError('');
          }}>
            <Tabs.List className="profile-general__tab-list" aria-label="Método de importación">
              <Tabs.Trigger className="profile-general__tab" value="file">Seleccionar archivo</Tabs.Trigger>
              <Tabs.Trigger className="profile-general__tab" value="text">Pegar información</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content className="profile-general__import-content" value="file">
              <div className="profile-general__import-file">
                <div>
                  <h3>Archivo JSON o CSV</h3>
                  <p>Selecciona un archivo para cargar sus criterios en la previsualización.</p>
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => fileRef.current?.click()}
                  aria-describedby={error ? 'profile-template-import-error' : undefined}
                >
                  <FileUp size={16} aria-hidden="true" /> Seleccionar archivo
                </button>
                {selectedFile && (
                  <p className="profile-general__selected-file" role="status">
                    Archivo seleccionado: <strong>{selectedFile.name}</strong>
                  </p>
                )}
              </div>
            </Tabs.Content>

            <Tabs.Content className="profile-general__import-content" value="text">
              <div className="form-group">
                <label htmlFor="profile-template-import-text">Información JSON, CSV o copiada desde Excel</label>
                <textarea
                  id="profile-template-import-text"
                  value={pastedContent}
                  onChange={(event) => {
                    setPastedContent(event.target.value);
                    setError('');
                  }}
                  placeholder="Pega aquí el contenido JSON, CSV o las celdas copiadas desde Excel"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error
                    ? 'profile-template-import-text-help profile-template-import-error'
                    : 'profile-template-import-text-help'}
                />
                <p id="profile-template-import-text-help" className="profile-general__import-help">
                  Se detectará automáticamente el formato pegado, incluida la separación por tabulaciones de Excel.
                </p>
              </div>
            </Tabs.Content>
          </Tabs.Root>

          {error && (
            <p id="profile-template-import-error" className="form-error-text" role="alert">
              {error}
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}

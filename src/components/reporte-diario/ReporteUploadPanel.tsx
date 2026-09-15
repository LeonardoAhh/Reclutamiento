import { useState } from "react";
import type { DragEvent, FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FileUp, LoaderCircle } from "lucide-react";
import "./ReporteUploadPanel.css";

export type ReportProcessStep = "reading" | "validating" | null;

interface ReporteUploadPanelProps {
  processStep: ReportProcessStep;
  isDragging: boolean;
  onSelectFile: () => void;
  onDragOver: (event: DragEvent) => void;
  onDragLeave: (event: DragEvent) => void;
  onDrop: (event: DragEvent) => void;
  onSubmitJson: (content: string) => void | Promise<void>;
}

export function ReporteUploadPanel({
  processStep,
  isDragging,
  onSelectFile,
  onDragOver,
  onDragLeave,
  onDrop,
  onSubmitJson,
}: ReporteUploadPanelProps) {
  const [jsonContent, setJsonContent] = useState("");
  const reduceMotion = useReducedMotion();
  const isProcessing = Boolean(processStep);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = jsonContent.trim();
    if (!content || isProcessing) return;
    void onSubmitJson(content);
  };

  return (
    <section
      className="reporte-hero__panel reporte-hero__panel--upload"
      aria-labelledby="reporte-upload-title"
    >
      <header className="reporte-hero__panel-header">
        <span className="reporte-hero__panel-icon" aria-hidden="true">
          <FileUp size="1em" />
        </span>
        <div className="reporte-hero__panel-copy">
          <h2 id="reporte-upload-title">Cargar reporte</h2>
          <p>Selecciona un archivo .json o pega su contenido.</p>
        </div>
      </header>

      <div className="reporte-upload-methods">
        <section
          className="reporte-upload-method"
          aria-labelledby="reporte-file-title"
        >
          <h3 id="reporte-file-title" className="reporte-upload-method__title">
            Seleccionar archivo
          </h3>
          <motion.button
            type="button"
            className="reporte-hero__dropzone"
            data-dragging={isDragging}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={onSelectFile}
            aria-label="Subir un archivo de reporte de asistencia"
            aria-busy={isProcessing}
            disabled={isProcessing}
            data-testid="upload-dropzone"
          >
            <AnimatePresence mode="wait">
              {processStep ? (
                <motion.span
                  key="processing"
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={
                    reduceMotion ? undefined : { opacity: 0, scale: 0.98 }
                  }
                  className="reporte-hero__dropzone-inner reporte-hero__dropzone-inner--processing"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <LoaderCircle
                    size="1em"
                    className="reporte-spinner reporte-overlay__icon-primary"
                    aria-hidden="true"
                  />
                  <span className="reporte-hero__dropzone-title">
                    {processStep === "reading" && "Leyendo archivo…"}
                    {processStep === "validating" &&
                      "Revisando incidencias…"}
                  </span>
                </motion.span>
              ) : (
                <motion.span
                  key="idle"
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={
                    reduceMotion ? undefined : { opacity: 0, scale: 0.98 }
                  }
                  className="reporte-hero__dropzone-inner"
                >
                  <span
                    className="reporte-hero__dropzone-icon"
                    aria-hidden="true"
                  >
                    <FileUp size="1em" />
                  </span>
                  <span className="reporte-upload-file__copy">
                    <span className="reporte-hero__dropzone-title">
                      Selecciona o arrastra tu archivo
                    </span>
                    <span className="reporte-hero__dropzone-hint">
                      Detectamos el mes y validamos el formato automáticamente.
                    </span>
                  </span>
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </section>

        <section
          className="reporte-upload-method reporte-upload-method--paste"
          aria-labelledby="reporte-paste-title"
        >
          <h3 id="reporte-paste-title" className="reporte-upload-method__title">
            Pegar contenido
          </h3>
          <form className="reporte-upload-form" onSubmit={handleSubmit}>
            <div className="form-group reporte-upload-form__field">
              <label className="sr-only" htmlFor="reporte-json-content">
                Contenido JSON
              </label>
              <textarea
                id="reporte-json-content"
                value={jsonContent}
                onChange={(event) => setJsonContent(event.target.value)}
                placeholder="Pega aquí el contenido completo del reporte"
                autoComplete="off"
                spellCheck={false}
                disabled={isProcessing}
              />
            </div>
            <button
              type="submit"
              className="btn-primary reporte-upload-form__submit"
              disabled={!jsonContent.trim() || isProcessing}
            >
              {isProcessing
                ? "Procesando reporte…"
                : "Procesar contenido"}
            </button>
          </form>
        </section>
      </div>
    </section>
  );
}

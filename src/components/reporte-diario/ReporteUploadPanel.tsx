import { useState } from "react";
import type { FormEvent } from "react";
import { ClipboardPaste } from "lucide-react";
import "./ReporteUploadPanel.css";
import { ReporteFormatErrors } from "./ReporteFormatErrors";
import { useReportLocale } from "./useReportLocale";

interface ReporteUploadPanelProps {
  isProcessing: boolean;
  errors: string[];
  onDismissErrors: () => void;
  onSubmitJson: (content: string) => void | Promise<void>;
}

export function ReporteUploadPanel({
  isProcessing,
  errors,
  onDismissErrors,
  onSubmitJson,
}: ReporteUploadPanelProps) {
  const [jsonContent, setJsonContent] = useState("");
  const { copy } = useReportLocale();

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
      aria-busy={isProcessing}
    >
      <header className="reporte-hero__panel-header">
        <span className="reporte-hero__panel-icon" aria-hidden="true">
          <ClipboardPaste size="1em" />
        </span>
        <div className="reporte-hero__panel-copy">
          <h2 id="reporte-upload-title">{copy("Cargar reporte", "Load report")}</h2>
          <p>{copy("Pega el contenido JSON del reporte.", "Paste the report JSON.")}</p>
        </div>
      </header>

      <section
        className="reporte-upload-method"
        aria-labelledby="reporte-paste-title"
      >
        <h3 id="reporte-paste-title" className="reporte-upload-method__title">
          {copy("Pegar contenido", "Paste content")}
        </h3>
        <form className="reporte-upload-form" onSubmit={handleSubmit}>
          {isProcessing && (
            <span className="sr-only" role="status" aria-live="polite">
              {copy("Procesando reporte…", "Processing report…")}
            </span>
          )}
          <div className="form-group reporte-upload-form__field">
            <label className="sr-only" htmlFor="reporte-json-content">
              {copy("Contenido JSON", "JSON content")}
            </label>
            <textarea
              id="reporte-json-content"
              data-cuelume-type=""
              value={jsonContent}
              onChange={(event) => setJsonContent(event.target.value)}
              placeholder={copy("Pega aquí el contenido completo del reporte", "Paste the full report content here")}
              autoComplete="off"
              spellCheck={false}
              disabled={isProcessing}
              aria-invalid={errors.length > 0}
              aria-describedby={errors.length > 0 ? "reporte-format-errors-title" : undefined}
            />
          </div>
          <button
            type="submit"
            className="btn-primary reporte-upload-form__submit"
            disabled={!jsonContent.trim() || isProcessing}
          >
            {isProcessing
              ? copy("Procesando reporte…", "Processing report…")
              : copy("Procesar contenido", "Process content")}
          </button>
        </form>
        {errors.length > 0 && (
          <ReporteFormatErrors errors={errors} onDismiss={onDismissErrors} />
        )}
      </section>
    </section>
  );
}

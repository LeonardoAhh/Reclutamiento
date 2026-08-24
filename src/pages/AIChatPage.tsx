import React, { useEffect, useId, useRef, useState } from "react";
import { useAIChat } from "@/hooks/useAIChat";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { MorphingIcon } from "@/components/ui/MorphingIcon";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bot,
  X,
  UploadCloud,
  FileText,
  Loader2,
  Send,
} from "lucide-react";
import {
  Check as CheckData,
  CircleAlert,
  Copy as CopyData,
  RotateCcw,
} from "lucide";
import { toast } from "@/lib/notify";
import {
  buildEvaluationShareText,
  copyEvaluationText,
} from "@/lib/aiChatExport";
import "@/styles/AIChatPage.css";

const markdownComponents: Components = {
  table: ({ node: _node, ...props }) => (
    <div
      className="ai-chat-table-wrapper"
      role="region"
      aria-label="Tabla de evaluación"
      tabIndex={0}
    >
      <table {...props} />
    </div>
  ),
};

export function AIChatPage() {
  const {
    jobs,
    selectedJob,
    setSelectedJob,
    jobsState,
    loadJobs,
    messages,
    file,
    fileError,
    selectPdf,
    removeFile,
    hasCompared,
    evaluationResult,
    evaluatedJobName,
    isLoading,
    chatError,
    handleAnalyze,
    requestAssistantMessage,
    handleRetry,
    handleNewEvaluation,
  } = useAIChat();

  const [inputText, setInputText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [hasCopiedEvaluation, setHasCopiedEvaluation] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadButtonRef = useRef<HTMLButtonElement>(null);
  const shouldFocusUploadRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const jobSelectId = useId();
  const fileInputId = useId();
  const fileHelpId = useId();
  const fileErrorId = useId();
  const messageInputId = useId();

  useEffect(() => {
    if (!messagesEndRef.current) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    messagesEndRef.current.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!hasCompared && shouldFocusUploadRef.current) {
      uploadButtonRef.current?.focus();
      shouldFocusUploadRef.current = false;
    }
  }, [hasCompared]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) selectPdf(selectedFile);
  };

  const handleDrop = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) selectPdf(droppedFile);
  };

  const handleSendMessage = (event: React.FormEvent) => {
    event.preventDefault();
    void requestAssistantMessage(inputText, "follow_up");
    setInputText("");
  };

  const getEvaluationExportInput = () => ({
    analysis: evaluationResult,
    candidateFileName: file?.name ?? "CV del candidato",
    jobName: evaluatedJobName || "Auto-perfilar",
  });

  const handleCopyEvaluation = async () => {
    if (!evaluationResult) return;
    try {
      const text = buildEvaluationShareText(getEvaluationExportInput());
      await copyEvaluationText(text);
      setHasCopiedEvaluation(true);
      toast.success({ title: "Evaluación copiada" });
    } catch (error) {
      console.error("Error copying evaluation:", error);
      toast.error({ title: "No se pudo copiar la evaluación" });
    }
  };

  const handleNewEval = () => {
    shouldFocusUploadRef.current = true;
    handleNewEvaluation();
    setHasCopiedEvaluation(false);
    setInputText("");
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="ai-page-container">
      <header className="ai-page-header">
        <div className="ai-page-header-title">
          <div className="ai-page-avatar" aria-hidden="true">
            <Bot />
          </div>
          <div>
            <h1>Asistente de Reclutamiento</h1>
            <p>Evaluación inteligente de perfiles</p>
          </div>
        </div>
      </header>

      <main className="ai-page-layout">
        <aside className="ai-page-sidebar">
          <div className="ai-page-card">
            <div className="ai-chat-controls">
              <label className="ai-chat-label" htmlFor={jobSelectId}>
                Selecciona un puesto a evaluar
              </label>
              <CustomSelect
                id={jobSelectId}
                value={selectedJob}
                onChange={setSelectedJob}
                options={[
                  { value: "", label: "Auto-perfilar" },
                  ...jobs.map((job) => ({
                    value: job.id,
                    label: job.title
                      .toLowerCase()
                      .replace(/(?:^|\s)\S/g, (letter) => letter.toUpperCase()),
                  })),
                ]}
                disabled={isLoading || jobsState !== "ready" || jobs.length === 0}
                placeholder={
                  jobsState === "loading" || jobsState === "idle"
                    ? "Cargando perfiles..."
                    : "Selecciona un puesto a evaluar..."
                }
                aria-label="Vacante a evaluar"
              />
              <div className="ai-chat-control-status">
                {jobsState === "error" && (
                  <>
                    <p role="alert">No pudimos cargar las vacantes.</p>
                    <button
                      type="button"
                      className="ai-chat-retry-btn"
                      onClick={() => void loadJobs()}
                    >
                      Reintentar
                    </button>
                  </>
                )}
              </div>
            </div>

            {!hasCompared ? (
              <fieldset className="ai-chat-upload-fieldset">
                <legend className="sr-only">Preparar evaluación del CV</legend>
                <input
                  id={fileInputId}
                  type="file"
                  accept="application/pdf"
                  ref={fileInputRef}
                  className="ai-chat-file-input"
                  onChange={handleFileChange}
                  aria-describedby={
                    fileError ? `${fileHelpId} ${fileErrorId}` : fileHelpId
                  }
                />
                <div className="ai-chat-upload-actions">
                  {!file ? (
                    <button
                      ref={uploadButtonRef}
                      type="button"
                      className={`ai-upload-box${isDragging ? " is-dragging" : ""}`}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      disabled={isLoading}
                    >
                      <UploadCloud aria-hidden="true" />
                      <span>Subir PDF</span>
                    </button>
                  ) : (
                    <div className="ai-upload-file">
                      <div className="ai-upload-file-info">
                        <FileText aria-hidden="true" />
                        <span>CV adjunto</span>
                      </div>
                      <button
                        type="button"
                        className="ai-upload-remove"
                        onClick={removeFile}
                        aria-label="Quitar archivo adjunto"
                        disabled={isLoading}
                      >
                        <X aria-hidden="true" />
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    className="ai-chat-submit-btn"
                    onClick={() => void handleAnalyze()}
                    disabled={!file || isLoading}
                    aria-busy={isLoading}
                  >
                    {isLoading && !hasCompared && (
                      <Loader2 className="ai-chat-spin" aria-hidden="true" />
                    )}
                    <span>Comparar</span>
                  </button>
                </div>
                {fileError && (
                  <p id={fileErrorId} className="ai-chat-error" role="alert">
                    {fileError}
                  </p>
                )}
              </fieldset>
            ) : (
              <div className="ai-chat-followup">
                <div
                  className="ai-chat-result-actions"
                  role="group"
                  aria-label="Acciones de la evaluación"
                >
                  <button
                    type="button"
                    className="ai-chat-action-btn"
                    onClick={handleCopyEvaluation}
                    disabled={!evaluationResult}
                  >
                    <MorphingIcon
                      icon={hasCopiedEvaluation ? CheckData : CopyData}
                      aria-hidden="true"
                    />
                    <span>{hasCopiedEvaluation ? "Copiada" : "Copiar"}</span>
                  </button>
                  <button
                    type="button"
                    className="ai-chat-action-btn"
                    onClick={handleNewEval}
                    disabled={isLoading}
                  >
                    <MorphingIcon icon={RotateCcw} aria-hidden="true" />
                    <span>Nuevo</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>

        <section
          className="ai-page-chat-area ai-page-card"
          aria-label="Conversación con el asistente"
        >
          <div className="ai-chat-messages" role="log" aria-busy={isLoading}>
            {messages.map((message) => (
              <article
                key={message.id}
                className={`ai-chat-message ${message.role}`}
              >
                {message.role !== "user" && (
                  <div className="ai-chat-avatar" aria-hidden="true">
                    <Bot />
                  </div>
                )}
                <div className="ai-chat-content">
                  {message.role === "ai" || message.role === "system" ? (
                    message.analysisData ? (
                      <div className="ai-chat-structured">
                        <div className="ai-chat-score-header">
                          <div className="ai-chat-score-circle">
                            <strong>{message.analysisData.matchScore}%</strong>
                            <span>Match</span>
                          </div>
                          <div className="ai-chat-score-roles">
                            <h3>Roles recomendados</h3>
                            <ul>
                              {message.analysisData.roles?.map((r: any, i: number) => (
                                <li key={i}>
                                  <strong>{r.title}</strong> ({r.match}%)<br />
                                  <span className="ai-chat-role-reason">{r.reason}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="ai-chat-analysis-grid">
                          {message.analysisData.strengths?.length > 0 && (
                            <div className="ai-chat-analysis-col">
                              <h4 className="text-success">Fortalezas</h4>
                              <ul className="ai-chat-bullet-list">
                                {message.analysisData.strengths.map((s: string, i: number) => (
                                  <li key={i}>{s}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {message.analysisData.weaknesses?.length > 0 && (
                            <div className="ai-chat-analysis-col">
                              <h4 className="text-warning">Brechas</h4>
                              <ul className="ai-chat-bullet-list">
                                {message.analysisData.weaknesses.map((w: string, i: number) => (
                                  <li key={i}>{w}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {message.analysisData.flags?.length > 0 &&
                         message.analysisData.flags[0] !== "Ninguna" && (
                          <div className="ai-chat-flags">
                            <h4>Banderas Rojas</h4>
                            <ul>
                              {message.analysisData.flags.map((f: string, i: number) => (
                                <li key={i}>{f}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="ai-chat-markdown">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={markdownComponents}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    )
                  ) : (
                    <div className="ai-chat-plain-message">
                      {message.content}
                    </div>
                  )}
                </div>
              </article>
            ))}

            {isLoading && (
              <div className="ai-chat-message ai" role="status">
                <div className="ai-chat-avatar" aria-hidden="true">
                  <Bot />
                </div>
                <div className="ai-chat-content">
                  <span className="sr-only">El asistente está respondiendo.</span>
                  <div className="ai-typing-indicator" aria-hidden="true">
                    <span className="ai-dot" />
                    <span className="ai-dot" />
                    <span className="ai-dot" />
                  </div>
                </div>
              </div>
            )}

            {chatError && (
              <div className="ai-chat-inline-error" role="alert">
                <MorphingIcon icon={CircleAlert} aria-hidden="true" />
                <p>{chatError.message}</p>
                <button type="button" onClick={handleRetry} disabled={isLoading}>
                  <MorphingIcon icon={RotateCcw} aria-hidden="true" />
                  Reintentar
                </button>
              </div>
            )}
            <div ref={messagesEndRef} aria-hidden="true" />
          </div>

          <form
            className="ai-chat-input-form"
            onSubmit={handleSendMessage}
            aria-label="Enviar mensaje al asistente"
          >
            <input
              id={messageInputId}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                hasCompared
                  ? "Escribe un mensaje al asistente..."
                  : "Analizo tu CV primero para poder conversar contigo."
              }
              disabled={!hasCompared || isLoading}
              className="ai-chat-text-input"
              aria-label="Escribe tu mensaje"
              autoComplete="off"
            />
            <button
              type="submit"
              className="ai-chat-send-btn"
              disabled={!inputText.trim() || isLoading || !hasCompared}
              aria-label="Enviar mensaje"
            >
              {isLoading && hasCompared && !inputText.trim() ? (
                <Loader2 className="ai-chat-action-icon--spin" aria-hidden="true" />
              ) : (
                <Send aria-hidden="true" />
              )}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

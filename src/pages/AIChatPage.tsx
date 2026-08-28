import React, { useEffect, useId, useRef, useState } from "react";
import { useAIChat, type Message } from "@/hooks/useAIChat";
import { useIsMobile } from "@/hooks/useIsMobile";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { Modal } from "@/components/ui/Modal";
import { MorphingIcon } from "@/components/ui/MorphingIcon";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bot,
  Check,
  FileText,
  History,
  LoaderCircle,
  EllipsisVertical,
  PenLine,
  ArrowUp,
  SlidersHorizontal,
  Trash2,
  X,
  CloudOff,
  Search,
  CloudUpload,
} from "lucide-react";
import {
  Check as CheckData,
  CircleAlert,
  Copy as CopyData,
  RotateCcw,
} from "lucide";
import { toast } from "@/lib/notify";
import {
  AI_CHAT_HISTORY_CONFIG,
} from "@/lib/constants";
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

function getAnalyzedCandidateName(messages: readonly Message[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const value = messages[index].analysisData?.candidateName;
    if (typeof value !== "string") continue;

    const candidateName = value.trim();
    if (
      candidateName &&
      candidateName.toLocaleLowerCase("es-MX") !== "no especificado"
    ) {
      return candidateName;
    }
  }

  return "";
}

export function AIChatPage() {
  const {
    jobs,
    selectedJob,
    setSelectedJob,
    jobsState,
    loadJobs,
    messages,
    file,
    candidateFileName,
    fileError,
    selectPdf,
    removeFile,
    hasCompared,
    evaluationResult,
    evaluatedJobName,
    isLoading,
    chatError,
    sessionId,
    conversations,
    conversationSyncState,
    handleAnalyze,
    requestAssistantMessage,
    handleRetry,
    handleNewEvaluation,
    handleSelectConversation,
    handleRenameConversation,
    handleDeleteConversation,
  } = useAIChat();

  const isMobile = useIsMobile();
  const analyzedCandidateName = getAnalyzedCandidateName(messages);
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [inputText, setInputText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [hasCopiedEvaluation, setHasCopiedEvaluation] = useState(false);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [conversationTitleDraft, setConversationTitleDraft] = useState("");
  const [conversationPendingDelete, setConversationPendingDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadButtonRef = useRef<HTMLButtonElement>(null);
  const shouldFocusUploadRef = useRef(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  const jobSelectId = useId();
  const fileInputId = useId();
  const fileHelpId = useId();
  const fileErrorId = useId();
  const messageInputId = useId();
  const chatHeadingId = useId();

  useEffect(() => {
    const messagesContainer = messagesRef.current;
    if (!messagesContainer) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    messagesContainer.scrollTo({
      top: messagesContainer.scrollHeight,
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

  const handleMessageKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  const getEvaluationExportInput = () => ({
    analysis: evaluationResult,
    candidateFileName: candidateFileName || file?.name || "CV del candidato",
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
    setIsHistoryOpen(false);
    setIsSetupOpen(isMobile);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleStartAnalysis = () => {
    setIsSetupOpen(false);
    void handleAnalyze();
  };

  const handleOpenConversation = (conversationId: string) => {
    handleSelectConversation(conversationId);
    setEditingConversationId(null);
    setHasCopiedEvaluation(false);
    setInputText("");
    setIsHistoryOpen(false);
    setIsSetupOpen(false);
  };

  const startRenamingConversation = (conversationId: string, title: string) => {
    setEditingConversationId(conversationId);
    setConversationTitleDraft(title);
  };

  const cancelRenamingConversation = () => {
    setEditingConversationId(null);
    setConversationTitleDraft("");
  };

  const submitConversationRename = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingConversationId || !conversationTitleDraft.trim()) return;
    handleRenameConversation(editingConversationId, conversationTitleDraft);
    cancelRenamingConversation();
  };

  const confirmConversationDeletion = async () => {
    if (!conversationPendingDelete) return;
    const isDeletingCurrent = conversationPendingDelete.id === sessionId;
    setIsDeletingConversation(true);
    await handleDeleteConversation(conversationPendingDelete.id);
    if (isDeletingCurrent) {
      setInputText("");
      setHasCopiedEvaluation(false);
      setIsSetupOpen(isMobile);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    setIsDeletingConversation(false);
    setConversationPendingDelete(null);
  };

  const cancelConversationDeletion = () => {
    setConversationPendingDelete(null);
    if (isMobile) setIsHistoryOpen(true);
  };

  const setupContent = (
    <>
      <div className="ai-chat-controls">
        <label className="ai-chat-label" htmlFor={jobSelectId}>
          Vacante
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
          <p id={fileHelpId} className="ai-chat-upload-help">
            Archivo PDF del candidato
          </p>
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
                <CloudUpload aria-hidden="true" />
                <span>Adjuntar CV</span>
              </button>
            ) : (
              <div className="ai-upload-file">
                <div className="ai-upload-file-info">
                  <FileText aria-hidden="true" />
                  <span title={file.name}>{file.name}</span>
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
              className="btn-primary ai-chat-submit-btn"
              onClick={handleStartAnalysis}
              disabled={!file || isLoading}
              aria-busy={isLoading}
            >
              {isLoading && !hasCompared && (
                <LoaderCircle className="ai-chat-spin" aria-hidden="true" />
              )}
              <span>{isLoading ? "Analizando" : "Analizar CV"}</span>
            </button>
          </div>
          {fileError && (
            <p id={fileErrorId} className="ai-chat-error" role="alert">
              {fileError}
            </p>
          )}
        </fieldset>
      ) : (
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
            <span>Nueva</span>
          </button>
        </div>
      )}
    </>
  );

  const filteredConversations = conversations.filter(c =>
    !historySearchQuery ||
    c.title.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
    c.evaluatedJobName?.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
    c.candidateFileName?.toLowerCase().includes(historySearchQuery.toLowerCase())
  );

  const groupedConversations = filteredConversations.reduce((acc, curr) => {
    const date = new Date(curr.updatedAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let group = "Anteriores";
    if (date.toDateString() === today.toDateString()) {
      group = "Hoy";
    } else if (date.toDateString() === yesterday.toDateString()) {
      group = "Ayer";
    }

    if (!acc[group]) acc[group] = [];
    acc[group].push(curr);
    return acc;
  }, {} as Record<string, typeof conversations>);

  const groupOrder = ["Hoy", "Ayer", "Anteriores"];

  const historyContent = (
    <>

      {conversations.length > 0 && (
        <div className="ai-history-search">
          <Search size="var(--icon-size-sm)" aria-hidden="true" />
          <input
            type="search"
            placeholder="Buscar candidato..."
            value={historySearchQuery}
            onChange={(e) => setHistorySearchQuery(e.target.value)}
            aria-label="Buscar en historial"
          />
        </div>
      )}

      {conversations.length > 0 ? (
        filteredConversations.length > 0 ? (
          <nav className="ai-history-nav" aria-label="Conversaciones anteriores">
            {groupOrder.map((group) => {
              if (!groupedConversations[group] || groupedConversations[group].length === 0) return null;
              return (
                <div key={group} className="ai-history-group">
                  <h3 className="type-caption-up ai-history-group-title">{group}</h3>
                  <ul>
                    {groupedConversations[group].map((conversation) => (
                      <li
                        key={conversation.id}
                        className={`ai-history-row${conversation.id === sessionId ? " is-active" : ""}`}
                      >
                        {editingConversationId === conversation.id ? (
                          <form
                            className="ai-history-rename-form"
                            onSubmit={submitConversationRename}
                          >
                            <label className="sr-only" htmlFor={`rename-${conversation.id}`}>
                              Nuevo nombre de la conversación
                            </label>
                            <input
                              id={`rename-${conversation.id}`}
                              value={conversationTitleDraft}
                              onChange={(event) => setConversationTitleDraft(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === "Escape") cancelRenamingConversation();
                              }}
                              maxLength={AI_CHAT_HISTORY_CONFIG.maxTitleLength}
                              autoFocus
                            />
                            <button
                              type="submit"
                              disabled={!conversationTitleDraft.trim()}
                              aria-label="Guardar nombre"
                            >
                              <Check aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={cancelRenamingConversation}
                              aria-label="Cancelar edición"
                            >
                              <X aria-hidden="true" />
                            </button>
                          </form>
                        ) : (
                          <>
                            <Tooltip content={conversation.title} side="top">
                              <button
                                type="button"
                                className="ai-history-item"
                                onClick={() => handleOpenConversation(conversation.id)}
                                aria-current={conversation.id === sessionId ? "page" : undefined}
                              >
                                <span>{conversation.title}</span>
                                <div className="ai-history-item-meta">
                                  <span className="ai-history-item-job">
                                    {conversation.evaluatedJobName || "Puesto no disponible"}
                                  </span>
                                  {conversation.isPendingSync && (
                                    <CloudOff className="ai-sync-icon" aria-label="Sincronización pendiente" />
                                  )}
                                </div>
                              </button>
                            </Tooltip>
                            <div className="ai-history-item-actions">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    type="button"
                                    aria-label={`Acciones de ${conversation.title}`}
                                  >
                                    <EllipsisVertical aria-hidden="true" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem
                                      asChild
                                      onSelect={() =>
                                        startRenamingConversation(conversation.id, conversation.title)
                                      }
                                    >
                                      <button type="button">
                                        <PenLine aria-hidden="true" />
                                        <span>Renombrar</span>
                                      </button>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      asChild
                                      onSelect={() => {
                                        setIsHistoryOpen(false);
                                        setConversationPendingDelete({
                                          id: conversation.id,
                                          title: conversation.title,
                                        });
                                      }}
                                    >
                                      <button
                                        type="button"
                                        className="dropdown-menu-item--danger"
                                      >
                                        <Trash2 aria-hidden="true" />
                                        <span>Eliminar</span>
                                      </button>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </nav>
        ) : (
          <p className="ai-history-empty">No se encontraron resultados.</p>
        )
      ) : (
        <p className="ai-history-empty">
          Tus evaluaciones aparecerán aquí después del primer análisis.
        </p>
      )}
    </>
  );

  return (
    <div className="ai-page-container">


      <main className="ai-page-layout">
        {!isMobile && (
          <aside className="ai-page-sidebar ai-page-card" aria-label="Herramientas del asistente">
            <div className="ai-context-section">
              {setupContent}
            </div>
            <div className="ai-history-section">
              {historyContent}
            </div>
          </aside>
        )}

        <section
          className="ai-page-chat-area ai-page-card"
          aria-labelledby={chatHeadingId}
        >
          <header className="ai-chat-panel-header">
            <div className="ai-chat-panel-identity">
              <div
                className="ai-chat-avatar"
                aria-hidden="true"
              >
                <Bot />
              </div>
              <div>
                <h2 id={chatHeadingId}>Conversación</h2>
                {analyzedCandidateName && (
                  <p>
                    <span className="ai-chat-candidate-name">
                      {analyzedCandidateName}
                    </span>
                  </p>
                )}
              </div>
            </div>
            {isMobile && (
              <div className="ai-chat-mobile-menu">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" aria-label="Opciones del asistente">
                      <EllipsisVertical aria-hidden="true" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="ai-chat-mobile-menu__content">
                    <DropdownMenuItem
                      asChild
                      onSelect={() => setIsHistoryOpen(true)}
                    >
                      <button type="button">
                        <History aria-hidden="true" />
                        <span>Historial</span>
                      </button>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      asChild
                      onSelect={() => setIsSetupOpen(true)}
                    >
                      <button type="button">
                        <SlidersHorizontal aria-hidden="true" />
                        <span>Preparar análisis</span>
                      </button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </header>

          <div
            ref={messagesRef}
            className="ai-chat-messages"
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
            aria-busy={isLoading}
          >
            {messages.map((message) => (
              <article
                key={message.id}
                className={`ai-chat-message ${message.role}${message.id === "initial" ? " is-initial" : ""}`}
              >
                {message.role !== "user" && (
                  <div className="ai-chat-avatar" aria-hidden="true">
                    <Bot />
                  </div>
                )}
                <div className="ai-chat-message-body">
                  <span className="ai-chat-author">
                    {message.role === "user" ? "Tú" : "Asistente"}
                  </span>
                  <div className="ai-chat-content">
                    {message.role === "ai" || message.role === "system" ? (
                      message.analysisData ? (
                        <div className="ai-chat-structured">
                          <div className="ai-chat-score-roles">
                            <h2>Roles recomendados</h2>
                            <ul>
                              {message.analysisData.roles?.map((r: any, i: number) => (
                                <li key={i}>
                                  <strong>{r.title}</strong> ({r.match}%)<br />
                                  <span className="ai-chat-role-reason">{r.reason}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="ai-chat-analysis-grid">
                            {message.analysisData.strengths?.length > 0 && (
                              <div className="ai-chat-analysis-col">
                                <h3 className="text-success">Fortalezas</h3>
                                <ul className="ai-chat-bullet-list">
                                  {message.analysisData.strengths.map((s: string, i: number) => (
                                    <li key={i}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {message.analysisData.weaknesses?.length > 0 && (
                              <div className="ai-chat-analysis-col">
                                <h3 className="text-warning">Brechas</h3>
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
                              <h3>Banderas Rojas</h3>
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
                </div>
              </article>
            ))}

            {isLoading && (
              <div className="ai-chat-message ai" role="status">
                <div className="ai-chat-avatar" aria-hidden="true">
                  <Bot />
                </div>
                <div className="ai-chat-message-body">
                  <span className="ai-chat-author">Asistente</span>
                  <div className="ai-chat-content">
                    <span className="sr-only">El asistente está respondiendo.</span>
                    <div className="ai-typing-indicator" aria-hidden="true">
                      <span className="ai-dot" />
                      <span className="ai-dot" />
                      <span className="ai-dot" />
                    </div>
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
          </div>

          <div className="ai-chat-composer-shell">
            <form
              className="ai-chat-input-form"
              onSubmit={handleSendMessage}
              aria-label="Enviar mensaje al asistente"
            >
              <textarea
                id={messageInputId}
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                onKeyDown={handleMessageKeyDown}
                placeholder={
                  hasCompared
                    ? "¿Que sigue?"
                    : "Adjunta un CV para comenzar."
                }
                disabled={!hasCompared || isLoading}
                className="ai-chat-text-input"
                aria-label="Escribe tu mensaje"
                aria-describedby={`${messageInputId}-hint`}
                autoComplete="off"
                rows={1}
              />
              <button
                type="submit"
                className="ai-chat-send-btn"
                disabled={!inputText.trim() || isLoading || !hasCompared}
                aria-label="Enviar mensaje"
              >
                {isLoading && hasCompared && !inputText.trim() ? (
                  <LoaderCircle className="ai-chat-action-icon--spin" aria-hidden="true" />
                ) : (
                  <ArrowUp aria-hidden="true" />
                )}
              </button>
            </form>
            <p id={`${messageInputId}-hint`} className="ai-chat-composer-hint">
              {hasCompared
                ? "Enter para enviar · Shift + Enter para una nueva línea"
                : "La conversación se habilita al analizar el CV."}
            </p>
          </div>
        </section>
      </main>

      {isMobile && (
        <>
          <Modal
            isOpen={isSetupOpen}
            onClose={() => setIsSetupOpen(false)}
            title="Preparar análisis"
            icon={<SlidersHorizontal aria-hidden="true" />}
            className="ai-mobile-sheet"
            labelledById="ai-setup-sheet-title"
            size="sm"
            fullscreenMobile={false}
          >
            <div className="modal-body ai-mobile-sheet-body">
              {setupContent}
            </div>
          </Modal>
          <Modal
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            title="Historial"
            icon={<History aria-hidden="true" />}
            className="ai-mobile-sheet"
            labelledById="ai-history-sheet-title"
            size="sm"
            fullscreenMobile={false}
          >
            <div className="modal-body ai-mobile-sheet-body">
              {historyContent}
            </div>
          </Modal>
        </>
      )}

      <DeleteConfirmModal
        isOpen={conversationPendingDelete !== null}
        title="Eliminar conversación"
        onConfirm={() => void confirmConversationDeletion()}
        onCancel={cancelConversationDeletion}
        isLoading={isDeletingConversation}
      />
    </div>
  );
}

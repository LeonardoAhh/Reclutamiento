import React, { useEffect, useId, useRef, useState } from "react";
import {
  useAIChat,
  type Message,
  type StarInterviewQuestion,
} from "@/hooks/useAIChat";
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
  ArrowDown,
  Square,
} from "lucide-react";
import {
  Check as CheckData,
  CircleAlert,
  Copy as CopyData,
  RotateCcw,
} from "lucide";
import { toast } from "@/lib/notify";
import {
  AI_CHAT_CONTEXT_CONFIG,
  AI_CHAT_HISTORY_CONFIG,
  AI_CHAT_QUICK_ACTIONS,
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

function isStarInterviewQuestion(
  question: string | StarInterviewQuestion,
): question is StarInterviewQuestion {
  return typeof question !== "string";
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
    activeQuickAction,
    isStreaming,
    stopResponse,
    regenerateLastResponse,
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
  const [showScrollToLatest, setShowScrollToLatest] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadButtonRef = useRef<HTMLButtonElement>(null);
  const shouldFocusUploadRef = useRef(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const shouldFollowMessagesRef = useRef(true);

  const jobSelectId = useId();
  const fileInputId = useId();
  const fileHelpId = useId();
  const fileErrorId = useId();
  const messageInputId = useId();
  const chatHeadingId = useId();

  useEffect(() => {
    const messagesContainer = messagesRef.current;
    if (!messagesContainer || !shouldFollowMessagesRef.current) return;
    messagesContainer.scrollTo({
      top: messagesContainer.scrollHeight,
      behavior: "auto",
    });
    setShowScrollToLatest(false);
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
    shouldFollowMessagesRef.current = true;
    setShowScrollToLatest(false);
    void requestAssistantMessage(inputText, "follow_up");
    setInputText("");
  };

  const handleMessagesScroll = () => {
    const container = messagesRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const isNearBottom =
      distanceFromBottom <= AI_CHAT_CONTEXT_CONFIG.followScrollThreshold;
    shouldFollowMessagesRef.current = isNearBottom;
    setShowScrollToLatest(!isNearBottom);
  };

  const scrollToLatest = () => {
    const container = messagesRef.current;
    if (!container) return;
    shouldFollowMessagesRef.current = true;
    setShowScrollToLatest(false);
    container.scrollTo({
      top: container.scrollHeight,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };

  const handleQuickAction = (
    action: (typeof AI_CHAT_QUICK_ACTIONS)[number],
  ) => {
    shouldFollowMessagesRef.current = true;
    setShowScrollToLatest(false);
    void requestAssistantMessage(
      action.prompt,
      action.task,
      true,
      messages,
      action.label,
    );
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

  const handleCopyMessage = async (message: Message) => {
    try {
      const text = message.analysisData
        ? buildEvaluationShareText(getEvaluationExportInput())
        : message.content;
      await copyEvaluationText(text);
      toast.success({ title: "Respuesta copiada" });
    } catch (error) {
      console.error("Error copying assistant message:", error);
      toast.error({ title: "No se pudo copiar la respuesta" });
    }
  };

  const handleRegenerateResponse = () => {
    shouldFollowMessagesRef.current = true;
    setShowScrollToLatest(false);
    regenerateLastResponse();
  };

  const handleNewEval = () => {
    shouldFollowMessagesRef.current = true;
    setShowScrollToLatest(false);
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
    shouldFollowMessagesRef.current = true;
    setShowScrollToLatest(false);
    setIsSetupOpen(false);
    void handleAnalyze();
  };

  const handleOpenConversation = (conversationId: string) => {
    shouldFollowMessagesRef.current = true;
    setShowScrollToLatest(false);
    void handleSelectConversation(conversationId);
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
    void handleRenameConversation(editingConversationId, conversationTitleDraft);
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
          Puesto
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
          aria-label="Puesto a evakuar"
        />
        <div className="ai-chat-control-status">
          {jobsState === "error" && (
            <>
              <p role="alert">No pudimos cargar los puestos.</p>
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

  let lastRegenerableMessageId = "";
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role === "ai" && !message.analysisData) {
      const triggeringMessage = messages
        .slice(0, index)
        .reverse()
        .find((item) => item.role === "user");
      if (triggeringMessage?.task) {
        lastRegenerableMessageId = message.id;
      }
      break;
    }
  }

  return (
    <div className="ai-page-container">


      <main className="ai-page-layout container">
        {!isMobile && (
          <aside className="ai-page-sidebar ai-page-card" aria-label="Herramientas del IA">
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
                {hasCompared && (
                  <p className="ai-chat-context-summary">
                    {analyzedCandidateName && <span>{analyzedCandidateName}</span>}
                    {analyzedCandidateName && evaluatedJobName && (
                      <span aria-hidden="true">·</span>
                    )}
                    {evaluatedJobName && <span>{evaluatedJobName}</span>}
                    {(analyzedCandidateName || evaluatedJobName) &&
                      candidateFileName && <span aria-hidden="true">·</span>}
                    {candidateFileName && (
                      <span title={candidateFileName}>{candidateFileName}</span>
                    )}
                  </p>
                )}
              </div>
            </div>
            {isMobile && (
              <div className="ai-chat-mobile-menu">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" aria-label="Opciones del IA">
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

          <div className="ai-chat-transcript">
            <div
              ref={messagesRef}
              className="ai-chat-messages"
              onScroll={handleMessagesScroll}
              role="log"
              aria-live={isStreaming ? "off" : "polite"}
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
                    {message.role === "user" ? "Tú" : "IA"}
                  </span>
                  <div className="ai-chat-content">
                    {message.role === "ai" || message.role === "system" ? (
                      message.analysisData ? (
                        <div className="ai-chat-structured">
                          <div className="ai-chat-score-roles">
                            <h2>Roles recomendados</h2>
                            <ul>
                              {message.analysisData.roles?.map((r, i) => (
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

                          {message.analysisData.evidence &&
                            message.analysisData.evidence.length > 0 && (
                              <section className="ai-chat-evidence">
                                <h3>Evidencias del CV</h3>
                                <ul>
                                  {message.analysisData.evidence.map((evidence) => (
                                    <li
                                      key={`${evidence.finding}-${evidence.excerpt}-${evidence.page ?? "sin-pagina"}`}
                                    >
                                      <strong>{evidence.finding}</strong>
                                      <q>{evidence.excerpt}</q>
                                      <span>
                                        {evidence.page
                                          ? `Página ${evidence.page}`
                                          : "Página no identificada"}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </section>
                            )}

                          {message.analysisData.hiringReason && (
                            <section className="ai-chat-guidance">
                              <h3>Por qué considerar su contratación</h3>
                              <p>{message.analysisData.hiringReason}</p>
                            </section>
                          )}

                          {message.analysisData.interviewQuestions &&
                            message.analysisData.interviewQuestions.length > 0 && (
                              <section className="ai-chat-guidance">
                                <h3>Preguntas sugeridas para entrevista</h3>
                                <ol>
                                  {message.analysisData.interviewQuestions.map(
                                    (question, index) => {
                                      if (!isStarInterviewQuestion(question)) {
                                        return (
                                          <li key={`${question}-${index}`}>
                                            {question}
                                          </li>
                                        );
                                      }

                                      return (
                                        <li
                                          key={`${question.competency}-${question.question}`}
                                          className="ai-chat-star-question"
                                        >
                                          <span className="ai-chat-star-question__competency">
                                            {question.competency}
                                          </span>
                                          <p className="ai-chat-star-question__prompt">
                                            {question.question}
                                          </p>
                                          <details className="ai-chat-star-question__details">
                                            <summary>Guía STAR</summary>
                                            <dl>
                                              <div>
                                                <dt>Situación</dt>
                                                <dd>{question.star.situation}</dd>
                                              </div>
                                              <div>
                                                <dt>Tarea</dt>
                                                <dd>{question.star.task}</dd>
                                              </div>
                                              <div>
                                                <dt>Acción</dt>
                                                <dd>{question.star.action}</dd>
                                              </div>
                                              <div>
                                                <dt>Resultado</dt>
                                                <dd>{question.star.result}</dd>
                                              </div>
                                            </dl>
                                          </details>
                                        </li>
                                      );
                                    },
                                  )}
                                </ol>
                              </section>
                            )}

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
                        {message.displayContent ?? message.content}
                      </div>
                    )}
                  </div>
                  {message.isPartial && (
                    <p className="ai-chat-partial-label">Respuesta detenida</p>
                  )}
                  {message.role === "ai" && message.content && (
                    <footer
                      className="ai-chat-message-actions"
                      aria-label="Acciones de la respuesta"
                    >
                      <button
                        type="button"
                        onClick={() => void handleCopyMessage(message)}
                        aria-label="Copiar respuesta"
                      >
                        <MorphingIcon icon={CopyData} aria-hidden="true" />
                        <span>Copiar</span>
                      </button>
                      {message.id === lastRegenerableMessageId && (
                        <button
                          type="button"
                          onClick={handleRegenerateResponse}
                          disabled={isLoading}
                          aria-label="Regenerar última respuesta"
                        >
                          <MorphingIcon icon={RotateCcw} aria-hidden="true" />
                          <span>Regenerar</span>
                        </button>
                      )}
                    </footer>
                  )}
                </div>
              </article>
            ))}

            {isLoading && !isStreaming && (
              <div className="ai-chat-message ai" role="status">
                <div className="ai-chat-avatar" aria-hidden="true">
                  <Bot />
                </div>
                <div className="ai-chat-message-body">
                  <span className="ai-chat-author">IA</span>
                  <div className="ai-chat-content">
                    <span className="sr-only">La IA está respondiendo.</span>
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

            {showScrollToLatest && (
              <button
                type="button"
                className="ai-chat-scroll-latest"
                onClick={scrollToLatest}
                aria-label="Ir al mensaje más reciente"
              >
                <ArrowDown aria-hidden="true" />
              </button>
            )}
          </div>
          <p className="sr-only" aria-live="polite">
            {!isLoading && messages[messages.length - 1]?.role === "ai"
              ? "Respuesta de IA disponible."
              : ""}
          </p>

          <div className="ai-chat-composer-shell">
            {hasCompared && (
              <div
                className="ai-chat-quick-actions"
                aria-label="Preguntas rápidas"
              >
                {AI_CHAT_QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.task}
                    type="button"
                    onClick={() => handleQuickAction(action)}
                    disabled={isLoading}
                  >
                    {activeQuickAction === action.task && (
                      <LoaderCircle
                        className="ai-chat-action-icon--spin"
                        aria-hidden="true"
                      />
                    )}
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            )}
            <form
              className="ai-chat-input-form"
              onSubmit={handleSendMessage}
              aria-label="Enviar mensaje."
            >
              <textarea
                id={messageInputId}
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                onKeyDown={handleMessageKeyDown}
                placeholder={
                  hasCompared
                    ? "¿Qué sigue?"
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
                type={isLoading ? "button" : "submit"}
                className="ai-chat-send-btn"
                disabled={isLoading ? !hasCompared : !inputText.trim() || !hasCompared}
                onClick={isLoading && hasCompared ? stopResponse : undefined}
                aria-label={isLoading ? "Detener respuesta" : "Enviar mensaje"}
              >
                {isLoading && hasCompared ? (
                  <Square aria-hidden="true" />
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

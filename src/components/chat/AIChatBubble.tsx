import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/Popover";
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
  Sparkles,
} from "lucide-react";
import {
  Bot as BotData,
  Check as CheckData,
  CircleAlert,
  ClipboardList,
  Copy as CopyData,
  ListChecks,
  LoaderCircle,
  MessageSquareText,
  RotateCcw,
  Send as SendData,
  Sparkles as SparklesData,
  X as XData,
} from "lucide";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/notify";
import {
  buildEvaluationShareText,
  copyEvaluationText,
} from "@/lib/aiChatExport";
import {
  AI_CHAT_CONTEXT_CONFIG,
  AI_CHAT_ERROR_MESSAGES,
  AI_CHAT_QUICK_ACTIONS,
} from "@/lib/constants";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
Object.assign(pdfjsLib.GlobalWorkerOptions, { verbosity: 0 });
import "./AIChatBubble.css";

interface JobDescription {
  id: string;
  title: string;
  requirements_text: string | null;
  responsibilities_text: string | null;
}

interface Message {
  id: string;
  role: "system" | "user" | "ai";
  content: string;
}

const INITIAL_MESSAGE: Message = {
  id: "initial",
  role: "system",
  content:
    "Selecciona una vacante y adjunta un CV en PDF para comenzar.",
};

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

type JobsState = "idle" | "loading" | "ready" | "error";
type QuickActionTask = (typeof AI_CHAT_QUICK_ACTIONS)[number]["task"];
type ChatTask = "follow_up" | QuickActionTask;

type ChatRetry =
  | { kind: "analysis" }
  | { kind: "message"; task: ChatTask; userMessage: string };

interface ChatErrorState {
  message: string;
  retry: ChatRetry;
}

const QUICK_ACTION_ICONS = {
  interview_guide: ClipboardList,
  executive_summary: ListChecks,
  candidate_message: MessageSquareText,
} as const;

function buildCatalogText(jobs: JobDescription[]): string {
  return jobs
    .map(
      (job) =>
        `[ID: ${job.id}] Título: ${job.title}\nRequisitos: ${job.requirements_text || ""}\nResponsabilidades: ${job.responsibilities_text || ""}`,
    )
    .join("\n\n---\n\n");
}

function buildFollowUpCatalogText(
  jobs: JobDescription[],
  selectedJobId: string,
): string {
  if (!selectedJobId) {
    return "Usa los puestos y requisitos descritos en la evaluación inicial.";
  }

  const selectedJob = jobs.find((job) => job.id === selectedJobId);
  return selectedJob
    ? buildCatalogText([selectedJob])
    : "Usa la vacante descrita en la evaluación inicial.";
}

function limitConversationHistory(messages: Message[]): Message[] {
  const conversation = messages.filter((message) => message.role !== "system");
  const { maxHistoryMessages, preservedInitialMessages } =
    AI_CHAT_CONTEXT_CONFIG;

  if (conversation.length <= maxHistoryMessages) return conversation;

  const preserved = conversation.slice(0, preservedInitialMessages);
  const recent = conversation.slice(
    -(maxHistoryMessages - preservedInitialMessages),
  );
  return [...preserved, ...recent.filter(
    (message) => !preserved.some((item) => item.id === message.id),
  )];
}

export function AIChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [jobsState, setJobsState] = useState<JobsState>("idle");

  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);

  const [showTooltip, setShowTooltip] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [cvText, setCvText] = useState("");
  const [hasCompared, setHasCompared] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState("");
  const [evaluatedJobName, setEvaluatedJobName] = useState("");
  const [hasCopiedEvaluation, setHasCopiedEvaluation] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [activeQuickAction, setActiveQuickAction] =
    useState<QuickActionTask | null>(null);
  const [chatError, setChatError] = useState<ChatErrorState | null>(null);
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadButtonRef = useRef<HTMLButtonElement>(null);
  const shouldFocusUploadRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatPanelId = useId();
  const chatTitleId = useId();
  const jobSelectId = useId();
  const fileInputId = useId();
  const fileHelpId = useId();
  const fileErrorId = useId();
  const messageInputId = useId();

  const loadJobs = useCallback(async () => {
    setJobsState("loading");

    const { data, error } = await supabase
      .from("job_descriptions")
      .select("id, title, requirements_text, responsibilities_text");

    if (error) {
      console.error("Error loading job descriptions:", error);
      setJobsState("error");
      return;
    }

    setJobs(data ?? []);
    setJobsState("ready");
  }, []);

  useEffect(() => {
    if (isOpen && jobsState === "idle") {
      void loadJobs();
    }
  }, [isOpen, jobsState, loadJobs]);

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

  const selectPdf = (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      setFileError("Selecciona un archivo PDF para continuar.");
      return;
    }

    setFile(selectedFile);
    setCvText("");
    setFileError("");
  };

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

  const removeFile = () => {
    setFile(null);
    setCvText("");
    setFileError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ");
        fullText += pageText + "\n";
      }
      return fullText;
    } catch (e) {
      console.error("Error extrayendo texto del PDF:", e);
      return "";
    }
  };

  const handleAnalyze = async (appendUserMessage = true) => {
    if (!file) {
      setFileError("Adjunta un archivo PDF antes de iniciar la comparación.");
      return;
    }

    const analysisMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: `Analizar CV: ${file.name}`,
    };
    const messagesToSend = appendUserMessage
      ? [...messages, analysisMessage]
      : messages;

    setFileError("");
    setChatError(null);
    setIsLoading(true);
    if (appendUserMessage) setMessages(messagesToSend);

    try {
      const base64Data = await fileToBase64(file);
      const extractedText = await extractTextFromPDF(file);
      setCvText(extractedText);

      const { data, error } = await supabase.functions.invoke("compare-cv", {
        body: {
          catalog: buildCatalogText(jobs),
          target_job_id: selectedJob || null,
          resume_base64: base64Data,
          resume_text: extractedText,
          messages: limitConversationHistory(messagesToSend),
          task: "initial_analysis",
          session_id: sessionId,
        },
      });

      if (error || data?.error || !data?.analysis) {
        throw error ?? new Error("AI response unavailable");
      }

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "ai", content: data.analysis },
      ]);
      setEvaluationResult(data.analysis);
      setEvaluatedJobName(
        jobs.find((job) => job.id === selectedJob)?.title ?? "Auto-perfilar",
      );
      setHasCopiedEvaluation(false);
      setHasCompared(true);
    } catch (error) {
      console.error("Error analyzing CV:", error);
      setChatError({
        message: AI_CHAT_ERROR_MESSAGES.analysis,
        retry: { kind: "analysis" },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const requestAssistantMessage = async (
    userMessage: string,
    task: ChatTask,
    appendUserMessage = true,
  ) => {
    const trimmedMessage = userMessage.trim();
    if (!trimmedMessage || isLoading) return;

    const userEntry: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedMessage,
    };
    const messagesToSend = appendUserMessage
      ? [...messages, userEntry]
      : messages;
    let errorMessage: string = AI_CHAT_ERROR_MESSAGES.message;

    setInputText("");
    setChatError(null);
    setActiveQuickAction(task === "follow_up" ? null : task);
    setIsLoading(true);
    if (appendUserMessage) setMessages(messagesToSend);

    try {
      const { data, error } = await supabase.functions.invoke("compare-cv", {
        body: {
          catalog: buildFollowUpCatalogText(jobs, selectedJob),
          target_job_id: selectedJob || null,
          resume_text: cvText,
          messages: limitConversationHistory(messagesToSend),
          task,
          session_id: sessionId,
        },
      });

      if (data?.error) errorMessage = AI_CHAT_ERROR_MESSAGES.unavailable;
      if (error || data?.error || !data?.analysis) {
        throw error ?? new Error("AI response unavailable");
      }

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "ai", content: data.analysis },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      setChatError({
        message: errorMessage,
        retry: { kind: "message", task, userMessage: trimmedMessage },
      });
    } finally {
      setIsLoading(false);
      setActiveQuickAction(null);
    }
  };

  const handleSendMessage = (event: React.FormEvent) => {
    event.preventDefault();
    void requestAssistantMessage(inputText, "follow_up");
  };

  const handleQuickAction = (task: QuickActionTask, prompt: string) => {
    void requestAssistantMessage(prompt, task);
  };

  const handleRetry = () => {
    if (!chatError || isLoading) return;

    const { retry } = chatError;
    setChatError(null);
    if (retry.kind === "analysis") {
      void handleAnalyze(false);
      return;
    }

    void requestAssistantMessage(
      retry.userMessage,
      retry.task,
      false,
    );
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

  const handleNewEvaluation = () => {
    shouldFocusUploadRef.current = true;
    setMessages([INITIAL_MESSAGE]);
    setFile(null);
    setCvText("");
    setHasCompared(false);
    setEvaluationResult("");
    setEvaluatedJobName("");
    setHasCopiedEvaluation(false);
    setInputText("");
    setFileError("");
    setIsDragging(false);
    setChatError(null);
    setActiveQuickAction(null);
    setSessionId(crypto.randomUUID());
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      {!isOpen && showTooltip && (
        <div className="ai-chat-tooltip">
          <Sparkles aria-hidden="true" />
          <span>Evaluar un CV</span>
        </div>
      )}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="ai-chat-bubble-trigger"
            aria-label={isOpen ? "Cerrar asistente IA" : "Abrir asistente IA"}
            aria-controls={chatPanelId}
          >
            <MorphingIcon
              icon={isOpen ? XData : BotData}
              aria-hidden="true"
            />
          </button>
        </PopoverTrigger>

        <PopoverContent
          id={chatPanelId}
          side="top"
          align="end"
          sideOffset={0}
          className="ai-chat-window-content"
          aria-labelledby={chatTitleId}
        >
          <header className="ai-chat-header">
            <div className="ai-chat-header-profile">
              <div className="ai-chat-header-avatar" aria-hidden="true">
                <Bot />
              </div>
              <div className="ai-chat-header-info">
                <h2 id={chatTitleId}>Asistente de Reclutamiento</h2>
                <span className="ai-chat-status-text">
                  Evaluación de perfiles
                </span>
              </div>

              <button
                type="button"
                className="ai-chat-header-close"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar chat"
              >
                <X aria-hidden="true" />
              </button>
            </div>

            <div className="ai-chat-controls">
              <label className="ai-chat-label" htmlFor={jobSelectId}>
                Vacante a evaluar
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
                    <p role="alert">
                      No pudimos cargar las vacantes. Intenta nuevamente.
                    </p>
                    <button
                      type="button"
                      className="ai-chat-retry-btn"
                      onClick={() => void loadJobs()}
                    >
                      Reintentar
                    </button>
                  </>
                )}
                {jobsState === "ready" && jobs.length === 0 && (
                  <p role="status">No hay vacantes disponibles para evaluar.</p>
                )}
              </div>
            </div>
          </header>

          <section
            className="ai-chat-messages"
            aria-label="Conversación con el asistente"
            role="log"
            aria-busy={isLoading}
            aria-relevant="additions text"
          >
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
                    <div className="ai-chat-markdown">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
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
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={isLoading}
                >
                  <MorphingIcon icon={RotateCcw} aria-hidden="true" />
                  Reintentar
                </button>
              </div>
            )}
            <div ref={messagesEndRef} aria-hidden="true" />
          </section>

          <footer className="ai-chat-composer">
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
                    fileError
                      ? `${fileHelpId} ${fileErrorId}`
                      : fileHelpId
                  }
                />

                <p id={fileHelpId} className="ai-chat-upload-help">
                  Adjunta un PDF para compararlo con la vacante seleccionada.
                </p>

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
                      aria-describedby={
                        fileError
                          ? `${fileHelpId} ${fileErrorId}`
                          : fileHelpId
                      }
                    >
                      <UploadCloud aria-hidden="true" />
                      <span>Subir PDF</span>
                    </button>
                  ) : (
                    <div className="ai-upload-file">
                      <div className="ai-upload-file-info">
                        <FileText aria-hidden="true" />
                        <span>{file.name}</span>
                      </div>
                      <button
                        type="button"
                        className="ai-upload-remove"
                        onClick={removeFile}
                        aria-label={`Quitar archivo ${file.name}`}
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
                    {isLoading ? (
                      <>
                        <Loader2
                          className="ai-chat-spin"
                          aria-hidden="true"
                        />
                        Analizando...
                      </>
                    ) : (
                      "Comparar CV"
                    )}
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
                    onClick={handleNewEvaluation}
                    disabled={isLoading}
                  >
                    <MorphingIcon icon={RotateCcw} aria-hidden="true" />
                    <span>Nueva evaluación</span>
                  </button>
                </div>
              </div>
            )}
          </footer>
        </PopoverContent>
      </Popover>
    </>
  );
}

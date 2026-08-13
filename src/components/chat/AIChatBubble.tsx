import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/Popover";
import { CustomSelect } from "@/components/ui/CustomSelect";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bot,
  X,
  UploadCloud,
  FileText,
  Loader2,
  Send,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
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

export function AIChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [jobsState, setJobsState] = useState<JobsState>("idle");

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "system",
      content:
        "Soy tu IA de Reclutamiento.\nSelecciona una vacante y sube un CV en PDF para comenzar la evaluación.",
    },
  ]);

  const [showTooltip, setShowTooltip] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [cvBase64, setCvBase64] = useState<string | null>(null);
  const [hasCompared, setHasCompared] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const selectPdf = (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      setFileError("Selecciona un archivo PDF para continuar.");
      return;
    }

    setFile(selectedFile);
    setCvBase64(null);
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
    setCvBase64(null);
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

  const handleAnalyze = async () => {
    if (!file) {
      setFileError("Adjunta un archivo PDF antes de iniciar la comparación.");
      return;
    }

    setFileError("");
    setIsLoading(true);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "user",
        content: `Por favor analiza el CV adjunto (${file.name}).`,
      },
    ]);

    try {
      const base64Data = await fileToBase64(file);
      const extractedText = await extractTextFromPDF(file);
      setCvBase64(base64Data);

      const catalogText = jobs
        .map(
          (j) =>
            `[ID: ${j.id}] Título: ${j.title}\nRequisitos: ${j.requirements_text || ""}\nResponsabilidades: ${j.responsibilities_text || ""}`,
        )
        .join("\n\n---\n\n");

      const messagesToSend = [
        ...messages,
        {
          id: "temp",
          role: "user",
          content: `Por favor analiza el CV adjunto (${file.name}).`,
        },
      ];

      const { data, error } = await supabase.functions.invoke("compare-cv", {
        body: {
          catalog: catalogText,
          target_job_id: selectedJob || null,
          resume_base64: base64Data,
          resume_text: extractedText,
          messages: messagesToSend,
        },
      });

      if (error || !data?.analysis) throw error ?? new Error("Empty AI response");

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "ai", content: data.analysis },
      ]);
      setHasCompared(true);
    } catch (error) {
      console.error("Error analyzing CV:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: `Lo siento, el asistente está experimentando un alto volumen de tráfico. Por favor, intenta de nuevo en un momento.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText("");
    setIsLoading(true);

    const newMessages: Message[] = [
      ...messages,
      { id: Date.now().toString(), role: "user", content: userMessage },
    ];
    setMessages(newMessages);

    try {
      const catalogText = jobs
        .map(
          (j) =>
            `[ID: ${j.id}] Título: ${j.title}\nRequisitos: ${j.requirements_text || ""}\nResponsabilidades: ${j.responsibilities_text || ""}`,
        )
        .join("\n\n---\n\n");

      let extractedText = "";
      if (file) {
        extractedText = await extractTextFromPDF(file);
      }

      const { data, error } = await supabase.functions.invoke("compare-cv", {
        body: {
          catalog: catalogText,
          target_job_id: selectedJob || null,
          resume_base64: cvBase64,
          resume_text: extractedText,
          messages: newMessages,
        },
      });

      if (error || !data?.analysis) {
        throw error ?? new Error("Empty AI response");
      }

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "ai", content: data.analysis },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: `Lo siento, mi conexión se interrumpió temporalmente. ¿Podrías intentar enviar tu mensaje de nuevo?`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!isOpen && showTooltip && (
        <div className="ai-chat-tooltip">
          <Sparkles aria-hidden="true" />
          <span>Evaluar un CV</span>
          <button
            type="button"
            className="ai-chat-tooltip-close"
            onClick={() => setShowTooltip(false)}
            aria-label="Cerrar sugerencia"
          >
            <X aria-hidden="true" />
          </button>
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
            {isOpen ? (
              <X aria-hidden="true" />
            ) : (
              <Bot aria-hidden="true" />
            )}
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
                  <span className="sr-only">El asistente está analizando.</span>
                  <div className="ai-typing-indicator" aria-hidden="true">
                    <span className="ai-dot" />
                    <span className="ai-dot" />
                    <span className="ai-dot" />
                  </div>
                </div>
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
                    onClick={handleAnalyze}
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
              <form onSubmit={handleSendMessage} className="ai-chat-input-form">
                <label htmlFor={messageInputId} className="sr-only">
                  Pregunta sobre el candidato
                </label>
                <input
                  id={messageInputId}
                  type="text"
                  placeholder="Pregunta sobre este candidato..."
                  value={inputText}
                  onChange={(event) => setInputText(event.target.value)}
                  disabled={isLoading}
                  className="ai-chat-text-input"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading}
                  className="ai-chat-send-btn"
                  aria-label={isLoading ? "Enviando pregunta" : "Enviar pregunta"}
                  aria-busy={isLoading}
                >
                  {isLoading ? (
                    <Loader2
                      className="ai-chat-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Send aria-hidden="true" />
                  )}
                </button>
              </form>
            )}
          </footer>
        </PopoverContent>
      </Popover>
    </>
  );
}

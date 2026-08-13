import React, { useState, useEffect, useRef } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/Popover";
import { CustomSelect } from "@/components/ui/CustomSelect";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bot,
  X,
  UploadCloud,
  FileText,
  Loader2,
  Send,
  User,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
// @ts-ignore: Propiedad no expuesta en los tipos oficiales pero válida en runtime
pdfjsLib.GlobalWorkerOptions.verbosity = 0; // Solo mostrar errores fatales, ocultar warnings
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

export function AIChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [model, setModel] = useState<
    "gemini" | "kimi" | "deepseek" | "openrouter"
  >("gemini");

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
  const [cvBase64, setCvBase64] = useState<string | null>(null);
  const [hasCompared, setHasCompared] = useState(false);
  const [inputText, setInputText] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && jobs.length === 0) {
      loadJobs();
    }
  }, [isOpen]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const loadJobs = async () => {
    const { data, error } = await supabase
      .from("job_descriptions")
      .select("id, title, requirements_text, responsibilities_text");

    if (data) {
      setJobs(data);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
      } else {
        alert("Por favor, sube únicamente archivos PDF.");
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
      } else {
        alert("Por favor, sube únicamente archivos PDF.");
      }
    }
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
          .map((item: any) => item.str)
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
    if (!file) return;

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
          model: model,
        },
      });

      if (error) throw error;

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "ai", content: data.analysis },
      ]);
      setHasCompared(true);
    } catch (error: any) {
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
          model: model,
        },
      });

      if (error) throw new Error("Error interno del servicio AI.");

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "ai", content: data.analysis },
      ]);
    } catch (error: any) {
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
          <Sparkles size={16} />
          <span>Chat bot</span>
          <button
            className="ai-chat-tooltip-close"
            onClick={() => setShowTooltip(false)}
            aria-label="Cerrar sugerencia"
          >
            <X size={14} />
          </button>
          <div className="ai-chat-tooltip-arrow" />
        </div>
      )}

      <Popover
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
        }}
      >
        <PopoverTrigger asChild>
          <button
            className="ai-chat-bubble-trigger"
            aria-label="Abrir asistente IA"
          >
            {isOpen ? <X size={24} /> : <Bot size={24} />}
          </button>
        </PopoverTrigger>

        <PopoverContent
          side="top"
          align="end"
          sideOffset={16}
          className="ai-chat-window-content"
        >
          <div className="ai-chat-header">
            <div className="ai-chat-header-profile">
              <div className="ai-chat-header-avatar">
                <Bot size={20} />
                <span className="ai-chat-status-dot"></span>
              </div>
              <div className="ai-chat-header-info">
                <h3>Asistente de Reclutamiento</h3>
                <span className="ai-chat-status-text">En línea</span>
              </div>

              <button
                className="ai-chat-header-close"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar chat"
              >
                <X size={18} />
              </button>
            </div>
            <div className="ai-chat-controls">
              <CustomSelect
                value={selectedJob}
                onChange={setSelectedJob}
                options={[
                  { value: "", label: "Auto-perfilar" },
                  ...jobs.map((j) => ({
                    value: j.id,
                    label: j.title
                      .toLowerCase()
                      .replace(/(?:^|\s)\S/g, (a) => a.toUpperCase()),
                  })),
                ]}
                disabled={isLoading || jobs.length === 0}
                placeholder={
                  jobs.length === 0
                    ? "Cargando perfiles..."
                    : "Selecciona un puesto a evaluar..."
                }
              />
            </div>
          </div>

          <div className="ai-chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`ai-chat-message ${msg.role}`}>
                {msg.role !== "user" && (
                  <div className="ai-chat-avatar">
                    <Bot size={16} />
                  </div>
                )}
                <div className="ai-chat-content">
                  {msg.role === "ai" || msg.role === "system" ? (
                    <div className="ai-chat-markdown">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          table: ({ node, ...props }) => (
                            <div className="ai-chat-table-wrapper">
                              <table {...props} />
                            </div>
                          ),
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div
                      style={{
                        whiteSpace: "pre-wrap",
                        lineHeight: "var(--type-body-sm-line)",
                      }}
                    >
                      {msg.content}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="ai-chat-message ai">
                <div className="ai-chat-avatar">
                  <Bot size={16} />
                </div>
                <div className="ai-chat-content">
                  <div className="ai-typing-indicator">
                    <div className="ai-dot"></div>
                    <div className="ai-dot"></div>
                    <div className="ai-dot"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="ai-chat-upload-area">
            {!hasCompared ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                  gap: "var(--spacing-sm)",
                  width: "100%",
                }}
              >
                <input
                  type="file"
                  accept="application/pdf"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />

                {!file ? (
                  <div
                    className={`ai-upload-box ${isDragging ? "dragging" : ""}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "var(--spacing-sm)",
                    }}
                  >
                    <UploadCloud size={20} color="var(--color-muted)" />
                    <p>Subir PDF</p>
                  </div>
                ) : (
                  <div
                    className="ai-upload-box"
                    style={{
                      borderColor: "var(--color-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "var(--spacing-md) var(--spacing-lg)",
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--spacing-sm)",
                        minWidth: 0,
                      }}
                    >
                      <FileText size={20} color="var(--color-primary)" />
                      <p
                        style={{
                          color: "var(--color-ink)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {file.name}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      style={{
                        background: "var(--color-canvas-soft)",
                        border: "none",
                        color: "var(--color-ink)",
                        padding: "var(--spacing-xs)",
                        borderRadius: "var(--rounded-xs)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                      title="Quitar archivo"
                      aria-label="Quitar archivo"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                <button
                  className="ai-chat-submit-btn"
                  onClick={handleAnalyze}
                  disabled={!file || isLoading}
                  style={{ height: "100%" }}
                >
                  {isLoading ? (
                    <>
                      <Loader2
                        size={16}
                        className="ai-chat-spin"
                        style={{
                          display: "inline",
                          marginRight: "var(--spacing-sm)",
                        }}
                      />
                      Analizando...
                    </>
                  ) : (
                    "Comparar CV"
                  )}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="ai-chat-input-form">
                <input
                  type="text"
                  placeholder="Pregunta algo sobre este candidato..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={isLoading}
                  className="ai-chat-text-input"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading}
                  className="ai-chat-send-btn"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="ai-chat-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </form>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}

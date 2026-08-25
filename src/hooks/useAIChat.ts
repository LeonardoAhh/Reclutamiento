import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
import {
  AI_CHAT_CONTEXT_CONFIG,
  AI_CHAT_ERROR_MESSAGES,
  AI_CHAT_QUICK_ACTIONS,
} from "@/lib/constants";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
Object.assign(pdfjsLib.GlobalWorkerOptions, { verbosity: 0 });

export interface JobDescription {
  id: string;
  title: string;
  requirements_text: string | null;
  responsibilities_text: string | null;
}

export interface AnalysisData {
  matchScore: number;
  roles: { title: string; match: number; reason: string }[];
  strengths: string[];
  weaknesses: string[];
  flags: string[];
}

export interface Message {
  id: string;
  role: "system" | "user" | "ai";
  content: string;
  analysisData?: AnalysisData | null;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: Message[];
  selectedJobId: string;
  evaluatedJobName: string;
  candidateFileName: string;
  resumeText: string;
  evaluationResult: string;
  hasCompared: boolean;
  createdAt: string;
  updatedAt: string;
}

type ConversationSyncState = "idle" | "loading" | "synced" | "local";

interface ChatConversationRow {
  id: string;
  title: string;
  messages: Message[];
  selected_job_id: string | null;
  evaluated_job_name: string | null;
  candidate_file_name: string | null;
  resume_text: string;
  evaluation_result: string;
  has_compared: boolean;
  created_at: string;
  updated_at: string;
}

const CHAT_HISTORY_STORAGE_PREFIX = "ai_chat_history_v1";

function getHistoryStorageKey(userId: string): string {
  return `${CHAT_HISTORY_STORAGE_PREFIX}:${userId}`;
}

function readLocalHistory(userId: string): ChatConversation[] {
  try {
    const value = localStorage.getItem(getHistoryStorageKey(userId));
    return value ? (JSON.parse(value) as ChatConversation[]) : [];
  } catch {
    return [];
  }
}

function writeLocalHistory(userId: string, conversations: ChatConversation[]) {
  try {
    localStorage.setItem(getHistoryStorageKey(userId), JSON.stringify(conversations));
  } catch (error) {
    console.warn("No se pudo guardar el historial local del asistente:", error);
  }
}

function conversationFromRow(row: ChatConversationRow): ChatConversation {
  return {
    id: row.id,
    title: row.title,
    messages: row.messages,
    selectedJobId: row.selected_job_id ?? "",
    evaluatedJobName: row.evaluated_job_name ?? "",
    candidateFileName: row.candidate_file_name ?? "",
    resumeText: row.resume_text ?? "",
    evaluationResult: row.evaluation_result ?? "",
    hasCompared: row.has_compared,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function conversationToRow(conversation: ChatConversation, userId: string) {
  return {
    id: conversation.id,
    user_id: userId,
    title: conversation.title,
    selected_job_id: conversation.selectedJobId || null,
    evaluated_job_name: conversation.evaluatedJobName || null,
    candidate_file_name: conversation.candidateFileName || null,
    resume_text: conversation.resumeText,
    evaluation_result: conversation.evaluationResult,
    has_compared: conversation.hasCompared,
    messages: conversation.messages,
    created_at: conversation.createdAt,
    updated_at: conversation.updatedAt,
  };
}

function buildConversationTitle(fileName: string, jobName: string): string {
  const candidateName = fileName.replace(/\.pdf$/i, "").trim();
  if (candidateName && jobName && jobName !== "Auto-perfilar") {
    return `${candidateName} · ${jobName}`;
  }
  return candidateName || jobName || "Nueva evaluación";
}

const INITIAL_MESSAGE: Message = {
  id: "initial",
  role: "system",
  content:
    "¡Hola! Soy tu asistente de reclutamiento.\n\nPara comenzar, selecciona una vacante y adjunta el CV de un candidato en formato PDF. Lo analizaré al instante para decirte qué tan bien encaja con el perfil que buscas.",
};

export type JobsState = "idle" | "loading" | "ready" | "error";
export type QuickActionTask = (typeof AI_CHAT_QUICK_ACTIONS)[number]["task"];
export type ChatTask = "follow_up" | QuickActionTask;

export type ChatRetry =
  | { kind: "analysis" }
  | { kind: "message"; task: ChatTask; userMessage: string };

export interface ChatErrorState {
  message: string;
  retry: ChatRetry;
}

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
        .map((item) => ("str" in item ? (item as any).str : ""))
        .join(" ");
      fullText += pageText + "\n";
    }
    return fullText;
  } catch (e) {
    console.error("Error extrayendo texto del PDF:", e);
    return "";
  }
};

export function useAIChat() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [jobsState, setJobsState] = useState<JobsState>("idle");

  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [file, setFile] = useState<File | null>(null);
  const [candidateFileName, setCandidateFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const [cvText, setCvText] = useState("");
  const [hasCompared, setHasCompared] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState("");
  const [evaluatedJobName, setEvaluatedJobName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatError, setChatError] = useState<ChatErrorState | null>(null);
  const [sessionId, setSessionId] = useState<string>(() => crypto.randomUUID());
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [conversationSyncState, setConversationSyncState] =
    useState<ConversationSyncState>("idle");
  const [activeQuickAction, setActiveQuickAction] = useState<QuickActionTask | null>(null);

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
    if (jobsState === "idle") {
      void loadJobs();
    }
  }, [jobsState, loadJobs]);

  const applyConversation = useCallback((conversation: ChatConversation) => {
    setSessionId(conversation.id);
    setMessages(conversation.messages.length > 0 ? conversation.messages : [INITIAL_MESSAGE]);
    setSelectedJob(conversation.selectedJobId);
    setEvaluatedJobName(conversation.evaluatedJobName);
    setCandidateFileName(conversation.candidateFileName);
    setCvText(conversation.resumeText);
    setEvaluationResult(conversation.evaluationResult);
    setHasCompared(conversation.hasCompared);
    setFile(null);
    setFileError("");
    setChatError(null);
    setActiveQuickAction(null);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    const localConversations = readLocalHistory(user.id);

    setConversations(localConversations);
    if (localConversations[0]) applyConversation(localConversations[0]);
    setConversationSyncState("loading");

    void (async () => {
      const { data, error } = await supabase
        .from("ai_chat_sessions")
        .select("*")
        .order("updated_at", { ascending: false });

      if (cancelled) return;
      if (error) {
        console.warn("No se pudo sincronizar el historial del asistente:", error);
        setConversationSyncState("local");
        return;
      }

      const merged = new Map<string, ChatConversation>();
      const remoteConversations = ((data ?? []) as ChatConversationRow[]).map(
        conversationFromRow,
      );
      const remoteById = new Map(
        remoteConversations.map((conversation) => [conversation.id, conversation]),
      );
      [...remoteConversations, ...localConversations].forEach((conversation) => {
        const current = merged.get(conversation.id);
        if (!current || conversation.updatedAt > current.updatedAt) {
          merged.set(conversation.id, conversation);
        }
      });
      const next = Array.from(merged.values()).sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      );
      const pendingLocal = localConversations.filter((conversation) => {
        const remote = remoteById.get(conversation.id);
        return !remote || conversation.updatedAt > remote.updatedAt;
      });

      let syncFailed = false;
      if (pendingLocal.length > 0) {
        const { error: syncError } = await supabase
          .from("ai_chat_sessions")
          .upsert(
            pendingLocal.map((conversation) =>
              conversationToRow(conversation, user.id),
            ),
          );
        if (syncError) {
          syncFailed = true;
          console.warn("El historial local quedó pendiente de sincronización:", syncError);
        }
      }

      if (cancelled) return;
      setConversations(next);
      writeLocalHistory(user.id, next);
      if (next[0]) applyConversation(next[0]);
      setConversationSyncState(syncFailed ? "local" : "synced");
    })();

    return () => {
      cancelled = true;
    };
  }, [applyConversation, user?.id]);

  const saveConversation = useCallback(
    (conversation: ChatConversation) => {
      setConversations((current) => {
        const next = [
          conversation,
          ...current.filter((item) => item.id !== conversation.id),
        ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        if (user?.id) writeLocalHistory(user.id, next);
        return next;
      });

      if (!user?.id) return;
      setConversationSyncState("loading");
      void supabase
        .from("ai_chat_sessions")
        .upsert(conversationToRow(conversation, user.id))
        .then(({ error }) => {
          if (error) {
            console.warn("Conversación guardada solo en este dispositivo:", error);
            setConversationSyncState("local");
            return;
          }
          setConversationSyncState("synced");
        });
    },
    [user?.id],
  );

  const persistMessages = (
    newMessages: Message[],
    overrides: Partial<ChatConversation> = {},
  ) => {
    setMessages(newMessages);
    const now = new Date().toISOString();
    const nextFileName =
      overrides.candidateFileName ?? candidateFileName ?? file?.name ?? "";
    const nextJobName = overrides.evaluatedJobName ?? evaluatedJobName;
    const nextHasCompared = overrides.hasCompared ?? hasCompared;

    if (newMessages.length <= 1 && !nextHasCompared) return;

    saveConversation({
      id: sessionId,
      title:
        overrides.title ?? buildConversationTitle(nextFileName, nextJobName),
      messages: newMessages,
      selectedJobId: overrides.selectedJobId ?? selectedJob,
      evaluatedJobName: nextJobName,
      candidateFileName: nextFileName,
      resumeText: overrides.resumeText ?? cvText,
      evaluationResult: overrides.evaluationResult ?? evaluationResult,
      hasCompared: nextHasCompared,
      createdAt:
        overrides.createdAt ??
        conversations.find((item) => item.id === sessionId)?.createdAt ??
        now,
      updatedAt: now,
    });
  };

  const selectPdf = (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      setFileError("Selecciona un archivo PDF para continuar.");
      return;
    }
    setFile(selectedFile);
    setCandidateFileName(selectedFile.name);
    setCvText("");
    setFileError("");
  };

  const removeFile = () => {
    setFile(null);
    setCandidateFileName("");
    setCvText("");
    setFileError("");
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

      const jobName =
        jobs.find((job) => job.id === selectedJob)?.title ?? "Auto-perfilar";
      const resultMessages: Message[] = [
        ...messagesToSend,
        {
          id: crypto.randomUUID(),
          role: "ai",
          content: data.analysis,
          analysisData: data.analysisData,
        },
      ];
      persistMessages(resultMessages, {
        selectedJobId: selectedJob,
        evaluatedJobName: jobName,
        candidateFileName: file.name,
        resumeText: extractedText,
        evaluationResult: data.analysis,
        hasCompared: true,
      });
      setEvaluationResult(data.analysis);
      setEvaluatedJobName(jobName);
      setCandidateFileName(file.name);
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

    setChatError(null);
    setActiveQuickAction(task === "follow_up" ? null : task);
    setIsLoading(true);
    if (appendUserMessage) persistMessages(messagesToSend);

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

      persistMessages([
        ...messagesToSend,
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

  const handleRetry = () => {
    if (!chatError || isLoading) return;
    const { retry } = chatError;
    setChatError(null);
    if (retry.kind === "analysis") {
      void handleAnalyze(false);
      return;
    }
    void requestAssistantMessage(retry.userMessage, retry.task, false);
  };

  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      const conversation = conversations.find(
        (item) => item.id === conversationId,
      );
      if (conversation) applyConversation(conversation);
    },
    [applyConversation, conversations],
  );

  const handleNewEvaluation = () => {
    setMessages([INITIAL_MESSAGE]);
    setFile(null);
    setCandidateFileName("");
    setCvText("");
    setHasCompared(false);
    setEvaluationResult("");
    setEvaluatedJobName("");
    setFileError("");
    setChatError(null);
    setActiveQuickAction(null);
    setSessionId(crypto.randomUUID());
  };

  return {
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
    activeQuickAction,
  };
}

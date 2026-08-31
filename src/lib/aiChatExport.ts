interface EvaluationShareInput {
  analysis: string;
  candidateFileName: string;
  jobName: string;
}

interface StructuredEvaluation {
  candidateName?: string;
  matchScore?: number;
  roles?: Array<{ title?: string; match?: number; reason?: string }>;
  strengths?: string[];
  weaknesses?: string[];
  flags?: string[];
  hiringReason?: string;
  interviewQuestions?: Array<string | StructuredStarQuestion>;
}

interface StructuredStarQuestion {
  competency?: string;
  question?: string;
  star?: {
    situation?: string;
    task?: string;
    action?: string;
    result?: string;
  };
}

function formatInterviewQuestion(
  question: string | StructuredStarQuestion,
  index: number,
): string {
  if (typeof question === "string") return `${index + 1}. ${question}`;

  const heading = question.competency
    ? `${index + 1}. ${question.competency}: ${question.question ?? ""}`
    : `${index + 1}. ${question.question ?? "Pregunta no especificada"}`;
  const star = question.star;
  if (!star) return heading;

  return [
    heading,
    star.situation ? `   Situación: ${star.situation}` : "",
    star.task ? `   Tarea: ${star.task}` : "",
    star.action ? `   Acción: ${star.action}` : "",
    star.result ? `   Resultado: ${star.result}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function removeArtificialTracking(value: string): string {
  let normalized = value;
  const trackedWord = /(?:\b[\p{L}\p{N}]\s+){2,}[\p{L}\p{N}]\b/gu;

  while (trackedWord.test(normalized)) {
    normalized = normalized.replace(trackedWord, (match) =>
      match.replace(/\s+/g, ""),
    );
    trackedWord.lastIndex = 0;
  }

  return normalized.replace(/\s*\/\s*/g, "/");
}

function markdownToPlainText(markdown: string): string {
  return removeArtificialTracking(markdown)
    .replace(/✅/g, "")
    .replace(/❌/g, "")
    .replace(/⚠️?/g, "")
    .replace(/[🔹🚩💡]/g, "")
    .replace(/```[\w-]*\n?([\s\S]*?)```/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/^\s*>\s?/gm, "")
    .replace(/^\|?[\s:|-]+\|?\s*$/gm, "")
    .replace(/\s*\|\s*/g, " · ")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/[*_~`]/g, "")
    .replace(/^(Cumple|Falta\/Brecha|Brecha|Parcial):\s*\1:\s*/gim, "$1: ")
    .replace(/^Falta\/Brecha:\s*/gim, "Brecha: ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function structuredEvaluationToPlainText(
  analysis: string,
): string | null {
  try {
    const parsed = JSON.parse(
      analysis.replace(/^```json\n?|```$/gm, "").trim(),
    ) as StructuredEvaluation;
    if (!parsed || typeof parsed !== "object") return null;

    const sections: string[] = [];
    if (parsed.candidateName) {
      sections.push(`Candidato: ${parsed.candidateName}`);
    }
    if (typeof parsed.matchScore === "number") {
      sections.push(`Afinidad general: ${parsed.matchScore}%`);
    }
    if (parsed.roles?.length) {
      sections.push(
        "Roles recomendados",
        ...parsed.roles.map((role) => {
          const match = typeof role.match === "number" ? ` (${role.match}%)` : "";
          const reason = role.reason ? `: ${role.reason}` : "";
          return `• ${role.title ?? "Rol no especificado"}${match}${reason}`;
        }),
      );
    }
    if (parsed.strengths?.length) {
      sections.push("Fortalezas", ...parsed.strengths.map((item) => `• ${item}`));
    }
    if (parsed.weaknesses?.length) {
      sections.push("Brechas", ...parsed.weaknesses.map((item) => `• ${item}`));
    }
    if (parsed.hiringReason) {
      sections.push("Por qué considerar su contratación", parsed.hiringReason);
    }
    if (parsed.interviewQuestions?.length) {
      sections.push(
        "Preguntas sugeridas para entrevista",
        ...parsed.interviewQuestions.map(formatInterviewQuestion),
      );
    }
    if (parsed.flags?.length && parsed.flags[0] !== "Ninguna") {
      sections.push("Banderas rojas", ...parsed.flags.map((item) => `• ${item}`));
    }

    return sections.length > 0 ? sections.join("\n") : null;
  } catch {
    return null;
  }
}

export function buildEvaluationShareText({
  analysis,
  candidateFileName,
  jobName,
}: EvaluationShareInput): string {
  const formattedAnalysis =
    structuredEvaluationToPlainText(analysis) ?? markdownToPlainText(analysis);

  return [
    "Evaluación de candidato",
    `CV: ${candidateFileName}`,
    `Vacante: ${jobName}`,
    "",
    formattedAnalysis,
  ].join("\n");
}

export async function copyEvaluationText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.className = "sr-only";
  textArea.setAttribute("readonly", "");
  document.body.appendChild(textArea);
  textArea.select();
  const copied = document.execCommand("copy");
  textArea.remove();

  if (!copied) {
    throw new Error("El navegador no permitió copiar el contenido.");
  }
}

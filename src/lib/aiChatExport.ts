interface EvaluationShareInput {
  analysis: string;
  candidateFileName: string;
  jobName: string;
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

export function buildEvaluationShareText({
  analysis,
  candidateFileName,
  jobName,
}: EvaluationShareInput): string {
  return [
    "Evaluación de candidato",
    `CV: ${candidateFileName}`,
    `Vacante: ${jobName}`,
    "",
    markdownToPlainText(analysis),
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

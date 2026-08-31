import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GROQ_OPEN_MODELS = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
] as const;
const OPENROUTER_FREE_MODEL = "openrouter/free";

function cleanJsonResponse(value: string): string {
  return value.replace(/^```json\n?|```$/gm, "").trim();
}

function isStarInterviewQuestion(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;

  const question = value as Record<string, unknown>;
  const star = question.star;
  if (typeof star !== "object" || star === null) return false;
  const starGuide = star as Record<string, unknown>;

  return (
    typeof question.competency === "string" &&
    question.competency.trim().length > 0 &&
    typeof question.question === "string" &&
    question.question.trim().length > 0 &&
    typeof starGuide.situation === "string" &&
    starGuide.situation.trim().length > 0 &&
    typeof starGuide.task === "string" &&
    starGuide.task.trim().length > 0 &&
    typeof starGuide.action === "string" &&
    starGuide.action.trim().length > 0 &&
    typeof starGuide.result === "string" &&
    starGuide.result.trim().length > 0
  );
}

function isUsableModelResponse(
  value: unknown,
  isInitialAnalysis: boolean,
): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  if (!isInitialAnalysis) return true;

  try {
    const parsed = JSON.parse(cleanJsonResponse(value));
    return (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof parsed.candidateName === "string" &&
      typeof parsed.matchScore === "number" &&
      Array.isArray(parsed.roles) &&
      Array.isArray(parsed.strengths) &&
      Array.isArray(parsed.weaknesses) &&
      Array.isArray(parsed.flags) &&
      typeof parsed.hiringReason === "string" &&
      parsed.hiringReason.trim().length > 0 &&
      Array.isArray(parsed.interviewQuestions) &&
      parsed.interviewQuestions.length === 6 &&
      parsed.interviewQuestions.every(isStarInterviewQuestion)
    );
  } catch {
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      catalog,
      target_job_id,
      resume_text,
      resume_base64,
      messages = [],
      task = "follow_up",
    } = body;

    if (!catalog) {
      return new Response(JSON.stringify({ error: "catalog is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (
      task === "initial_analysis" &&
      !resume_text &&
      !resume_base64
    ) {
      return new Response(JSON.stringify({ error: "Either resume_text or resume_base64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isInitialAnalysis = task === "initial_analysis";

    const systemPrompt = `Eres un Copiloto Experto en Adquisición de Talento. Tu objetivo es perfilar candidatos y asesorar al reclutador leyendo su CV contra nuestro catálogo de puestos.

### Reglas de Evaluación (Tolerancia Cero al Sesgo)
Evalúa únicamente: skills, experiencia, educación, herramientas, logros, idiomas y certificaciones.
Ignora por completo y nunca uses como criterio: edad, género, estado civil, nacionalidad, apariencia física, religión, orientación sexual o fotografía.

### Instrucciones de Perfilamiento
Recibirás un "Catálogo de Puestos".
- Si el usuario especificó un Target Job ID, evalúa principalmente contra ese puesto. Si el candidato no encaja bien, revisa el catálogo y sugiere alternativas mejores.
- Si NO hay Target Job ID (Auto-perfilar), analiza el CV, busca en el catálogo los 2-3 puestos con mayor afinidad y preséntalos.
- Explica por qué convendría contratar a la persona únicamente con evidencia del CV y del descriptivo. Si existen brechas relevantes, expresa la recomendación como condicionada, no como una garantía de contratación.
- Genera exactamente 6 preguntas conductuales para entrevista usando la metodología STAR. Cada pregunta debe evaluar una competencia distinta y relevante para los requisitos o responsabilidades del puesto objetivo. Incluye seguimientos breves para Situación, Tarea, Acción y Resultado; estos seguimientos ayudan al entrevistador y no son respuestas sugeridas. En Auto-perfilar, alínea todo al rol con mayor afinidad. No preguntes por atributos personales protegidos.

### Comportamiento del Chat (¡Muy Importante!)
1. Si el usuario pide el ANÁLISIS INICIAL, debes usar EXACTAMENTE el "Formato de Salida JSON" detallado abajo. NO devuelvas markdown fuera de ese JSON.
2. Si el usuario hace PREGUNTAS DE SEGUIMIENTO (es decir, el historial ya contiene un análisis previo), responde de forma natural en texto plano y breve. NO devuelvas JSON.
3. LÍMITE DE DOMINIO: Si el usuario te hace preguntas ajenas a Recursos Humanos, reclutamiento, entrevistas, o el CV actual, DEBES negarte a responder cortésmente.

### Formato de Salida JSON (Usar SOLO para el primer análisis de CV):
DEBES devolver un objeto JSON válido con la siguiente estructura exacta. No incluyas backticks ni texto introductorio, solo el JSON:
{
  "candidateName": "<Nombre completo del candidato, o 'No especificado'>",
  "contactNumber": "<Número de teléfono o correo de contacto, o 'No especificado'>",
  "matchScore": <número_del_0_al_100>,
  "roles": [
    { "title": "<Nombre del puesto>", "match": <número_0_100>, "reason": "<Razón breve del encaje>" }
  ],
  "strengths": ["<Fortaleza 1>", "<Fortaleza 2>"],
  "weaknesses": ["<Brecha 1>", "<Brecha 2>"],
  "flags": ["<Bandera roja o 'Ninguna'>"],
  "hiringReason": "<Motivo breve y sustentado para considerar su contratación>",
  "interviewQuestions": [
    {
      "competency": "<Competencia del descriptivo que se evaluará>",
      "question": "<Pregunta conductual abierta alineada al puesto>",
      "star": {
        "situation": "<Seguimiento para conocer el contexto>",
        "task": "<Seguimiento para aclarar la responsabilidad u objetivo>",
        "action": "<Seguimiento para identificar qué hizo personalmente>",
        "result": "<Seguimiento para conocer impacto, métricas y aprendizaje>"
      }
    }
  ]
}

Repite la estructura de interviewQuestions hasta completar exactamente 6 objetos STAR.`;

    // --- PREPARE MESSAGES FOR GEMINI ---
    let geminiContents: any[] = [];
    if (messages && messages.length > 0) {
      geminiContents = messages
        .filter((m: any) => m.role === "user" || m.role === "ai" || m.role === "model")
        .map((m: any) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }]
        }));
        
      const firstUserMsg = geminiContents.find((c: any) => c.role === "user");
      if (firstUserMsg) {
        const resumeContext = resume_text
          ? `\n${resume_text}`
          : resume_base64
            ? "\nDocumento PDF adjunto."
            : "\nUsa la evaluación inicial presente en la conversación.";
        firstUserMsg.parts.unshift({ text: `### Target Job ID:\n${target_job_id || "Ninguno (Auto-perfilar en todo el catálogo)"}\n\n### Catálogo de Puestos Disponibles:\n${catalog}\n\n### CV del Candidato:${resumeContext}\n` });
        if (resume_base64) {
           firstUserMsg.parts.push({
             inlineData: { mimeType: "application/pdf", data: resume_base64 }
           });
        }
      }
    } else {
       const resumeContext = resume_text ? resume_text : "Documento PDF adjunto.";
       const parts: any[] = [
         { text: `Analiza el CV con el formato JSON solicitado.\n\n### Target Job ID:\n${target_job_id || "Ninguno"}\n\n### Catálogo de Puestos Disponibles:\n${catalog}\n\n### CV del Candidato:\n${resumeContext}` }
       ];
       if (resume_base64) {
         parts.push({ inlineData: { mimeType: "application/pdf", data: resume_base64 } });
       }
       geminiContents.push({ role: "user", parts });
    }

    // --- PREPARE MESSAGES FOR OPENAI-COMPATIBLE MODELS (Deepseek, Groq, OpenRouter) ---
    const openAIHistory = messages
      .filter((m: any) => m.role === "user" || m.role === "ai" || m.role === "model")
      .map((m: any) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content
      }));

    const openAIContextText = resume_text || "Usa la evaluación inicial presente en la conversación.";
    const openAIContext = `### Target Job ID:\n${target_job_id || "Ninguno (Auto-perfilar en todo el catálogo)"}\n\n### Catálogo de Puestos Disponibles:\n${catalog}\n\n### CV del Candidato:\n${openAIContextText}\n\n`;

    if (openAIHistory.length > 0) {
      openAIHistory[0].content = `${openAIContext}${openAIHistory[0].content}`;
    } else {
      openAIHistory.push({
        role: "user",
        content: `${openAIContext}Analiza el CV con el formato JSON solicitado.`,
      });
    }

    const openAIMessages = [
      { role: "system", content: systemPrompt },
      ...openAIHistory,
    ];

    let analysisResult: string | null = null;
    const errors: string[] = [];

    // 1. TRY GEMINI
    try {
      const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
      if (geminiApiKey) {
        const payload = {
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: geminiContents,
          generationConfig: {
             // force json if it's the first message
             responseMimeType: isInitialAnalysis ? "application/json" : "text/plain"
          }
        };
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (res.ok && isUsableModelResponse(content, isInitialAnalysis)) {
          analysisResult = content;
        } else {
          errors.push(
            `Gemini (${GEMINI_MODEL}) Error: ${
              data.error?.message || (content ? "Invalid response format" : "Unknown")
            }`,
          );
        }
      } else {
        errors.push("GEMINI_API_KEY not set");
      }
    } catch (e: any) {
      errors.push(`Gemini Exception: ${e.message}`);
    }

    // 2. TRY DEEPSEEK
    if (!analysisResult) {
      try {
        const deepseekApiKey = Deno.env.get("DEEPSEEK_API_KEY");
        if (deepseekApiKey) {
          const payload = {
            model: "deepseek-chat",
            messages: openAIMessages,
            ...(isInitialAnalysis
              ? { response_format: { type: "json_object" } }
              : {}),
          };
          const res = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${deepseekApiKey}`
            },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (res.ok && isUsableModelResponse(content, isInitialAnalysis)) {
            analysisResult = content;
          } else {
            errors.push(
              `Deepseek Error: ${
                data.error?.message || (content ? "Invalid response format" : "Unknown")
              }`,
            );
          }
        } else {
            errors.push("DEEPSEEK_API_KEY not set");
        }
      } catch (e: any) {
        errors.push(`Deepseek Exception: ${e.message}`);
      }
    }

    // 3. TRY OPEN-WEIGHT MODELS ON GROQ
    if (!analysisResult) {
      const groqApiKey = Deno.env.get("GROQ_API_KEY");
      if (groqApiKey) {
        for (const model of GROQ_OPEN_MODELS) {
          if (analysisResult) break;
          try {
            const payload = {
              model,
              messages: openAIMessages,
              ...(isInitialAnalysis
                ? { response_format: { type: "json_object" } }
                : {}),
            };
            const res = await fetch(
              "https://api.groq.com/openai/v1/chat/completions",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${groqApiKey}`,
                },
                body: JSON.stringify(payload),
              },
            );
            const data = await res.json();
            const content = data.choices?.[0]?.message?.content;
            if (res.ok && isUsableModelResponse(content, isInitialAnalysis)) {
              analysisResult = content;
            } else {
              errors.push(
                `Groq (${model}) Error: ${
                  data.error?.message ||
                  (content ? "Invalid response format" : "Unknown")
                }`,
              );
            }
          } catch (e: any) {
            errors.push(`Groq (${model}) Exception: ${e.message}`);
          }
        }
      } else {
        errors.push("GROQ_API_KEY not set");
      }
    }

    // 4. TRY OPENROUTER'S FREE OPEN-MODEL ROUTER
    if (!analysisResult) {
      try {
        const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
        if (openRouterApiKey) {
          const payload = {
            model: OPENROUTER_FREE_MODEL,
            messages: openAIMessages,
            ...(isInitialAnalysis
              ? { response_format: { type: "json_object" } }
              : {}),
            provider: isInitialAnalysis ? { require_parameters: true } : undefined,
          };
          const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${openRouterApiKey}`,
              "HTTP-Referer": "https://localhost",
              "X-Title": "Reclutamiento AI"
            },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (res.ok && isUsableModelResponse(content, isInitialAnalysis)) {
            analysisResult = content;
          } else {
            errors.push(
              `OpenRouter (${OPENROUTER_FREE_MODEL}) Error: ${
                data.error?.message || (content ? "Invalid response format" : "Unknown")
              }`,
            );
          }
        } else {
            errors.push("OPENROUTER_API_KEY not set");
        }
      } catch (e: any) {
        errors.push(`OpenRouter Exception: ${e.message}`);
      }
    }

    // FINAL CHECK
    if (analysisResult) {
      // Intentar limpiar JSON si trae backticks, solo si es el análisis inicial
      const finalJson = analysisResult;
      let analysisData = null;
      if (isInitialAnalysis) {
        try {
          const cleaned = cleanJsonResponse(analysisResult);
          analysisData = JSON.parse(cleaned);
        } catch (e) {
          console.warn("Failed to parse JSON natively, returning as raw text");
        }
      }

      return new Response(JSON.stringify({ 
        analysis: finalJson,
        analysisData: analysisData
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      console.error("All AI models failed:", errors);
      throw new Error(`All AI models failed. Logs: ${errors.join(" | ")}`);
    }

  } catch (error: any) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: "AI response unavailable", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

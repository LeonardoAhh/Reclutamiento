import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AiTask =
  | "initial_analysis"
  | "follow_up"
  | "interview_guide"
  | "executive_summary"
  | "candidate_message";

type AiModel = "gemini" | "deepseek" | "openrouter";

function resolveAiModel(task: AiTask): AiModel {
  if (
    task === "candidate_message" &&
    Deno.env.get("OPENROUTER_API_KEY")
  ) {
    return "openrouter";
  }

  if (
    (task === "interview_guide" || task === "executive_summary") &&
    Deno.env.get("DEEPSEEK_API_KEY")
  ) {
    return "deepseek";
  }

  return "gemini";
}

function normalizeTask(value: unknown): AiTask {
  const supportedTasks: AiTask[] = [
    "initial_analysis",
    "follow_up",
    "interview_guide",
    "executive_summary",
    "candidate_message",
  ];

  return typeof value === "string" && supportedTasks.includes(value as AiTask)
    ? (value as AiTask)
    : "follow_up";
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
      model = "auto",
      task = "follow_up",
    } = body;
    const normalizedTask = normalizeTask(task);
    const supportedModels: AiModel[] = ["gemini", "deepseek", "openrouter"];
    const resolvedModel =
      model !== "auto" && supportedModels.includes(model as AiModel)
        ? (model as AiModel)
        : resolveAiModel(normalizedTask);

    if (!catalog) {
      return new Response(JSON.stringify({ error: "catalog is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (
      normalizedTask === "initial_analysis" &&
      !resume_text &&
      !resume_base64
    ) {
      return new Response(JSON.stringify({ error: "Either resume_text or resume_base64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Eres un Copiloto Experto en Adquisición de Talento. Tu objetivo es perfilar candidatos y asesorar al reclutador leyendo su CV contra nuestro catálogo de puestos.

### Reglas de Evaluación (Tolerancia Cero al Sesgo)
Evalúa únicamente: skills, experiencia, educación, herramientas, logros, idiomas y certificaciones.
Ignora por completo y nunca uses como criterio: edad, género, estado civil, nacionalidad, apariencia física, religión, orientación sexual o fotografía.

### Instrucciones de Perfilamiento
Recibirás un "Catálogo de Puestos".
- Si el usuario especificó un Target Job ID, evalúa principalmente contra ese puesto. Si el candidato no encaja bien, revisa el catálogo y sugiere alternativas mejores.
- Si NO hay Target Job ID (Auto-perfilar), analiza el CV, busca en el catálogo los 2-3 puestos con mayor afinidad y preséntalos.

### Comportamiento del Chat (¡Muy Importante!)
1. Si el usuario pide el ANÁLISIS INICIAL, debes usar EXACTAMENTE el "Formato de Salida Inicial" detallado abajo.
2. Si el usuario hace PREGUNTAS DE SEGUIMIENTO, responde de forma natural, analítica, experta y breve; amplía solo cuando te lo pidan.
3. LÍMITE DE DOMINIO: Si el usuario te hace preguntas ajenas a Recursos Humanos, reclutamiento, entrevistas, o el CV actual (ej. recetas, política, chistes, código ajeno al puesto), DEBES negarte a responder cortésmente, recordando que tu única función es asistir en adquisición de talento.

### Formato para el panel compacto
- La respuesta se mostrará dentro de un chat estrecho: prioriza lectura vertical y frases directas.
- NO uses tablas Markdown, bloques de código, HTML ni encabezados con #, ## o ###.
- Usa títulos de sección en negritas, listas de un solo nivel y párrafos de máximo dos oraciones.
- Deja exactamente una línea en blanco entre secciones. No acumules saltos vacíos.
- Cada viñeta debe expresar una sola idea y conservar la evidencia importante sin repetir el CV completo.
- Evita palabras de relleno, introducciones largas y conclusiones redundantes.

### Formato de Salida Inicial (Usar SOLO para el primer análisis):

**Puestos compatibles / Evaluación**
- **[Nombre del puesto 1]** · **Match: XX%** — [Razón breve del encaje].
- **[Nombre del puesto 2, si aplica]** · **Match: XX%** — [Razón breve del encaje].

**Análisis por skills y competencias**

**[Skill crítica 1]**
- **Cumple:** [Evidencia concreta encontrada en el CV].
- **Brecha:** [Requisito importante no demostrado, si existe].

**[Skill crítica 2]**
- **Parcial:** [Evidencia parcial o experiencia relacionada].
- **Brecha:** [Qué debe validarse durante la entrevista].

*(Incluye únicamente las skills más críticas para decidir el encaje.)*

**Banderas rojas**
- [Salto laboral, inactividad o riesgo verificable. Si no hay, indica "Ninguna detectada"].

**Preguntas estratégicas para entrevista**
1. [Pregunta técnica o conductual 1].
2. [Pregunta técnica o conductual 2].
3. [Pregunta técnica o conductual 3].`;

    if (resolvedModel === "gemini") {
      const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
      if (!geminiApiKey) {
         throw new Error("GEMINI_API_KEY is not set");
      }

      let contents = [];
      
      if (messages && messages.length > 0) {
        // Filtrar 'system' y mapear a formato Gemini ('user' o 'model')
        contents = messages
          .filter((m: any) => m.role === "user" || m.role === "ai" || m.role === "model")
          .map((m: any) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.content }]
          }));
          
        // Inyectar el contexto (Catálogo y CV) en el primer mensaje del usuario para que Gemini lo recuerde
        const firstUserMsg = contents.find((c: any) => c.role === "user");
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
         // Fallback legacy por si acaso
         const resumeContext = resume_text
           ? resume_text
           : "Documento PDF adjunto.";
         const parts: any[] = [
           { text: `Analiza el CV con el formato solicitado.\n\n### Target Job ID:\n${target_job_id || "Ninguno"}\n\n### Catálogo de Puestos Disponibles:\n${catalog}\n\n### CV del Candidato:\n${resumeContext}` }
         ];
         if (resume_base64) {
           parts.push({ inlineData: { mimeType: "application/pdf", data: resume_base64 } });
         }
         contents.push({ role: "user", parts });
      }

      const payload = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: contents,
        generationConfig: {
          temperature: 0.1,
        }
      };

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (!res.ok) {
        console.warn("Gemini API falló, intentando Fallback a Groq...", data);
        
        // --- INICIO FALLBACK GROQ ---
        const groqApiKey = Deno.env.get("GROQ_API_KEY");
        if (!groqApiKey) {
          throw new Error("Gemini falló y no hay GROQ_API_KEY configurada para fallback. " + (data.error?.message || ""));
        }
        
        if (!resume_text && normalizedTask === "initial_analysis") {
          throw new Error("Gemini falló y no hay texto del CV para el fallback.");
        }

        const groqHistory = messages
          .filter((message: any) =>
            message.role === "user" ||
            message.role === "ai" ||
            message.role === "model"
          )
          .map((message: any) => ({
            role: message.role === "user" ? "user" : "assistant",
            content: message.content,
          }));
        const resumeContext = resume_text || "Usa la evaluación inicial presente en la conversación.";
        const context = `### Target Job ID:\n${target_job_id || "Ninguno (Auto-perfilar en todo el catálogo)"}\n\n### Catálogo de Puestos Disponibles:\n${catalog}\n\n### CV del Candidato:\n${resumeContext}\n\n`;

        if (groqHistory.length > 0) {
          groqHistory[0].content = `${context}${groqHistory[0].content}`;
        } else {
          groqHistory.push({
            role: "user",
            content: `${context}Analiza el CV con el formato solicitado.`,
          });
        }

        const groqPayload = {
          model: "openai/gpt-oss-20b",
          messages: [
            { role: "system", content: systemPrompt },
            ...groqHistory,
          ],
          temperature: 0.1,
        };

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqApiKey}`
          },
          body: JSON.stringify(groqPayload)
        });

        const groqData = await groqRes.json();
        if (!groqRes.ok) {
          throw new Error(`Ambos modelos (Gemini y Groq) fallaron. Groq Error: ${groqData.error?.message}`);
        }

        const analysis = groqData.choices?.[0]?.message?.content;
        if (!analysis) throw new Error("Groq returned an empty response");
        return new Response(JSON.stringify({ analysis }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
        // --- FIN FALLBACK GROQ ---
      }

      const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!analysis) throw new Error("Gemini returned an empty response");

      return new Response(JSON.stringify({ analysis }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (resolvedModel === "deepseek") {
      const deepseekApiKey = Deno.env.get("DEEPSEEK_API_KEY");
      if (!deepseekApiKey) {
        throw new Error("DEEPSEEK_API_KEY is not set");
      }

      const contentText = resume_text
        ? resume_text
        : "Usa la evaluación inicial presente en la conversación.";

      let deepseekMessages = [
        { role: "system", content: systemPrompt }
      ];

      if (messages && messages.length > 0) {
        const history = messages
          .filter((m: any) => m.role === "user" || m.role === "ai" || m.role === "model")
          .map((m: any) => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.content
          }));
        
        if (history.length > 0) {
          history[0].content = `### Target Job ID:\n${target_job_id || "Ninguno"}\n\n### Catálogo de Puestos Disponibles:\n${catalog}\n\n### CV del Candidato:\n${contentText}\n\nPregunta del usuario: ${history[0].content}`;
          deepseekMessages = deepseekMessages.concat(history);
        }
      } else {
        deepseekMessages.push({ 
          role: "user", 
          content: `Por favor analiza mi CV adjunto y auto-perfila o evalúa contra el catálogo de puestos.\n\n### Target Job ID:\n${target_job_id || "Ninguno"}\n\n### Catálogo de Puestos Disponibles:\n${catalog}\n\n### CV del Candidato:\n${contentText}` 
        });
      }

      const payload = {
        model: "deepseek-chat",
        messages: deepseekMessages,
        temperature: 0.1,
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
      
      if (!res.ok) {
        console.error("Deepseek API Error:", data);
        throw new Error(`Error from Deepseek API: ${data.error?.message || "Unknown error"}`);
      }

      const analysis = data.choices?.[0]?.message?.content;
      if (!analysis) throw new Error("DeepSeek returned an empty response");

      return new Response(JSON.stringify({ analysis }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (resolvedModel === "openrouter") {
      const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
      if (!openRouterApiKey) {
        throw new Error("OPENROUTER_API_KEY is not set");
      }

      const contentText = resume_text
        ? resume_text
        : "Usa la evaluación inicial presente en la conversación.";

      let openRouterMessages = [
        { role: "system", content: systemPrompt }
      ];

      if (messages && messages.length > 0) {
        const history = messages
          .filter((m: any) => m.role === "user" || m.role === "ai" || m.role === "model")
          .map((m: any) => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.content
          }));
        
        if (history.length > 0) {
          history[0].content = `### Target Job ID:\n${target_job_id || "Ninguno"}\n\n### Catálogo de Puestos Disponibles:\n${catalog}\n\n### CV del Candidato:\n${contentText}\n\nPregunta del usuario: ${history[0].content}`;
          openRouterMessages = openRouterMessages.concat(history);
        }
      } else {
        openRouterMessages.push({ 
          role: "user", 
          content: `Por favor analiza mi CV adjunto y auto-perfila o evalúa contra el catálogo de puestos.\n\n### Target Job ID:\n${target_job_id || "Ninguno"}\n\n### Catálogo de Puestos Disponibles:\n${catalog}\n\n### CV del Candidato:\n${contentText}` 
        });
      }

      const payload = {
        model: "meta-llama/llama-3.1-70b-instruct:free", // Modelo gratuito por defecto en OpenRouter
        messages: openRouterMessages,
        temperature: 0.1,
      };

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openRouterApiKey}`,
          "HTTP-Referer": "https://localhost", // Recomendado por OpenRouter
          "X-Title": "Reclutamiento AI"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (!res.ok) {
        console.error("OpenRouter API Error:", data);
        throw new Error(`Error from OpenRouter API: ${data.error?.message || "Unknown error"}`);
      }

      const analysis = data.choices?.[0]?.message?.content;
      if (!analysis) throw new Error("OpenRouter returned an empty response");

      return new Response(JSON.stringify({ analysis }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Modelo no soportado" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: { code: "AI_UNAVAILABLE" } }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

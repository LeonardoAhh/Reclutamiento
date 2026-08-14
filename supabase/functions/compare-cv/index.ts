import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
         { text: `Analiza el CV con el formato solicitado.\n\n### Target Job ID:\n${target_job_id || "Ninguno"}\n\n### Catálogo de Puestos Disponibles:\n${catalog}\n\n### CV del Candidato:\n${resumeContext}` }
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
        content: `${openAIContext}Analiza el CV con el formato solicitado.`,
      });
    }

    const openAIMessages = [
      { role: "system", content: systemPrompt },
      ...openAIHistory,
    ];

    let analysisResult: string | null = null;
    let errors = [];

    // 1. TRY GEMINI
    try {
      const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
      if (geminiApiKey) {
        const payload = {
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: geminiContents
        };
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          analysisResult = data.candidates[0].content.parts[0].text;
        } else {
          errors.push(`Gemini Error: ${data.error?.message || 'Unknown'}`);
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
            messages: openAIMessages
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
          if (res.ok && data.choices?.[0]?.message?.content) {
            analysisResult = data.choices[0].message.content;
          } else {
            errors.push(`Deepseek Error: ${data.error?.message || 'Unknown'}`);
          }
        } else {
            errors.push("DEEPSEEK_API_KEY not set");
        }
      } catch (e: any) {
        errors.push(`Deepseek Exception: ${e.message}`);
      }
    }

    // 3. TRY GROQ
    if (!analysisResult) {
      try {
        const groqApiKey = Deno.env.get("GROQ_API_KEY");
        if (groqApiKey) {
          const payload = {
            model: "llama-3.1-70b-versatile",
            messages: openAIMessages
          };
          const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${groqApiKey}`
            },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (res.ok && data.choices?.[0]?.message?.content) {
            analysisResult = data.choices[0].message.content;
          } else {
            errors.push(`Groq Error: ${data.error?.message || 'Unknown'}`);
          }
        } else {
            errors.push("GROQ_API_KEY not set");
        }
      } catch (e: any) {
        errors.push(`Groq Exception: ${e.message}`);
      }
    }

    // 4. TRY OPENROUTER
    if (!analysisResult) {
      try {
        const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
        if (openRouterApiKey) {
          const payload = {
            model: "openrouter/auto",
            messages: openAIMessages
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
          if (res.ok && data.choices?.[0]?.message?.content) {
            analysisResult = data.choices[0].message.content;
          } else {
            errors.push(`OpenRouter Error: ${data.error?.message || 'Unknown'}`);
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
      return new Response(JSON.stringify({ analysis: analysisResult }), {
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

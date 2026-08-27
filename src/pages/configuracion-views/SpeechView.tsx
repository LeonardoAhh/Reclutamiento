import { useState, useMemo, useRef } from "react";
import {
  MessageSquare,
  Plus,
  Copy as CopyIcon,
  Pencil,
  Trash2,
  Briefcase,
  Bus,
  FileText,
  Calendar,
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  ImagePlus,
  X,
  Download,
} from "lucide-react";
import { Check, Copy, Save as SaveIconData } from "lucide";
import { MorphingIcon } from "@/components/ui/MorphingIcon";
import { Modal } from "@/components/ui/Modal";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { AnimatedSubmitButton } from "@/components/ui/AnimatedSubmitButton";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { BoneyardSkeleton } from "@/components/ui/BoneyardSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { getUrlAsPngBlob } from "@/lib/images";
import {
  SPEECH_CATEGORIES,
  SPEECH_CATEGORY_LABEL,
  type SpeechCategory,
  type SpeechTemplate,
} from "@/lib/types";
import { RECLUTADORES_ACTIVOS, PLANTILLA_AUTORIZADA } from "@/lib/constants";
import "./SpeechView.css";

// ── Constantes ────────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = SPEECH_CATEGORIES.map((c) => ({
  value: c,
  label: SPEECH_CATEGORY_LABEL[c],
}));

const RECLUTADOR_OPTIONS = RECLUTADORES_ACTIVOS.map((r) => ({
  value: r,
  label: r.charAt(0) + r.slice(1).toLowerCase(),
}));

const UNIQUE_PUESTOS = Array.from(
  new Set(PLANTILLA_AUTORIZADA.map((p) => p.puesto)),
).sort();

const PUESTO_OPTIONS = UNIQUE_PUESTOS.map((p) => ({
  value: p,
  label: p,
}));

const EMPTY_FORM = {
  titulo: "",
  categoria: "" as SpeechCategory | "",
  contenido: "",
  puesto: "",
  created_by: "",
  image_urls: [] as string[],
};

// ── Plantillas iniciales (Operador de Producción) ─────────────────────────────
// Se muestran como semilla cuando no hay datos guardados aún.

export const SPEECH_SEED_TEMPLATES: Omit<
  SpeechTemplate,
  "id" | "created_at" | "updated_at"
>[] = [
  {
    titulo: "Vacante — Operador de Producción",
    categoria: "vacante",
    puesto: "OPERADOR DE MÁQUINA",
    created_by: null,
    contenido: `¡Hola! 👋🏻 Te comparto los detalles de nuestra vacante *Operador de Producción*

💰 *Ingreso semanal total:*
$2,838 brutos (Sueldo + bonos)
✅ Cobras puntualmente cada viernes
*$2,560 netos aproximados*
Semana trabajada, semana pagada (en base al corte de nómina)

🎁 *Beneficios:*
• Vales de despensa
• Fondo de ahorro
• 18 días de aguinaldo
• 30% de prima vacacional
• Transporte gratuito
• Seguro social
• Plan de crecimiento por categorías

⚙️ *¿Qué harás?*
Operación de máquina de inyección, revisión de calidad, empaque y etiquetado de piezas.

⏰ Turnos fijos de 8 horas: *Tú eliges el turno*
*1er Turno:* Lun–Sáb | 6:00 am – 2:00 pm
*2o Turno:* Mié–Dom | 2:00 pm – 10:00 pm
*3er Turno:* Vie–Mar | 10:00 pm – 6:00 am

*¿Te interesa el empleo?*
Compártenos los siguientes datos:
📝 Nombre completo:
⏰ Turno que buscas laborar:
📍 Zona/Colonia donde vives:

*Por favor, revisa el listado y dime si te queda alguna parada cerca de tu domicilio.*
(Aquí se envían imágenes de las rutas de transporte, paradas y horarios)`,
  },
  {
    titulo: "Requisitos — Operador de Producción",
    categoria: "requisitos",
    puesto: "OPERADOR DE MÁQUINA",
    created_by: null,
    contenido: `¡Entiendo!

*El proceso es el siguiente:*
📋 1. Entrevista
📄 2. Validación de documentación
✅ 3. Contratación

Indispensable contar con los siguientes documentos para una contratación:
*Solo copias en blanco y negro*

• Solicitud elaborada
• INE (original y copia)
• Número de Seguro Social (IMSS)
• RFC (Constancia de Situación Fiscal)
• Comprobante de domicilio (luz, agua o teléfono)
• Acta de nacimiento
• Comprobante de estudios
• 2 cartas de recomendación laborales o personales
• Certificado médico (de cualquier farmacia)
• Hoja de Retención Infonavit (en caso de tener)
• Copia INE del beneficiario para apertura de tarjeta de nómina *(BanBajío / BanRegio)*
• Semanas cotizadas en el IMSS

*📌 Dato importante:* Realizamos pruebas de antidoping

¡Si tienes alguna duda con algún documento, con gusto te podemos ayudar!

*Nuestros horarios de entrevista son:*
*Lunes a viernes: 8:30 – 14:00*`,
  },
  {
    titulo: "Fechas de ingreso — Operador de Producción",
    categoria: "fechas_ingreso",
    puesto: "OPERADOR DE MÁQUINA",
    created_by: null,
    contenido: `Únicos días de ingreso:

📅 *Día Miércoles*
¿Cuándo cobras?
Al corte de nómina cobras 1 día.

📅 *Día Viernes*
¿Cuándo cobras?
Al corte de nómina cobras 6 días.

En ambos casos no se obtiene el bono de asistencia semanal.`,
  },
];

// ── Utilidades ────────────────────────────────────────────────────────────────

function getCategoryIcon(category: SpeechCategory) {
  switch (category) {
    case "vacante":
      return <Briefcase size={16} aria-hidden="true" />;
    case "transporte":
      return <Bus size={16} aria-hidden="true" />;
    case "requisitos":
      return <FileText size={16} aria-hidden="true" />;
    case "fechas_ingreso":
      return <Calendar size={16} aria-hidden="true" />;
    case "flyers":
      return <ImagePlus size={16} aria-hidden="true" />;
    default:
      return <MessageSquare size={16} aria-hidden="true" />;
  }
}

function formatWhatsAppText(text: string) {
  if (!text) return null;

  return text.split("\n").map((line, lineIndex, arr) => {
    let isQuote = false;
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith("> ")) {
      isQuote = true;
      line = line.replace(/^\s*>\s*/, "");
    }

    const parts = line.split(/(\*[^*]+\*|_[^_]+_|~[^~]+~|`[^`]+`)/g);

    const formattedLine = parts.map((part, i) => {
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
        return <strong key={i}>{part.slice(1, -1)}</strong>;
      }
      if (part.startsWith("_") && part.endsWith("_") && part.length > 2) {
        return <em key={i}>{part.slice(1, -1)}</em>;
      }
      if (part.startsWith("~") && part.endsWith("~") && part.length > 2) {
        return <del key={i}>{part.slice(1, -1)}</del>;
      }
      if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
        return (
          <code className="whatsapp-code" key={i}>
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });

    const content = (
      <span key={lineIndex}>
        {formattedLine}
        {lineIndex < arr.length - 1 && "\n"}
      </span>
    );

    if (isQuote) {
      return (
        <blockquote key={lineIndex} className="whatsapp-quote">
          {content}
        </blockquote>
      );
    }

    return content;
  });
}

const forceDownload = async (url: string, filename: string) => {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(objectUrl);
  } catch (err) {
    // Fallback: abrir en nueva pestaña si falla por CORS
    window.open(url, "_blank");
  }
};

// ── Componente principal ──────────────────────────────────────────────────────

export function SpeechView() {
  const { profile, loading: authLoading } = useAuth();
  const {
    speechTemplates,
    loading,
    addSpeechTemplate,
    updateSpeechTemplate,
    deleteSpeechTemplate,
    uploadSpeechImages,
  } = useSupabaseData();

  const isAdmin = profile?.role === "admin";

  // ── Estado del modal de edición/creación ───────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "loading" | "success"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormat = (
    formatType:
      | "bold"
      | "italic"
      | "strikethrough"
      | "code"
      | "quote"
      | "ul"
      | "ol",
  ) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.contenido.substring(start, end);
    let newText = "";
    let cursorOffset = 0;

    switch (formatType) {
      case "bold":
        newText = `*${selectedText}*`;
        cursorOffset = selectedText ? 0 : -1;
        break;
      case "italic":
        newText = `_${selectedText}_`;
        cursorOffset = selectedText ? 0 : -1;
        break;
      case "strikethrough":
        newText = `~${selectedText}~`;
        cursorOffset = selectedText ? 0 : -1;
        break;
      case "code":
        newText = `\`${selectedText}\``;
        cursorOffset = selectedText ? 0 : -1;
        break;
      case "quote":
        newText = selectedText
          ? selectedText
              .split("\n")
              .map((line) => `> ${line}`)
              .join("\n")
          : "> ";
        break;
      case "ul":
        newText = selectedText
          ? selectedText
              .split("\n")
              .map((line) => `- ${line}`)
              .join("\n")
          : "- ";
        break;
      case "ol":
        newText = selectedText
          ? selectedText
              .split("\n")
              .map((line, i) => `${i + 1}. ${line}`)
              .join("\n")
          : "1. ";
        break;
    }

    const newContent =
      formData.contenido.substring(0, start) +
      newText +
      formData.contenido.substring(end);
    handleChange("contenido", newContent);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + newText.length + cursorOffset;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // ── Estado de confirmación de borrado ─────────────────────────────────────
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "loading">("idle");

  // ── Estado del botón de copiar por plantilla ──────────────────────────────
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ── Filtro de categoría activa ────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState<SpeechCategory | "all">(
    "all",
  );

  // ── Datos efectivos: Supabase o seeds si no hay nada aún ──────────────────
  const effectiveTemplates = useMemo(() => {
    if (speechTemplates.length > 0) return speechTemplates;
    // Cuando no hay datos persistidos mostramos las seeds como referencia.
    // Se identifican con id prefijo "seed-" para distinguirlas.
    return SPEECH_SEED_TEMPLATES.map((t, i) => ({
      ...t,
      id: `seed-${i}`,
      created_at: "",
      updated_at: "",
    })) satisfies SpeechTemplate[];
  }, [speechTemplates]);

  const isSeedMode = speechTemplates.length === 0;

  // ── Agrupación por categoría ──────────────────────────────────────────────
  const grouped = useMemo(() => {
    const filtered =
      activeCategory === "all"
        ? effectiveTemplates
        : effectiveTemplates.filter((t) => t.categoria === activeCategory);

    const map = new Map<SpeechCategory, SpeechTemplate[]>();
    for (const cat of SPEECH_CATEGORIES) {
      map.set(cat, []);
    }
    for (const t of filtered) {
      const list = map.get(t.categoria);
      if (list) list.push(t);
    }
    return map;
  }, [effectiveTemplates, activeCategory]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openNew = () => {
    setEditingId(null);
    setFormData({ ...EMPTY_FORM });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEdit = (template: SpeechTemplate) => {
    setEditingId(template.id);
    setFormData({
      titulo: template.titulo,
      categoria: template.categoria,
      contenido: template.contenido,
      puesto: template.puesto ?? "",
      created_by: template.created_by ?? "",
      image_urls: template.image_urls ?? [],
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errorMsg) setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.titulo.trim()) {
      setErrorMsg("El título es obligatorio.");
      return;
    }
    if (!formData.categoria) {
      setErrorMsg("Selecciona una categoría.");
      return;
    }
    if (!formData.contenido.trim() && formData.categoria !== "flyers") {
      setErrorMsg("El contenido no puede estar vacío.");
      return;
    }

    setSubmitStatus("loading");

    let newUrls: string[] = [];
    if (selectedFiles.length > 0) {
      newUrls = await uploadSpeechImages(selectedFiles);
    }
    const finalImageUrls = [...(formData.image_urls || []), ...newUrls];

    const isPuestoOmitted = formData.categoria !== "vacante";
    const isContenidoOmitted = formData.categoria === "flyers";

    const payload = {
      titulo: formData.titulo.trim(),
      categoria: formData.categoria as SpeechCategory,
      contenido: isContenidoOmitted ? " " : formData.contenido,
      puesto: isPuestoOmitted ? null : formData.puesto.trim() || null,
      created_by: formData.created_by || null,
      image_urls: finalImageUrls.length > 0 ? finalImageUrls : null,
    };

    const result = editingId
      ? await updateSpeechTemplate(editingId, payload)
      : await addSpeechTemplate(payload);

    if (result.ok) {
      setSubmitStatus("success");
      setTimeout(() => {
        setSubmitStatus("idle");
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({ ...EMPTY_FORM });
        setSelectedFiles([]);
      }, 1200);
    } else {
      setSubmitStatus("idle");
      setErrorMsg(result.message ?? "Ocurrió un error al guardar.");
    }
  };

  const handleCopy = async (template: SpeechTemplate) => {
    try {
      const textToCopy = template.contenido || " ";

      // Para Flyer's, copiamos la imagen al portapapeles porque no tienen texto.
      // Para Transporte, copiamos solo el texto (WhatsApp ignora el texto si enviamos la imagen junta).
      if (
        template.categoria === "flyers" &&
        template.image_urls &&
        template.image_urls.length > 0
      ) {
        try {
          const pngBlob = await getUrlAsPngBlob(template.image_urls[0]);

          // Nota: Safari exige que la promesa del blob se resuelva EN el constructor de ClipboardItem,
          // pero Chrome permite pasar el Blob ya resuelto. Usamos Blob directo para mayor compatibilidad Windows/Chrome.
          const clipboardItem = new ClipboardItem({
            "text/plain": new Blob([textToCopy], { type: "text/plain" }),
            "image/png": pngBlob,
          });

          await navigator.clipboard.write([clipboardItem]);

          setCopiedId(template.id);
          setTimeout(() => setCopiedId(null), 2000);
          return;
        } catch (err) {
          console.warn(
            "No se pudo copiar la imagen al portapapeles (CORS o error de formato), copiando solo texto...",
            err,
          );
          // Fallback silencioso a texto
        }
      }

      // Fallback para texto normal
      await navigator.clipboard.writeText(textToCopy);
      setCopiedId(template.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback silencioso — el navegador puede bloquear el portapapeles
    }
  };

  const requestDelete = (id: string) => {
    setDeletingId(id);
    setDeleteStatus("idle");
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    setDeleteStatus("loading");
    const result = await deleteSpeechTemplate(deletingId);
    setDeleteStatus("idle");
    if (result.ok) {
      setDeletingId(null);
    } else {
      setDeletingId(null);
    }
  };

  const isFormValid =
    formData.titulo.trim().length > 0 &&
    formData.categoria !== "" &&
    (formData.categoria !== "vacante" || formData.puesto.trim().length > 0) &&
    formData.created_by !== "" &&
    (formData.categoria === "flyers" || formData.contenido.trim().length > 0);

  return (
    <BoneyardSkeleton
      name="configuracion-speech"
      loading={authLoading || loading}
      loadingLabel="Cargando plantillas…"
    >
      <section className="speech-view config-page" aria-labelledby="speech-title">
      {/* ── Banner de modo semilla ─────────────────────────────────────────── */}
      {isSeedMode && (
        <div className="speech-seed-banner" role="status">
          <p className="type-body-sm text-muted">
            Plantillas de ejemplo. Crea una nueva para guardarla en el sistema.
          </p>
        </div>
      )}

      {/* ── Filtros de categoría ───────────────────────────────────────────── */}
      <nav className="speech-category-nav" aria-label="Filtrar por categoría">
        <button
          type="button"
          className={`speech-category-btn${activeCategory === "all" ? " is-active" : ""}`}
          onClick={() => setActiveCategory("all")}
          aria-pressed={activeCategory === "all"}
        >
          Todas
        </button>
        {SPEECH_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`speech-category-btn${activeCategory === cat ? " is-active" : ""}`}
            onClick={() => setActiveCategory(cat)}
            aria-pressed={activeCategory === cat}
          >
            {getCategoryIcon(cat)} {SPEECH_CATEGORY_LABEL[cat]}
          </button>
        ))}

        <button
          type="button"
          className="btn-primary"
          style={{ marginLeft: "auto" }}
          onClick={() => {
            setFormData({ ...EMPTY_FORM });
            setEditingId(null);
            setIsModalOpen(true);
          }}
        >
          <Plus size={16} aria-hidden="true" />
          Plantilla
        </button>
      </nav>

      {/* ── Grupos de plantillas por categoría ────────────────────────────── */}
      <div className="speech-groups">
        {SPEECH_CATEGORIES.map((cat) => {
          const list = grouped.get(cat) ?? [];
          if (list.length === 0) return null;
          return (
            <section
              key={cat}
              className="speech-group"
              aria-labelledby={`speech-group-${cat}`}
            >
              <header className="speech-group__header">
                <span className="speech-group__icon" aria-hidden="true">
                  {getCategoryIcon(cat)}
                </span>
                <h3
                  id={`speech-group-${cat}`}
                  className="speech-group__title type-heading-sm"
                >
                  {SPEECH_CATEGORY_LABEL[cat]}
                </h3>
                <span className="speech-group__count type-caption-sm text-muted">
                  {list.length} {list.length === 1 ? "plantilla" : "plantillas"}
                </span>
              </header>

              <ul
                className={`speech-template-list ${cat === "flyers" ? "speech-template-list--flyers" : ""}`}
                aria-label={`Plantillas de ${SPEECH_CATEGORY_LABEL[cat]}`}
              >
                {list.map((template) => (
                  <li
                    key={template.id}
                    className={`speech-template-card ${template.categoria === "flyers" ? "speech-template-card--flyer" : ""}`}
                  >
                    <div className="speech-template-card__body">
                      <div className="speech-template-card__meta">
                        <div className="speech-template-card__header-content">
                          <h4 className="speech-template-card__title type-body-strong text-ink">
                            {template.titulo}
                          </h4>
                          <div className="speech-template-card__sub-info">
                            {template.puesto && (
                              <span className="speech-template-card__puesto type-caption-sm text-muted">
                                {template.puesto}
                              </span>
                            )}
                            {template.created_by && (
                              <span className="speech-template-card__author type-caption-sm text-muted-soft">
                                •{" "}
                                {template.created_by.charAt(0) +
                                  template.created_by.slice(1).toLowerCase()}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="speech-template-card__buttons">
                          <button
                            type="button"
                            className={`speech-action-btn${copiedId === template.id ? " is-copied" : ""}`}
                            onClick={() => handleCopy(template)}
                            aria-label={
                              copiedId === template.id
                                ? "Copiado"
                                : `Copiar plantilla: ${template.titulo}`
                            }
                            title={
                              copiedId === template.id
                                ? "Copiado"
                                : "Copiar al portapapeles"
                            }
                            disabled={isSeedMode}
                          >
                            <MorphingIcon
                              icon={copiedId === template.id ? Check : Copy}
                              size={16}
                            />
                          </button>

                          {!isSeedMode && (
                            <button
                              type="button"
                              className="speech-action-btn"
                              onClick={() => openEdit(template)}
                              aria-label={`Editar plantilla: ${template.titulo}`}
                              title="Editar plantilla"
                            >
                              <Pencil size={16} aria-hidden="true" />
                            </button>
                          )}

                          {isAdmin && !isSeedMode && (
                            <button
                              type="button"
                              className="speech-action-btn speech-action-btn--danger"
                              onClick={() => requestDelete(template.id)}
                              aria-label={`Eliminar plantilla: ${template.titulo}`}
                              title="Eliminar plantilla"
                            >
                              <Trash2 size={16} aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </div>

                      {activeCategory !== "all" &&
                        template.categoria !== "flyers" && (
                          <div
                            className="speech-template-card__preview"
                            aria-label="Vista previa del mensaje"
                          >
                            {formatWhatsAppText(template.contenido)}
                          </div>
                        )}

                      {activeCategory !== "all" &&
                        template.image_urls &&
                        template.image_urls.length > 0 && (
                          <div
                            className="speech-template-card__images"
                            data-count={template.image_urls.length}
                          >
                            {template.image_urls.map((url, i) => (
                              <div
                                key={i}
                                className="speech-template-card__image-wrapper"
                              >
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="speech-template-card__image-link"
                                  aria-label={`Ver imagen ${i + 1}`}
                                >
                                  <img
                                    src={url}
                                    alt={`Adjunto ${i + 1}`}
                                    loading="lazy"
                                  />
                                </a>
                                <div className="speech-image-overlay-actions">
                                  <button
                                    className="speech-image-action"
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      try {
                                        const pngBlob =
                                          await getUrlAsPngBlob(url);
                                        const clipboardItem = new ClipboardItem(
                                          { "image/png": pngBlob },
                                        );
                                        await navigator.clipboard.write([
                                          clipboardItem,
                                        ]);
                                        // Feedback visual sutil (podría agregarse un tooltip o toast, por ahora solo console.log)
                                      } catch (err) {
                                        console.error(
                                          "No se pudo copiar la imagen al portapapeles",
                                          err,
                                        );
                                      }
                                    }}
                                    title="Copiar imagen al portapapeles"
                                    aria-label="Copiar"
                                  >
                                    <CopyIcon size={18} />
                                  </button>
                                  <button
                                    className="speech-image-action"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      forceDownload(
                                        url,
                                        `Plantilla-${template.titulo.replace(/\s+/g, "-")}-${i + 1}.jpg`,
                                      );
                                    }}
                                    title="Descargar imagen"
                                    aria-label="Descargar imagen"
                                  >
                                    <Download size={18} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        {/* Estado vacío global */}
        {effectiveTemplates.length === 0 && (
          <div className="speech-empty" role="status">
            <MessageSquare
              size={32}
              aria-hidden="true"
              className="text-muted-soft"
            />
            <p className="type-body-md text-muted">
              Aún no hay plantillas. Crea la primera.
            </p>
          </div>
        )}
      </div>

      {/* ── Modal crear / editar ───────────────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (submitStatus !== "loading") {
            setIsModalOpen(false);
            setEditingId(null);
          }
        }}
        title={editingId ? "Editar" : "Nueva"}
        icon={
          <MessageSquare
            size={20}
            className="text-primary"
            aria-hidden="true"
          />
        }
        footerActions={
          <div className="speech-modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingId(null);
              }}
              disabled={submitStatus === "loading"}
            >
              Cancelar
            </button>
            <AnimatedSubmitButton
              type="submit"
              form="form-speech"
              isSubmitting={submitStatus === "loading"}
              isSuccess={submitStatus === "success"}
              isError={!!errorMsg}
              errorText={errorMsg ?? undefined}
              idleText={editingId ? "Guardar cambios" : "Crear"}
              loadingText="Guardando…"
              successText="¡Guardado!"
              idleIcon={SaveIconData}
              className="btn-primary"
              disabled={!isFormValid}
            />
          </div>
        }
      >
        <div className="modal-body">
          <form
            id="form-speech"
            onSubmit={handleSubmit}
            className="speech-form"
            noValidate
          >
            <div className="form-group">
              <label htmlFor="speech-titulo">Título</label>
              <input
                id="speech-titulo"
                type="text"
                required
                value={formData.titulo}
                onChange={(e) => handleChange("titulo", e.target.value)}
                placeholder="Ej. Información de vacante — Operador"
                autoComplete="off"
                aria-required="true"
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="speech-categoria">Categoría</label>
                <CustomSelect
                  id="speech-categoria"
                  value={formData.categoria}
                  onChange={(val) => handleChange("categoria", val)}
                  options={CATEGORY_OPTIONS}
                  placeholder="Selecciona una categoría…"
                />
              </div>

              {formData.categoria === "vacante" && (
                <div className="form-group">
                  <label htmlFor="speech-puesto">Puesto</label>
                  <CustomSelect
                    id="speech-puesto"
                    value={formData.puesto}
                    onChange={(val) => handleChange("puesto", val)}
                    options={PUESTO_OPTIONS}
                    placeholder="Ej. OPERADOR DE MÁQUINA"
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="speech-reclutador">Reclutador</label>
                <CustomSelect
                  id="speech-reclutador"
                  value={formData.created_by}
                  onChange={(val) => handleChange("created_by", val)}
                  options={RECLUTADOR_OPTIONS}
                  placeholder="Selecciona un reclutador…"
                />
              </div>
            </div>

            {formData.categoria !== "flyers" && (
              <div className="form-group speech-form__full-width">
                <label htmlFor="speech-contenido">Contenido del mensaje</label>
                <div
                  className="whatsapp-toolbar"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <button
                    type="button"
                    onClick={() => applyFormat("bold")}
                    title="Negrita"
                    className="whatsapp-toolbar-btn"
                    aria-label="Negrita"
                  >
                    <Bold size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat("italic")}
                    title="Cursiva"
                    className="whatsapp-toolbar-btn"
                    aria-label="Cursiva"
                  >
                    <Italic size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat("strikethrough")}
                    title="Tachado"
                    className="whatsapp-toolbar-btn"
                    aria-label="Tachado"
                  >
                    <Strikethrough size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat("code")}
                    title="Código"
                    className="whatsapp-toolbar-btn"
                    aria-label="Código"
                  >
                    <Code size={16} />
                  </button>
                  <div
                    className="whatsapp-toolbar-divider"
                    aria-hidden="true"
                  />
                  <button
                    type="button"
                    onClick={() => applyFormat("ol")}
                    title="Lista numerada"
                    className="whatsapp-toolbar-btn"
                    aria-label="Lista numerada"
                  >
                    <ListOrdered size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat("ul")}
                    title="Lista viñetas"
                    className="whatsapp-toolbar-btn"
                    aria-label="Lista viñetas"
                  >
                    <List size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat("quote")}
                    title="Cita"
                    className="whatsapp-toolbar-btn"
                    aria-label="Cita"
                  >
                    <Quote size={16} />
                  </button>
                </div>
                <textarea
                  ref={textareaRef}
                  id="speech-contenido"
                  required
                  value={formData.contenido}
                  onChange={(e) => handleChange("contenido", e.target.value)}
                  placeholder="Escribe el mensaje aquí…"
                  rows={6}
                  aria-required="true"
                />
              </div>
            )}

            {(formData.categoria === "transporte" ||
              formData.categoria === "flyers") && (
              <div className="form-group speech-form__full-width">
                <label>
                  Imágenes adjuntas (
                  {formData.categoria === "flyers" ? "Flyer's" : "Transporte"})
                </label>
                <div className="speech-image-uploader">
                  <div className="speech-image-previews">
                    {formData.image_urls &&
                      formData.image_urls.map((url, i) => (
                        <div
                          key={`existing-${i}`}
                          className="speech-image-preview"
                        >
                          <img src={url} alt={`Imagen guardada ${i + 1}`} />
                          <button
                            type="button"
                            className="speech-image-remove"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                image_urls: prev.image_urls?.filter(
                                  (_, index) => index !== i,
                                ),
                              }));
                            }}
                            aria-label="Eliminar imagen"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    {selectedFiles.map((file, i) => (
                      <div
                        key={`new-${i}`}
                        className="speech-image-preview is-new"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Nueva imagen ${i + 1}`}
                        />
                        <button
                          type="button"
                          className="speech-image-remove"
                          onClick={() => {
                            setSelectedFiles((prev) =>
                              prev.filter((_, index) => index !== i),
                            );
                          }}
                          aria-label="Quitar selección"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <label className="speech-image-add">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          if (e.target.files) {
                            setSelectedFiles((prev) => [
                              ...prev,
                              ...Array.from(e.target.files!),
                            ]);
                          }
                        }}
                      />
                      <ImagePlus size={24} />
                      <span className="type-caption-sm">Añadir</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </Modal>

      <DeleteConfirmModal
        isOpen={deletingId !== null}
        title="Eliminar plantilla"
        onCancel={() => {
          if (deleteStatus !== "loading") setDeletingId(null);
        }}
        onConfirm={() => void confirmDelete()}
        isLoading={deleteStatus === "loading"}
      />
      </section>
    </BoneyardSkeleton>
  );
}

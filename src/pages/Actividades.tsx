import { useState, useEffect, useMemo, useRef } from "react";
import { useActivities } from "@/hooks/useActivities";
import { usePositions } from "@/lib/positions";
import { useAuth } from "@/hooks/useAuth";
import { Activity, ActivityStatus, ACTIVITY_STATUS_LABEL } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { Modal } from "@/components/ui/Modal";
import {
  ClipboardList,
  Plus,
  FileText,
  UploadCloud,
  Trash2,
  CheckCircle2,
  ListTodo,
  Inbox,
  Pencil,
  MoreVertical,
  Search,
  ArrowUpDown,
  List,
  ImagePlus,
  X,
  ChevronDown,
  ChevronRight,
  UserPlus
} from "lucide-react";
import { toast } from "@/lib/notify";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { ReclutadorBadge } from "@/components/ui/ReclutadorBadge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import "./Actividades.css";

/** Capitaliza la primera letra de cada palabra. */
function capitalize(str: string) {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

function AssigneeBadges({ act, isAdmin, currentUser }: { act: Activity; isAdmin: boolean; currentUser?: any }) {
  if (act.asignado_a) {
    // Si es su usuario, no mostramos el badge (es redundante)
    if (currentUser && act.asignado_a === currentUser.id) {
      return null;
    }

    const name =
      (act as any).asignado_a_profile?.display_name ||
      (act as any).asignado_a_profile?.username ||
      "—";
    return <ReclutadorBadge nombre={name} size="sm" showRole={false} />;
  }

  // Todo el equipo
  return (
    <div className="activity-team-badges">
      <ReclutadorBadge nombre="Alexandra" size="sm" showRole={false} />
      <ReclutadorBadge nombre="Daniela" size="sm" showRole={false} />
      <ReclutadorBadge nombre="Leonardo" size="sm" showRole={false} />
    </div>
  );
}

function ImageLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="lightbox-overlay"
      onClick={onClose}
      role="dialog"
      aria-label="Visor de imagen"
    >
      <button
        className="lightbox-close"
        onClick={onClose}
        aria-label="Cerrar visor"
      >
        <X size={24} aria-hidden="true" />
      </button>
      <img
        src={src}
        alt={alt}
        className="lightbox-img"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

function SmartTextarea({
  id,
  value,
  onChange,
  placeholder,
  maxLength = 1500,
}: {
  id: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleResize = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  useEffect(() => {
    handleResize();
  }, [value]);

  const insertAtCursor = (text: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;

    let prefix = "";
    if (start > 0 && value[start - 1] !== "\n") {
      prefix = "\n";
    }

    const insertion = prefix + text;
    const newValue =
      value.substring(0, start) + insertion + value.substring(end);
    onChange(newValue);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + insertion.length, start + insertion.length);
    }, 0);
  };

  return (
    <div className="smart-textarea-wrapper">
      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={3}
        className="smart-textarea"
      />
      <div className="smart-textarea-toolbar">
        <div className="smart-textarea-actions">
          <button
            type="button"
            className="smart-textarea-btn"
            onClick={() => insertAtCursor("• ")}
            title="Añadir viñeta"
          >
            <List size={14} aria-hidden="true" />
            <span>Viñeta</span>
          </button>
          <button
            type="button"
            className="smart-textarea-btn"
            onClick={() => insertAtCursor("- [ ] ")}
            title="Añadir checklist"
          >
            <ListTodo size={14} aria-hidden="true" />
            <span>Checklist</span>
          </button>
        </div>
        <span className="smart-textarea-counter">
          {value.length} / {maxLength}
        </span>
      </div>
    </div>
  );
}

export function Actividades() {
  const { profile } = useAuth();

  const lastVisitRef = useRef<string | null>(null);

  // Actualizar la fecha de última visita para que el sistema de notificaciones sepa 
  // qué actividades ya fueron "vistas" por el usuario
  useEffect(() => {
    // Guardamos la referencia de cuándo fue la última vez (antes de sobreescribir)
    // para poder ponerle una etiqueta de "NUEVO" en el render a lo que sea más reciente.
    lastVisitRef.current = localStorage.getItem("last_activities_visit");
    
    // Y actualizamos el localStorage para la próxima vez
    localStorage.setItem("last_activities_visit", new Date().toISOString());
  }, []);

  const {
    activities,
    loading,
    createActivity,
    updateActivity,
    updateActivityStatus,
    deleteActivity,
    uploadProof,
    uploadReferenceImage,
    getProofs,
    deleteProof,
    refresh,
  } = useActivities();

  const isNewActivity = (act: Activity) => {
    if (!lastVisitRef.current || !act.created_at) return false;
    return new Date(act.created_at) > new Date(lastVisitRef.current);
  };

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateVacanteModalOpen, setIsCreateVacanteModalOpen] =
    useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null,
  );
  const [assignModalVacancy, setAssignModalVacancy] = useState<Activity | null>(null);
  const [proofs, setProofs] = useState<any[]>([]);

  /* ── Create form state ─────────────────────────────────────────────── */
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [vacanteSeccion, setVacanteSeccion] = useState("");
  const [asignadoA, setAsignadoA] = useState("");
  const [tipo, setTipo] = useState<"unica" | "rutinaria" | "vacante">("unica");
  const [reclutadores, setReclutadores] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referenceImageFile, setReferenceImageFile] = useState<File | null>(
    null,
  );
  const [referenceImagePreview, setReferenceImagePreview] = useState<
    string | null
  >(null);

  /* ── Filter / Search / Sort state ────────────────────────────────────── */
  const [statusFilter, setStatusFilter] = useState<ActivityStatus | "todas">(
    "todas",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "status">(
    "newest",
  );
  const [recruiterFilter, setRecruiterFilter] = useState("");

  /* ── Section collapse & item limits ────────────────────────────────── */
  const [rutinariasCollapsed, setRutinariasCollapsed] = useState(true);
  const [actividadesCollapsed, setActividadesCollapsed] = useState(true);
  const [vacantesCollapsed, setVacantesCollapsed] = useState(false);
  const [rutinariasLimit, setRutinariasLimit] = useState(4);
  const [actividadesLimit, setActividadesLimit] = useState(4);
  const [vacantesLimit, setVacantesLimit] = useState(4);

  /* ── Edit form state ───────────────────────────────────────────────── */
  const [editTitulo, setEditTitulo] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editAsignadoA, setEditAsignadoA] = useState("");
  const [editTipo, setEditTipo] = useState<"unica" | "rutinaria" | "vacante">("unica");
  const [editReferenceImageFile, setEditReferenceImageFile] =
    useState<File | null>(null);
  const [editReferenceImagePreview, setEditReferenceImagePreview] = useState<
    string | null
  >(null);
  const [editExistingReferenceImage, setEditExistingReferenceImage] = useState<
    string | null
  >(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    description?: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: "", onConfirm: () => {} });

  useEffect(() => {
    if (profile?.role === "admin") {
      supabase
        .from("profiles")
        .select("id, display_name, username")
        .eq("role", "reclutador")
        .then(({ data }) => setReclutadores(data || []));
    }
  }, [profile]);

  const { positions } = usePositions();

  const areasOptions = useMemo(
    () => Array.from(new Set(positions.map((p) => p.area))).sort((a, b) => a.localeCompare(b, 'es')),
    [positions]
  );
  
  const seccionesOptions = useMemo(() => {
    let base = positions;
    if (descripcion) {
      base = base.filter((p) => p.area === descripcion);
    }
    return Array.from(new Set(base.map((p) => p.seccion).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es'));
  }, [positions, descripcion]);
  
  const puestosOptions = useMemo(() => {
    let base = positions;
    if (descripcion) {
      base = base.filter((p) => p.area === descripcion);
    }
    if (vacanteSeccion) {
      base = base.filter((p) => p.seccion === vacanteSeccion);
    }
    return Array.from(new Set(base.map((p) => p.puesto))).sort((a, b) => a.localeCompare(b, 'es'));
  }, [positions, descripcion, vacanteSeccion]);

  const vacantesManuales = useMemo(() => {
    const list = activities.filter((a) => a.tipo === "vacante");
    
    list.sort((a, b) => {
      // 0. Nuevas primero
      const aNew = isNewActivity(a);
      const bNew = isNewActivity(b);
      if (aNew && !bNew) return -1;
      if (!aNew && bNew) return 1;

      // 1. Sin asignar primero
      if (!a.asignado_a && b.asignado_a) return -1;
      if (a.asignado_a && !b.asignado_a) return 1;

      // 2. Por reclutador
      if (a.asignado_a && b.asignado_a && a.asignado_a !== b.asignado_a) {
         const nameA = (a as any).asignado_a_profile?.display_name || (a as any).asignado_a_profile?.username || "Z";
         const nameB = (b as any).asignado_a_profile?.display_name || (b as any).asignado_a_profile?.username || "Z";
         const nameCmp = nameA.localeCompare(nameB, 'es');
         if (nameCmp !== 0) return nameCmp;
      }

      // 3. Por Puesto/Área (título y descripción)
      const titleA = a.titulo || "";
      const titleB = b.titulo || "";
      const titleCmp = titleA.localeCompare(titleB, 'es');
      if (titleCmp !== 0) return titleCmp;

      const descA = a.descripcion || "";
      const descB = b.descripcion || "";
      return descA.localeCompare(descB, 'es');
    });

    return list;
  }, [activities]);

  const handleAssignVacancy = async (
    activityId: string,
    recruiterId: string,
  ) => {
    await updateActivity(activityId, { asignado_a: recruiterId || null });
  };

  const handleCreateVacante = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo) return;
    setIsSubmitting(true);
    const finalDesc = vacanteSeccion ? `${descripcion} - ${vacanteSeccion}` : descripcion;
    const act = await createActivity(
      titulo,
      finalDesc,
      asignadoA || null,
      "vacante",
    );

    setIsSubmitting(false);
    if (act) {
      setIsCreateVacanteModalOpen(false);
      setTitulo("");
      setDescripcion("");
      setVacanteSeccion("");
      setAsignadoA("");
    }
  };

  /* ── Handlers ──────────────────────────────────────────────────────── */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo) return;
    setIsSubmitting(true);
    const act = await createActivity(
      titulo,
      descripcion,
      asignadoA || null,
      tipo,
    );

    if (act && referenceImageFile) {
      const url = await uploadReferenceImage(act.id!, referenceImageFile);
      if (url) {
        await updateActivity(act.id!, { reference_image: url });
      }
    }

    setIsSubmitting(false);
    if (act) {
      setIsCreateModalOpen(false);
      setTitulo("");
      setDescripcion("");
      setAsignadoA("");
      setTipo("unica");
      setReferenceImageFile(null);
      setReferenceImagePreview(null);
    }
  };

  const openDetails = async (activity: Activity) => {
    if (activity.tipo === "rutinaria") return;
    setSelectedActivity(activity);
    setIsDetailModalOpen(true);
    const p = await getProofs(activity.id!);
    setProofs(p);
  };

  const handleStatusChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    if (!selectedActivity) return;
    const newStatus = e.target.value as ActivityStatus;
    const updated = await updateActivityStatus(selectedActivity.id!, newStatus);
    if (updated) setSelectedActivity(updated as Activity);
  };

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedActivity || !e.target.files || e.target.files.length === 0)
      return;
    const file = e.target.files[0];

    if (file.size > MAX_FILE_SIZE) {
      toast.error({
        title: "Archivo demasiado grande",
        description: `El límite es 10 MB. Tu archivo pesa ${(file.size / (1024 * 1024)).toFixed(1)} MB.`,
      });
      e.target.value = "";
      return;
    }

    setIsSubmitting(true);
    const proof = await uploadProof(selectedActivity.id!, file);
    if (proof) setProofs((prev) => [proof, ...prev]);
    setIsSubmitting(false);
    e.target.value = "";
  };

  const handleDeleteProof = (proofId: string, url: string) => {
    setConfirmState({
      isOpen: true,
      title: "¿Eliminar prueba?",
      description: "Esta acción no se puede deshacer.",
      onConfirm: async () => {
        const ok = await deleteProof(proofId, url);
        if (ok) setProofs((prev) => prev.filter((p) => p.id !== proofId));
        setConfirmState((s) => ({ ...s, isOpen: false }));
      },
    });
  };

  const openEdit = (activity: Activity, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedActivity(activity);
    setEditTitulo(activity.titulo);
    setEditDescripcion(activity.descripcion || "");
    setEditAsignadoA(activity.asignado_a || "");
    setEditTipo(activity.tipo || "unica");
    setEditReferenceImageFile(null);
    setEditReferenceImagePreview(null);
    setEditExistingReferenceImage(activity.reference_image || null);
    setIsEditModalOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity || !editTitulo) return;
    setIsSubmitting(true);

    let newImageUrl = editExistingReferenceImage;

    if (editReferenceImageFile) {
      const url = await uploadReferenceImage(
        selectedActivity.id!,
        editReferenceImageFile,
      );
      if (url) {
        newImageUrl = url;
      }
    }

    const act = await updateActivity(selectedActivity.id!, {
      titulo: editTitulo,
      descripcion: editDescripcion,
      asignado_a: editAsignadoA || null,
      tipo: editTipo,
      reference_image: newImageUrl,
    });
    setIsSubmitting(false);
    if (act) {
      setIsEditModalOpen(false);
      setSelectedActivity(null);
    }
  };

  const handleDelete = (activity: Activity, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setConfirmState({
      isOpen: true,
      title: `¿Eliminar "${activity.titulo}"?`,
      description: "Esta actividad será eliminada permanentemente.",
      onConfirm: async () => {
        await deleteActivity(activity.id!);
        setConfirmState((s) => ({ ...s, isOpen: false }));
      },
    });
  };

  /* ── Derived data ──────────────────────────────────────────────────── */
  const isAdmin = profile?.role === "admin";
  const rutinarias = useMemo(() => {
    const list = activities.filter((a) => a.tipo === "rutinaria");
    return list.sort((a, b) => {
      const aNew = isNewActivity(a);
      const bNew = isNewActivity(b);
      if (aNew && !bNew) return -1;
      if (!aNew && bNew) return 1;
      return (b.created_at ?? "").localeCompare(a.created_at ?? "");
    });
  }, [activities]);

  const allUnicas = activities.filter((a) => a.tipo === "unica" || !a.tipo);

  /* ── Counts for filter badges ──────────────────────────────────────── */
  const statusCounts = useMemo(
    () => ({
      todas: allUnicas.length,
      pendiente: allUnicas.filter((a) => a.estado === "pendiente").length,
      en_proceso: allUnicas.filter((a) => a.estado === "en_proceso").length,
      completada: allUnicas.filter((a) => a.estado === "completada").length,
    }),
    [allUnicas],
  );

  /* ── Filtered + sorted tasks ──────────────────────────────────────── */
  const unicas = useMemo(() => {
    let result = allUnicas;

    // Filter by status
    if (statusFilter !== "todas") {
      result = result.filter((a) => a.estado === statusFilter);
    }

    // Filter by recruiter (admin only)
    if (recruiterFilter) {
      if (recruiterFilter === "__team__") {
        result = result.filter((a) => !a.asignado_a);
      } else {
        result = result.filter((a) => a.asignado_a === recruiterFilter);
      }
    }

    // Search by title/description
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (a) =>
          a.titulo.toLowerCase().includes(q) ||
          (a.descripcion && a.descripcion.toLowerCase().includes(q)),
      );
    }

    // Sort
    const STATUS_ORDER: Record<ActivityStatus, number> = {
      pendiente: 0,
      en_proceso: 1,
      completada: 2,
    };

    result = [...result].sort((a, b) => {
      // 0. Nuevas primero, sin importar el sort order
      const aNew = isNewActivity(a);
      const bNew = isNewActivity(b);
      if (aNew && !bNew) return -1;
      if (!aNew && bNew) return 1;

      if (sortOrder === "oldest") {
        return (a.created_at ?? "").localeCompare(b.created_at ?? "");
      }
      if (sortOrder === "status") {
        return STATUS_ORDER[a.estado] - STATUS_ORDER[b.estado];
      }
      // newest (default)
      return (b.created_at ?? "").localeCompare(a.created_at ?? "");
    });

    return result;
  }, [allUnicas, statusFilter, recruiterFilter, searchQuery, sortOrder]);

  /* ── Loading state ─────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="actividades-page">
        <div className="actividades-header"></div>
        <div className="actividades-empty">
          <p className="actividades-empty__title">Cargando...</p>
        </div>
      </div>
    );
  }

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <div className="actividades-page">
      {/* Hero */}
      <div
        className="actividades-header"
        style={{ paddingBlock: 0, margin: 0 }}
      ></div>

      <div className="actividades-layout">
        {/* ── Section: Asignación de Vacantes ────────────────────────── */}
        <section className="actividades-section">
          <div
            className="actividades-section__header"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "var(--spacing-lg)",
            }}
          >
            <div
              style={{ flex: 1, marginBottom: 0, cursor: 'default' }}
            >
              <div>
                <h2 className="actividades-section__title">
                  {isAdmin ? "Asignación de Vacantes" : "Tus Vacantes"}
                  <span className="actividades-section__count">
                    {vacantesManuales.length}
                  </span>
                </h2>
                <p className="actividades-section__desc">
                  {isAdmin ? "Asigna las vacantes activas a los reclutadores del equipo." : "Vacantes que te han sido asignadas."}
                </p>
              </div>
            </div>

            {isAdmin && (
              <button
                className="btn-primary btn-sm"
                onClick={() => setIsCreateVacanteModalOpen(true)}
              >
                <Plus size={16} aria-hidden="true" />
                <span>Nueva</span>
              </button>
            )}
          </div>

                {vacantesManuales.length === 0 ? (
                  <div className="actividades-empty">
                    <ClipboardList
                      size={40}
                      className="actividades-empty__icon"
                      aria-hidden="true"
                    />
                    <p className="actividades-empty__title">Sin vacantes</p>
                    <p className="actividades-empty__subtitle">
                      Crea una nueva asignación de vacante manualmente.
                    </p>
                  </div>
                ) : (
                    <div className="vacantes-grid">
                      {vacantesManuales.map((v) => {
                        const [area, ...seccionParts] = (v.descripcion || "").split(" - ");
                        let seccion = seccionParts.join(" - ");
                        if (!seccion) {
                          const match = positions.find(p => p.area === area && p.puesto === v.titulo);
                          if (match?.seccion) {
                            seccion = match.seccion;
                          }
                        }
                        
                        return (
                          <div key={v.id} className="rutinaria-card">
                            {isNewActivity(v) && (
                              <span className="activity-new-badge">Nueva</span>
                            )}
                            <div className="rutinaria-card-main">
                              <div className="rutinaria-icon">
                                <ClipboardList size={18} aria-hidden="true" />
                              </div>
                              <div className="rutinaria-content">
                                <h3 className="rutinaria-title">
                                  {v.titulo}
                                </h3>
                                {seccion && <p className="rutinaria-desc" style={{ color: 'var(--color-muted)' }}>{seccion}</p>}
                                <div className="rutinaria-badge" style={{ marginTop: "var(--spacing-sm)" }}>
                                  <AssigneeBadges act={v} isAdmin={isAdmin} currentUser={profile} />
                                </div>
                              </div>
                            </div>

                            {isAdmin && (
                              <div
                                className="activity-admin-actions"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button
                                      className="btn-ghost btn-icon"
                                      aria-label="Opciones"
                                    >
                                      <MoreVertical
                                        size={16}
                                        aria-hidden="true"
                                      />
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    align="end"
                                    className="activity-action-menu"
                                  >
                                    <button
                                      className="btn-ghost activity-action-item"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setAssignModalVacancy(v);
                                        // Popover handles closing automatically when clicking inside,
                                        // or we can rely on Radix UI's default behavior.
                                      }}
                                    >
                                      <UserPlus size={14} aria-hidden="true" />
                                      <span>Asignar a...</span>
                                    </button>
                                    <button
                                      className="btn-ghost activity-action-item text-danger"
                                      onClick={(e) => handleDelete(v, e)}
                                    >
                                      <Trash2 size={14} aria-hidden="true" />
                                      <span>Eliminar</span>
                                    </button>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            )}
                          </div>
                      );
                      })}
                    </div>
                )}
          </section>

        {/* ── Section: Rutinas ──────────────────────────────────────── */}
        <section className="actividades-section">
          <div
            className="actividades-section__header"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "var(--spacing-lg)",
            }}
          >
            <button
              type="button"
              className="actividades-section__toggle"
              onClick={() => setRutinariasCollapsed(!rutinariasCollapsed)}
              aria-expanded={!rutinariasCollapsed}
              style={{ flex: 1, marginBottom: 0 }}
            >
              <div>
                <h2 className="actividades-section__title">
                  {rutinariasCollapsed ? (
                    <ChevronRight size={18} aria-hidden="true" />
                  ) : (
                    <ChevronDown size={18} aria-hidden="true" />
                  )}
                  Responsabilidades
                  <span className="actividades-section__count">
                    {rutinarias.length}
                  </span>
                </h2>
                <p className="actividades-section__desc">
                  De manera recurrente, sin seguimiento de evidencias.
                </p>
              </div>
            </button>

            {isAdmin && (
              <button
                className="btn-primary btn-sm"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus size={16} aria-hidden="true" />
                <span>Crear</span>
              </button>
            )}
          </div>

          {!rutinariasCollapsed && (
            <>
              {rutinarias.length === 0 ? (
                <div className="actividades-empty">
                  <ListTodo
                    size={40}
                    className="actividades-empty__icon"
                    aria-hidden="true"
                  />
                  <p className="actividades-empty__title">
                    Sin responsabilidades
                  </p>
                  <p className="actividades-empty__subtitle">
                    {isAdmin
                      ? 'Crea una actividad tipo "Rutina" para asignarla.'
                      : "Aún no tienes responsabilidades asignadas."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="rutinarias-list">
                    {rutinarias.slice(0, rutinariasLimit).map((act) => (
                      <div key={act.id} className="rutinaria-card">
                        {isNewActivity(act) && (
                          <span className="activity-new-badge">Nueva</span>
                        )}
                        <div className="rutinaria-card-main">
                          <div className="rutinaria-icon">
                            <CheckCircle2 size={18} aria-hidden="true" />
                          </div>
                          <div className="rutinaria-content">
                            <h3 className="rutinaria-title">
                              {act.titulo}
                            </h3>
                            {act.descripcion && (
                              <p className="rutinaria-desc">
                                {act.descripcion}
                              </p>
                            )}
                            <div className="rutinaria-badge">
                              <AssigneeBadges act={act} isAdmin={isAdmin} currentUser={profile} />
                            </div>
                          </div>
                        </div>

                        {act.reference_image && (
                          <div className="rutinaria-card-right">
                            <img
                              src={act.reference_image}
                              alt="Referencia visual"
                              className="rutinaria-ref-img"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLightboxSrc(act.reference_image!);
                              }}
                            />
                          </div>
                        )}
                        {isAdmin && (
                          <div
                            className="activity-admin-actions"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  className="btn-ghost btn-icon"
                                  aria-label="Opciones"
                                >
                                  <MoreVertical size={16} aria-hidden="true" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent
                                align="end"
                                className="activity-action-menu"
                              >
                                <button
                                  className="btn-ghost activity-action-item"
                                  onClick={(e) => openEdit(act, e)}
                                >
                                  <Pencil size={14} aria-hidden="true" />
                                  <span>Editar</span>
                                </button>
                                <button
                                  className="btn-ghost activity-action-item text-danger"
                                  onClick={(e) => handleDelete(act, e)}
                                >
                                  <Trash2 size={14} aria-hidden="true" />
                                  <span>Eliminar</span>
                                </button>
                              </PopoverContent>
                            </Popover>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {rutinarias.length > 4 && (
                    <button
                      type="button"
                      className="btn-ghost actividades-show-more"
                      onClick={() =>
                        setRutinariasLimit(
                          rutinariasLimit <= 4 ? rutinarias.length : 4,
                        )
                      }
                    >
                      {rutinariasLimit <= 4
                        ? `Ver todas (${rutinarias.length})`
                        : "Ver menos"}
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </section>

        {/* ── Section: Tareas únicas ───────────────────────────────── */}
        <section className="actividades-section">
          <button
            type="button"
            className="actividades-section__header actividades-section__toggle"
            onClick={() => setActividadesCollapsed(!actividadesCollapsed)}
            aria-expanded={!actividadesCollapsed}
          >
            <div>
              <h2 className="actividades-section__title">
                {actividadesCollapsed ? (
                  <ChevronRight size={18} aria-hidden="true" />
                ) : (
                  <ChevronDown size={18} aria-hidden="true" />
                )}
                Actividades
                <span className="actividades-section__count">
                  {allUnicas.length}
                </span>
              </h2>
              <p className="actividades-section__desc">
                Seguimiento con avance y evidencias.
              </p>
            </div>
          </button>

          {!actividadesCollapsed && (
            <>
              {/* ── Filter toolbar ──────────────────────────────────────── */}
              {allUnicas.length > 0 && (
                <div className="actividades-toolbar">
                  {/* Status filter tabs */}
                  <div
                    className="actividades-status-tabs"
                    role="tablist"
                    aria-label="Filtrar por estado"
                  >
                    {(
                      [
                        { key: "todas" as const, label: "Todas" },
                        { key: "pendiente" as const, label: "Pendientes" },
                        { key: "en_proceso" as const, label: "En proceso" },
                        { key: "completada" as const, label: "Completadas" },
                      ] as const
                    ).map(({ key, label }) => (
                      <button
                        key={key}
                        role="tab"
                        aria-selected={statusFilter === key}
                        className={`actividades-status-tab ${statusFilter === key ? "actividades-status-tab--active" : ""}`}
                        onClick={() => setStatusFilter(key)}
                      >
                        {label}
                        <span className="actividades-status-tab__count">
                          {statusCounts[key]}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Search + Sort + Recruiter filter row */}
                  <div className="actividades-filters">
                    <div className="actividades-search">
                      <Search
                        size={16}
                        className="actividades-search__icon"
                        aria-hidden="true"
                      />
                      <input
                        type="search"
                        className="actividades-search__input"
                        placeholder="Buscar por título o descripción..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Buscar actividades"
                      />
                    </div>

                    <select
                      className="actividades-sort"
                      value={sortOrder}
                      onChange={(e) =>
                        setSortOrder(
                          e.target.value as "newest" | "oldest" | "status",
                        )
                      }
                      aria-label="Ordenar actividades"
                    >
                      <option value="newest">Más recientes</option>
                      <option value="oldest">Más antiguas</option>
                      <option value="status">Por estado</option>
                    </select>

                    {isAdmin && reclutadores.length > 0 && (
                      <select
                        className="actividades-recruiter-filter"
                        value={recruiterFilter}
                        onChange={(e) => setRecruiterFilter(e.target.value)}
                        aria-label="Filtrar por reclutador"
                      >
                        <option value="">Todos los reclutadores</option>
                        <option value="__team__">Todo el equipo</option>
                        {reclutadores.map((r: any) => (
                          <option key={r.id} value={r.id}>
                            {r.display_name || r.username}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              )}

              {allUnicas.length === 0 ? (
                <div className="actividades-empty">
                  <Inbox
                    size={40}
                    className="actividades-empty__icon"
                    aria-hidden="true"
                  />
                  <p className="actividades-empty__title">Sin actividades</p>
                  <p className="actividades-empty__subtitle">
                    {isAdmin
                      ? "Asigna una actividad para dar seguimiento."
                      : "No tienes actividades asignadas."}
                  </p>
                </div>
              ) : unicas.length === 0 ? (
                <div className="actividades-empty">
                  <Search
                    size={40}
                    className="actividades-empty__icon"
                    aria-hidden="true"
                  />
                  <p className="actividades-empty__title">Sin coincidencias</p>
                  <p className="actividades-empty__subtitle">
                    No hay actividades que coincidan con los filtros aplicados.
                  </p>
                  <button
                    className="btn-ghost"
                    style={{ marginTop: "var(--spacing-md)" }}
                    onClick={() => {
                      setStatusFilter("todas");
                      setSearchQuery("");
                      setRecruiterFilter("");
                      setSortOrder("newest");
                    }}
                  >
                    Limpiar filtros
                  </button>
                </div>
              ) : (
                <div className="actividades-grid">
                  {unicas.slice(0, actividadesLimit).map((act) => (
                    <div
                      key={act.id}
                      className="activity-card"
                      onClick={() => openDetails(act)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openDetails(act);
                        }
                      }}
                    >
                      {isNewActivity(act) && (
                        <span className="activity-new-badge">Nueva</span>
                      )}
                      <div className="activity-card-header">
                        <h3 className="activity-title">
                          {act.titulo}
                        </h3>
                        <span className={`activity-status ${act.estado}`}>
                          {ACTIVITY_STATUS_LABEL[act.estado]}
                        </span>
                      </div>
                      <p className="activity-desc">
                        {act.descripcion ? act.descripcion : "Sin descripción"}
                      </p>
                      <div className="activity-meta">
                        <AssigneeBadges act={act} isAdmin={isAdmin} currentUser={profile} />
                        {isAdmin && (
                          <div
                            className="activity-admin-actions"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  className="btn-ghost btn-icon"
                                  aria-label="Opciones"
                                >
                                  <MoreVertical size={16} aria-hidden="true" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent
                                align="end"
                                className="activity-action-menu"
                              >
                                <button
                                  className="btn-ghost activity-action-item"
                                  onClick={(e) => openEdit(act, e)}
                                >
                                  <Pencil size={14} aria-hidden="true" />
                                  <span>Editar</span>
                                </button>
                                <button
                                  className="btn-ghost activity-action-item text-danger"
                                  onClick={(e) => handleDelete(act, e)}
                                >
                                  <Trash2 size={14} aria-hidden="true" />
                                  <span>Eliminar</span>
                                </button>
                              </PopoverContent>
                            </Popover>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {unicas.length > 4 && (
                <button
                  type="button"
                  className="btn-ghost actividades-show-more"
                  onClick={() =>
                    setActividadesLimit(
                      actividadesLimit <= 4 ? unicas.length : 4,
                    )
                  }
                >
                  {actividadesLimit <= 4
                    ? `Ver todas (${unicas.length})`
                    : "Ver menos"}
                </button>
              )}
            </>
          )}
        </section>
      </div>

      <Modal
        isOpen={isCreateVacanteModalOpen}
        onClose={() => setIsCreateVacanteModalOpen(false)}
        title="Asignar Vacante"
        icon={<ClipboardList size={20} aria-hidden="true" />}
      >
        <form className="modal-body" onSubmit={handleCreateVacante} noValidate>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-md)" }}>
            <div className="form-group">
              <label htmlFor="vacante-area">Área</label>
              <select
                id="vacante-area"
                value={descripcion}
                onChange={(e) => {
                  setDescripcion(e.target.value);
                  setVacanteSeccion(""); // Reset seccion when area changes
                  setTitulo(""); // Reset puesto when area changes
                }}
              >
                <option value="">Todas las áreas</option>
                {areasOptions.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="vacante-seccion">Sección</label>
              <select
                id="vacante-seccion"
                value={vacanteSeccion}
                onChange={(e) => {
                  setVacanteSeccion(e.target.value);
                  setTitulo(""); // Reset puesto when seccion changes
                }}
                disabled={seccionesOptions.length === 0}
              >
                <option value="">Todas las secciones</option>
                {seccionesOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="vacante-puesto">Puesto</label>
              <select
                id="vacante-puesto"
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                disabled={puestosOptions.length === 0}
              >
                <option value="">Seleccione un puesto</option>
                {puestosOptions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="vacante-asignado">Asignar a</label>
              <select
                id="vacante-asignado"
                value={asignadoA}
                onChange={(e) => setAsignadoA(e.target.value)}
              >
                <option value="">Sin asignar</option>
                {reclutadores.map((r) => (
                  <option key={r.id} value={r.id}>
                    {capitalize(r.display_name || r.username)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsCreateVacanteModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !titulo}
            >
              {isSubmitting ? "Guardando..." : "Crear"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Actividad nueva"
        icon={<ClipboardList size={20} aria-hidden="true" />}
      >
        <form className="modal-body" onSubmit={handleCreate} noValidate>
          {/* Tipo selector */}
          <div className="form-group">
            <label>Tipo</label>
            <div className="activity-type-selector">
              <label
                className={`activity-type-option ${tipo === "unica" ? "active" : ""}`}
              >
                <input
                  type="radio"
                  name="tipo"
                  value="unica"
                  checked={tipo === "unica"}
                  onChange={() => setTipo("unica")}
                />
                Actividad
              </label>
              <label
                className={`activity-type-option ${tipo === "rutinaria" ? "active" : ""}`}
              >
                <input
                  type="radio"
                  name="tipo"
                  value="rutinaria"
                  checked={tipo === "rutinaria"}
                  onChange={() => setTipo("rutinaria")}
                />
                Responsabilidad
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="activity-titulo">Título</label>
            <input
              id="activity-titulo"
              required
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. Revisión de expedientes"
            />
          </div>

          <div className="form-group">
            <label htmlFor="activity-asignado">Asignar a</label>
            <select
              id="activity-asignado"
              value={asignadoA}
              onChange={(e) => setAsignadoA(e.target.value)}
            >
              <option value="">Todo el equipo</option>
              {reclutadores.map((r) => (
                <option key={r.id} value={r.id}>
                  {capitalize(r.display_name || r.username)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="activity-descripcion">Descripción</label>
            <SmartTextarea
              id="activity-descripcion"
              value={descripcion}
              onChange={setDescripcion}
              placeholder="Detalles de la actividad..."
            />
          </div>

          <div className="form-group">
            <label>Foto de Referencia (Opcional)</label>
            <div className="reference-upload-area">
              {referenceImagePreview ? (
                <div className="reference-preview">
                  <img src={referenceImagePreview} alt="Preview" />
                  <button
                    type="button"
                    className="btn-icon-danger"
                    onClick={() => {
                      setReferenceImageFile(null);
                      setReferenceImagePreview(null);
                    }}
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <label className="reference-upload-label">
                  <ImagePlus size={24} aria-hidden="true" />
                  <span>Subir foto de referencia</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setReferenceImageFile(file);
                        setReferenceImagePreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !titulo}
            >
              {isSubmitting ? "Guardando..." : "Asignar"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Edit ──────────────────────────────────────────── */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar actividad"
        icon={<Pencil size={20} aria-hidden="true" />}
      >
        <form className="modal-body" onSubmit={handleEdit} noValidate>
          <div className="form-group">
            <label>Tipo</label>
            <div className="activity-type-selector">
              <label
                className={`activity-type-option ${editTipo === "unica" ? "active" : ""}`}
              >
                <input
                  type="radio"
                  name="editTipo"
                  value="unica"
                  checked={editTipo === "unica"}
                  onChange={() => setEditTipo("unica")}
                />
                Tarea
              </label>
              <label
                className={`activity-type-option ${editTipo === "rutinaria" ? "active" : ""}`}
              >
                <input
                  type="radio"
                  name="editTipo"
                  value="rutinaria"
                  checked={editTipo === "rutinaria"}
                  onChange={() => setEditTipo("rutinaria")}
                />
                Rutina
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="edit-titulo">Título</label>
            <input
              id="edit-titulo"
              required
              type="text"
              value={editTitulo}
              onChange={(e) => setEditTitulo(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-asignado">Asignar a</label>
            <select
              id="edit-asignado"
              value={editAsignadoA}
              onChange={(e) => setEditAsignadoA(e.target.value)}
            >
              <option value="">Todo el equipo</option>
              {reclutadores.map((r) => (
                <option key={r.id} value={r.id}>
                  {capitalize(r.display_name || r.username)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="edit-descripcion">Descripción</label>
            <SmartTextarea
              id="edit-descripcion"
              value={editDescripcion}
              onChange={setEditDescripcion}
              placeholder="Detalles de la actividad..."
            />
          </div>

          <div className="form-group">
            <label>Foto de Referencia (Opcional)</label>
            <div className="reference-upload-area">
              {editReferenceImagePreview || editExistingReferenceImage ? (
                <div className="reference-preview">
                  <img
                    src={
                      editReferenceImagePreview || editExistingReferenceImage!
                    }
                    alt="Preview"
                  />
                  <button
                    type="button"
                    className="btn-icon-danger"
                    onClick={() => {
                      setEditReferenceImageFile(null);
                      setEditReferenceImagePreview(null);
                      setEditExistingReferenceImage(null);
                    }}
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <label className="reference-upload-label">
                  <ImagePlus size={24} aria-hidden="true" />
                  <span>Subir foto de referencia</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setEditReferenceImageFile(file);
                        setEditReferenceImagePreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !editTitulo}
            >
              {isSubmitting ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Detail / Proofs ─────────────────────────────────── */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedActivity(null);
          refresh();
        }}
        title={selectedActivity?.titulo ?? "Detalles de Tarea"}
        icon={<FileText size={20} aria-hidden="true" />}
        size="lg"
      >
        {selectedActivity && (
          <div className="modal-body">
            <div className="activity-detail-grid">
              <div className="form-group">
                <label htmlFor="detail-estado">Estado</label>
                <select
                  id="detail-estado"
                  value={selectedActivity.estado}
                  onChange={handleStatusChange}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_proceso">En Proceso</option>
                  <option value="completada">Completada</option>
                </select>
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <div className="activity-desc-block">
                  {selectedActivity.descripcion || "Sin descripción detallada."}
                </div>
              </div>
            </div>

            {selectedActivity.reference_image && (
              <div className="activity-reference-image-full">
                <h4>Foto de Referencia</h4>
                <div className="reference-image-well">
                  <img
                    src={selectedActivity.reference_image}
                    alt="Referencia visual"
                    onClick={() =>
                      setLightboxSrc(selectedActivity.reference_image!)
                    }
                  />
                </div>
              </div>
            )}

            <hr className="activity-detail-divider" />

            <h3 className="activity-proofs-heading">Evidencias / Pruebas</h3>

            <div className="proofs-list">
              {proofs.length === 0 ? (
                <p className="actividades-empty__subtitle">
                  No hay pruebas subidas aún.
                </p>
              ) : (
                proofs.map((proof) => (
                  <div key={proof.id} className="proof-item">
                    <a
                      href={proof.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {proof.file_name}
                    </a>
                    {isAdmin && (
                      <button
                        className="proof-item__delete"
                        onClick={() =>
                          handleDeleteProof(proof.id, proof.file_url)
                        }
                        aria-label={`Eliminar ${proof.file_name}`}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <label className="file-upload-wrapper">
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={isSubmitting}
                accept="image/*,.pdf"
              />
              <div className="file-upload-inner">
                <UploadCloud
                  size={28}
                  className="file-upload-icon"
                  aria-hidden="true"
                />
                <span className="file-upload-text">
                  {isSubmitting
                    ? "Subiendo archivo..."
                    : "Haz clic para subir un archivo (imagen o PDF)"}
                </span>
              </div>
            </label>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!assignModalVacancy}
        onClose={() => setAssignModalVacancy(null)}
        title="Asignar reclutador"
        icon={<UserPlus size={20} aria-hidden="true" />}
        size="sm"
      >
        <div className="modal-body" style={{ minHeight: "150px" }}>
          <div className="form-group">
            <label>Selecciona al responsable</label>
            <select
              className="text-input"
              value={assignModalVacancy?.asignado_a || ""}
              onChange={(e) => {
                if (assignModalVacancy) {
                  handleAssignVacancy(assignModalVacancy.id!, e.target.value);
                  setAssignModalVacancy(null);
                }
              }}
            >
              <option value="">Sin asignar</option>
              {reclutadores.map((r) => (
                <option key={r.id} value={r.id}>
                  {capitalize(r.display_name || r.username)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        description={confirmState.description}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((s) => ({ ...s, isOpen: false }))}
      />

      {lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc}
          alt="Referencia visual"
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </div>
  );
}

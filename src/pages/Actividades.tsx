import { useState, useEffect, useMemo, useRef } from "react";
import { useActivities } from "@/hooks/useActivities";
import { usePositions } from "@/lib/positions";
import { useAuth } from "@/hooks/useAuth";
import { usePagination } from "@/hooks/usePagination";
import { ActivitiesSection } from "@/components/ui/ActivitiesSection";
import { ResponsibilitiesSection } from "@/components/ui/ResponsibilitiesSection";
import {
  Activity,
  ActivityProof,
  ActivityStatus,
  ACTIVITY_STATUS_LABEL,
} from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { AssignVacancyModal } from "@/components/ui/AssignVacancyModal";
import { CreateActivityModal } from "@/components/ui/CreateActivityModal";
import { CreateVacancyModal } from "@/components/ui/CreateVacancyModal";
import { EditActivityModal } from "@/components/ui/EditActivityModal";
import { LightboxModal } from "@/components/ui/LightboxModal";
import { TaskDetailsModal } from "@/components/ui/TaskDetailsModal";
import { VacancyAssignmentSection } from "@/components/ui/VacancyAssignmentSection";
import { toast } from "@/lib/notify";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import "./Actividades.css";

/** Capitaliza la primera letra de cada palabra. */
function capitalize(str: string) {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

function isImage(filename: string): boolean {
  if (!filename) return false;
  const extension = filename.split(".").pop()?.toLowerCase() || "";
  return ["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(extension);
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
  const [assignModalVacancy, setAssignModalVacancy] = useState<Activity | null>(
    null,
  );
  const [proofs, setProofs] = useState<ActivityProof[]>([]);

  /* ── Create activity form state ─────────────────────────────────────── */
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [asignadoA, setAsignadoA] = useState("");
  const [tipo, setTipo] = useState<"unica" | "rutinaria">("unica");
  const [isCreating, setIsCreating] = useState(false);

  /* ── Create vacancy form state (isolated from activities) ───────────── */
  const [vacanteTitulo, setVacanteTitulo] = useState("");
  const [vacanteArea, setVacanteArea] = useState("");
  const [vacanteSeccion, setVacanteSeccion] = useState("");
  const [vacanteAsignadoA, setVacanteAsignadoA] = useState("");
  const [isCreatingVacancy, setIsCreatingVacancy] = useState(false);

  const [reclutadores, setReclutadores] = useState<any[]>([]);
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
  const [responsabilidadesCollapsed, setresponsabilidadesCollapsed] = useState(true);
  const [actividadesCollapsed, setActividadesCollapsed] = useState(true);

  /* ── Edit form state ───────────────────────────────────────────────── */
  const [editTitulo, setEditTitulo] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editAsignadoA, setEditAsignadoA] = useState("");
  const [editTipo, setEditTipo] = useState<"unica" | "rutinaria">("unica");
  const [editReferenceImageFile, setEditReferenceImageFile] =
    useState<File | null>(null);
  const [editReferenceImagePreview, setEditReferenceImagePreview] = useState<
    string | null
  >(null);
  const [editExistingReferenceImage, setEditExistingReferenceImage] = useState<
    string | null
  >(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [proofsLoading, setProofsLoading] = useState(false);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAssigningVacancy, setIsAssigningVacancy] = useState(false);
  const proofsRequestRef = useRef(0);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    isLoading: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    isLoading: false,
    onConfirm: () => {},
  });

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
    () =>
      Array.from(new Set(positions.map((p) => p.area))).sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
    [positions],
  );

  const seccionesOptions = useMemo(() => {
    let base = positions;
    if (vacanteArea) {
      base = base.filter((p) => p.area === vacanteArea);
    }
    return Array.from(new Set(base.map((p) => p.seccion).filter(Boolean))).sort(
      (a, b) => a.localeCompare(b, "es"),
    );
  }, [positions, vacanteArea]);

  const puestosOptions = useMemo(() => {
    let base = positions;
    if (vacanteArea) {
      base = base.filter((p) => p.area === vacanteArea);
    }
    if (vacanteSeccion) {
      base = base.filter((p) => p.seccion === vacanteSeccion);
    }
    return Array.from(new Set(base.map((p) => p.puesto))).sort((a, b) =>
      a.localeCompare(b, "es"),
    );
  }, [positions, vacanteArea, vacanteSeccion]);

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
        const nameA =
          (a as any).asignado_a_profile?.display_name ||
          (a as any).asignado_a_profile?.username ||
          "Z";
        const nameB =
          (b as any).asignado_a_profile?.display_name ||
          (b as any).asignado_a_profile?.username ||
          "Z";
        const nameCmp = nameA.localeCompare(nameB, "es");
        if (nameCmp !== 0) return nameCmp;
      }

      // 3. Por Puesto/Área (título y descripción)
      const titleA = a.titulo || "";
      const titleB = b.titulo || "";
      const titleCmp = titleA.localeCompare(titleB, "es");
      if (titleCmp !== 0) return titleCmp;

      const descA = a.descripcion || "";
      const descB = b.descripcion || "";
      return descA.localeCompare(descB, "es");
    });

    return list;
  }, [activities]);

  const handleAssignVacancy = async (
    activityId: string,
    recruiterId: string,
  ) => {
    if (isAssigningVacancy) return;
    setIsAssigningVacancy(true);
    const updated = await updateActivity(activityId, {
      asignado_a: recruiterId || null,
    });
    setIsAssigningVacancy(false);
    if (updated) setAssignModalVacancy(null);
  };

  const handleCreateVacante = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedTitle = vacanteTitulo.trim();
    if (!normalizedTitle) return;

    setIsCreatingVacancy(true);
    const finalDesc = vacanteSeccion
      ? `${vacanteArea} - ${vacanteSeccion}`
      : vacanteArea;
    const act = await createActivity(
      normalizedTitle,
      finalDesc,
      vacanteAsignadoA || null,
      "vacante",
    );

    setIsCreatingVacancy(false);
    if (act) {
      setIsCreateVacanteModalOpen(false);
      setVacanteTitulo("");
      setVacanteArea("");
      setVacanteSeccion("");
      setVacanteAsignadoA("");
    }
  };

  /* ── Handlers ──────────────────────────────────────────────────────── */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedTitle = titulo.trim();
    if (!normalizedTitle) return;

    setIsCreating(true);
    const act = await createActivity(
      normalizedTitle,
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

    setIsCreating(false);
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
    if (activity.tipo === "rutinaria") {
      if (activity.reference_image) {
        setLightboxSrc(activity.reference_image);
      }
      return;
    }

    const requestId = ++proofsRequestRef.current;
    setSelectedActivity(activity);
    setProofs([]);
    setProofsLoading(true);
    setIsDetailModalOpen(true);

    const nextProofs = await getProofs(activity.id!);
    if (requestId === proofsRequestRef.current) {
      setProofs(nextProofs);
      setProofsLoading(false);
    }
  };

  const handleStatusChange = async (newStatusString: string) => {
    if (!selectedActivity || isUpdatingStatus) return;

    const previousStatus = selectedActivity.estado;
    const newStatus = newStatusString as ActivityStatus;
    setSelectedActivity({ ...selectedActivity, estado: newStatus });
    setIsUpdatingStatus(true);

    const updated = await updateActivityStatus(selectedActivity.id!, newStatus);
    setIsUpdatingStatus(false);
    if (updated) {
      setSelectedActivity(updated as Activity);
    } else {
      setSelectedActivity((current) =>
        current ? { ...current, estado: previousStatus } : current,
      );
    }
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

    setIsUploadingProof(true);
    const proof = await uploadProof(selectedActivity.id!, file);
    if (proof) setProofs((prev) => [proof, ...prev]);
    setIsUploadingProof(false);
    e.target.value = "";
  };

  const handleDeleteProof = (proofId: string, url: string) => {
    setConfirmState({
      isOpen: true,
      title: "Eliminar prueba",
      isLoading: false,
      onConfirm: async () => {
        setConfirmState((state) => ({ ...state, isLoading: true }));
        const ok = await deleteProof(proofId, url);
        if (ok) {
          setProofs((prev) => prev.filter((p) => p.id !== proofId));
          setConfirmState((state) => ({
            ...state,
            isOpen: false,
            isLoading: false,
          }));
        } else {
          setConfirmState((state) => ({ ...state, isLoading: false }));
        }
      },
    });
  };

  const openEdit = (activity: Activity, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedActivity(activity);
    setEditTitulo(activity.titulo);
    setEditDescripcion(activity.descripcion || "");
    setEditAsignadoA(activity.asignado_a || "");
    setEditTipo(activity.tipo === "rutinaria" ? "rutinaria" : "unica");
    setEditReferenceImageFile(null);
    setEditReferenceImagePreview(null);
    setEditExistingReferenceImage(activity.reference_image || null);
    setIsEditModalOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedTitle = editTitulo.trim();
    if (!selectedActivity || !normalizedTitle) return;
    setIsEditing(true);

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
      titulo: normalizedTitle,
      descripcion: editDescripcion,
      asignado_a: editAsignadoA || null,
      tipo: editTipo,
      reference_image: newImageUrl,
    });
    setIsEditing(false);
    if (act) {
      setIsEditModalOpen(false);
      setSelectedActivity(null);
    }
  };

  const handleDelete = (activity: Activity, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setConfirmState({
      isOpen: true,
      title: "Eliminar actividad",
      isLoading: false,
      onConfirm: async () => {
        setConfirmState((state) => ({ ...state, isLoading: true }));
        const ok = await deleteActivity(activity.id!);
        if (ok) {
          setConfirmState((state) => ({
            ...state,
            isOpen: false,
            isLoading: false,
          }));
        } else {
          setConfirmState((state) => ({ ...state, isLoading: false }));
        }
      },
    });
  };

  /* ── Derived data ──────────────────────────────────────────────────── */
  const isAdmin = profile?.role === "admin";
  const responsabilidades = useMemo(() => {
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

  /* ── Pagination ──────────────────────────────────────────────────────── */
  const {
    pageItems: responsabilidadesPaginadas,
    currentPage: responsabilidadesPage,
    totalPages: responsabilidadesTotalPages,
    goToPage: goToresponsabilidadesPage,
    nextPage: nextresponsabilidadesPage,
    prevPage: prevresponsabilidadesPage,
    canGoNext: canGoNextResponsabilidades,
    canGoPrev: canGoPrevResponsabilidades,
  } = usePagination(responsabilidades, 10);

  const {
    pageItems: actividadesPaginadas,
    currentPage: actividadesPage,
    totalPages: actividadesTotalPages,
    goToPage: goToActividadesPage,
    nextPage: nextActividadesPage,
    prevPage: prevActividadesPage,
    canGoNext: canGoNextActividades,
    canGoPrev: canGoPrevActividades,
  } = usePagination(unicas, 12);

  /* ── Loading state ─────────────────────────────────────────────────── */
  if (loading) {
    return (
      <main className="actividades-page container">
        <header className="actividades-header">
          <h1>Actividades</h1>
        </header>
        <div className="actividades-empty" role="status" aria-live="polite">
          <p className="actividades-empty__title">Cargando actividades...</p>
        </div>
      </main>
    );
  }

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <main className="actividades-page container">
      <header className="actividades-header">
        <h1>Actividades</h1>
      </header>

      <div className="actividades-layout">
        <VacancyAssignmentSection
          vacancies={vacantesManuales}
          positions={positions}
          isAdmin={isAdmin}
          currentUserId={profile?.id}
          isNew={isNewActivity}
          onCreate={() => setIsCreateVacanteModalOpen(true)}
          onAssign={setAssignModalVacancy}
          onDelete={handleDelete}
        />

        <ResponsibilitiesSection
          responsibilities={responsabilidades}
          pageItems={responsabilidadesPaginadas}
          isCollapsed={responsabilidadesCollapsed}
          isAdmin={isAdmin}
          currentUserId={profile?.id}
          pagination={{
            currentPage: responsabilidadesPage,
            totalPages: responsabilidadesTotalPages,
            onPageChange: goToresponsabilidadesPage,
            onPrev: prevresponsabilidadesPage,
            onNext: nextresponsabilidadesPage,
            canGoPrev: canGoPrevResponsabilidades,
            canGoNext: canGoNextResponsabilidades,
          }}
          isNew={isNewActivity}
          onToggle={() =>
            setresponsabilidadesCollapsed((isCollapsed) => !isCollapsed)
          }
          onCreate={() => setIsCreateModalOpen(true)}
          onEdit={openEdit}
          onDelete={handleDelete}
          onViewReference={setLightboxSrc}
        />

        <ActivitiesSection
          activities={allUnicas}
          filteredActivities={unicas}
          pageItems={actividadesPaginadas}
          recruiters={reclutadores}
          isCollapsed={actividadesCollapsed}
          isAdmin={isAdmin}
          currentUserId={profile?.id}
          statusFilter={statusFilter}
          searchQuery={searchQuery}
          sortOrder={sortOrder}
          recruiterFilter={recruiterFilter}
          statusCounts={statusCounts}
          pagination={{
            currentPage: actividadesPage,
            totalPages: actividadesTotalPages,
            onPageChange: goToActividadesPage,
            onPrev: prevActividadesPage,
            onNext: nextActividadesPage,
            canGoPrev: canGoPrevActividades,
            canGoNext: canGoNextActividades,
          }}
          isNew={isNewActivity}
          onToggle={() =>
            setActividadesCollapsed((isCollapsed) => !isCollapsed)
          }
          onStatusFilterChange={setStatusFilter}
          onSearchQueryChange={setSearchQuery}
          onSortOrderChange={setSortOrder}
          onRecruiterFilterChange={setRecruiterFilter}
          onClearFilters={() => {
            setStatusFilter("todas");
            setSearchQuery("");
            setRecruiterFilter("");
            setSortOrder("newest");
          }}
          onOpen={openDetails}
          onEdit={openEdit}
          onDelete={handleDelete}
          onViewReference={setLightboxSrc}
        />
      </div>

      <CreateVacancyModal
        isOpen={isCreateVacanteModalOpen}
        onClose={() => {
          if (!isCreatingVacancy) setIsCreateVacanteModalOpen(false);
        }}
        isCreating={isCreatingVacancy}
        area={vacanteArea}
        onAreaChange={(value) => {
          setVacanteArea(value);
          setVacanteSeccion("");
          setVacanteTitulo("");
        }}
        areasOptions={areasOptions}
        seccion={vacanteSeccion}
        onSeccionChange={(value) => {
          setVacanteSeccion(value);
          setVacanteTitulo("");
        }}
        seccionesOptions={seccionesOptions}
        puesto={vacanteTitulo}
        onPuestoChange={setVacanteTitulo}
        puestosOptions={puestosOptions}
        asignadoA={vacanteAsignadoA}
        onAsignadoAChange={setVacanteAsignadoA}
        recruitersOptions={[
          { value: "", label: "Sin asignar" },
          ...reclutadores.map((reclutador) => ({
            value: reclutador.id,
            label: capitalize(reclutador.display_name || reclutador.username),
          })),
        ]}
        onSubmit={handleCreateVacante}
      />

      <CreateActivityModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          if (!isCreating) setIsCreateModalOpen(false);
        }}
        isCreating={isCreating}
        tipo={tipo}
        setTipo={setTipo}
        titulo={titulo}
        setTitulo={setTitulo}
        asignadoA={asignadoA}
        setAsignadoA={setAsignadoA}
        recruitersOptions={[
          { value: "", label: "Todo el equipo" },
          ...reclutadores.map((reclutador) => ({
            value: reclutador.id,
            label: capitalize(reclutador.display_name || reclutador.username),
          })),
        ]}
        descripcion={descripcion}
        setDescripcion={setDescripcion}
        referenceImagePreview={referenceImagePreview}
        referenceImageFile={referenceImageFile}
        setReferenceImageFile={setReferenceImageFile}
        setReferenceImagePreview={setReferenceImagePreview}
        onSubmit={handleCreate}
      />

      {/* ── Modal: Edit ──────────────────────────────────────────── */}
      <EditActivityModal
        isOpen={isEditModalOpen}
        onClose={() => {
          if (!isEditing) setIsEditModalOpen(false);
        }}
        isEditing={isEditing}
        tipo={editTipo}
        setTipo={setEditTipo}
        titulo={editTitulo}
        setTitulo={setEditTitulo}
        asignadoA={editAsignadoA}
        setAsignadoA={setEditAsignadoA}
        recruitersOptions={[
          { value: "", label: "Todo el equipo" },
          ...reclutadores.map((reclutador) => ({
            value: reclutador.id,
            label: capitalize(reclutador.display_name || reclutador.username),
          })),
        ]}
        descripcion={editDescripcion}
        setDescripcion={setEditDescripcion}
        referenceImagePreview={editReferenceImagePreview}
        referenceImageFile={editReferenceImageFile}
        existingReferenceImage={editExistingReferenceImage}
        setReferenceImageFile={setEditReferenceImageFile}
        setReferenceImagePreview={setEditReferenceImagePreview}
        setExistingReferenceImage={setEditExistingReferenceImage}
        onSubmit={handleEdit}
      />

      {/* ── Modal: Detail / Proofs ─────────────────────────────────── */}
      <TaskDetailsModal
        isOpen={isDetailModalOpen && !confirmState.isOpen && !lightboxSrc}
        onClose={() => {
          proofsRequestRef.current += 1;
          setIsDetailModalOpen(false);
        }}
        activity={selectedActivity}
        onStatusChange={handleStatusChange}
        isUpdatingStatus={isUpdatingStatus}
        onLightboxOpen={setLightboxSrc}
        proofsLoading={proofsLoading}
        proofs={proofs}
        isImage={isImage}
        isAdmin={isAdmin}
        onDeleteProof={handleDeleteProof}
        onUploadProof={handleFileUpload}
        isUploadingProof={isUploadingProof}
      />

      <AssignVacancyModal
        isOpen={Boolean(assignModalVacancy)}
        onClose={() => {
          if (!isAssigningVacancy) setAssignModalVacancy(null);
        }}
        isAssigning={isAssigningVacancy}
        vacancyId={assignModalVacancy?.id}
        currentAssignee={assignModalVacancy?.asignado_a || ""}
        options={[
          { value: "", label: "Sin asignar" },
          ...reclutadores.map((reclutador) => ({
            value: reclutador.id,
            label: capitalize(reclutador.display_name || reclutador.username),
          })),
        ]}
        onAssign={(vacancyId, assigneeId) => {
          void handleAssignVacancy(vacancyId, assigneeId);
        }}
      />

      <DeleteConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        isLoading={confirmState.isLoading}
        onConfirm={confirmState.onConfirm}
        onCancel={() => {
          if (!confirmState.isLoading) {
            setConfirmState((state) => ({ ...state, isOpen: false }));
          }
        }}
      />

      <LightboxModal
        isOpen={Boolean(lightboxSrc)}
        onClose={() => setLightboxSrc(null)}
        src={lightboxSrc}
      />
    </main>
  );
}

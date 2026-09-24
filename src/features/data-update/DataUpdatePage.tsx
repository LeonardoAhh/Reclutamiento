import { useCallback, useEffect, useMemo, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { FilePlus2, RefreshCw, Trash2, UserRoundCheck } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Pagination } from "@/components/ui/Pagination";
import { SearchField } from "@/components/ui/SearchField";
import { useAuth } from "@/hooks/useAuth";
import { usePagination } from "@/hooks/usePagination";
import { toast } from "@/lib/notify";
import { normalizeString } from "@/lib/utils";
import {
  dataUpdateError,
  deleteDataUpdateCampaign,
  getDataUpdateCampaignDetail,
  listDataUpdateCampaigns,
  listDataUpdateIncidents,
  listEligibleDataUpdateProfiles,
} from "./api";
import { CampaignImportModal } from "./CampaignImportModal";
import { compareDataUpdateRecords, DATA_UPDATE_PAGE_SIZE } from "./constants";
import { DataUpdateAdminPanel } from "./DataUpdateAdminPanel";
import { DataUpdateStatus } from "./DataUpdateStatus";
import { DataUpdateLockerPanel } from "./DataUpdateLockerPanel";
import { DataUpdateWizard } from "./DataUpdateWizard";
import type {
  DataUpdateCampaign,
  DataUpdateCampaignDetail,
  DataUpdateIncident,
  DataUpdateProfileOption,
  DataUpdateRecord,
} from "./types";
import "./DataUpdatePage.css";

function useOnlineStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}

function campaignOptionLabel(campaign: DataUpdateCampaign): string {
  const name = campaign.name.trim();
  const year = String(campaign.year);
  return name.endsWith(year) ? name : `${name} · ${year}`;
}

interface DataUpdateWorkGroup {
  key: string;
  area: string;
  isCompleted: boolean;
  records: DataUpdateRecord[];
}

function workGroupKey(record: DataUpdateRecord): string {
  const completionGroup = record.status === "completado" ? "completed" : "active";
  return [completionGroup, record.identity.area.trim() || "Sin área"].join("\u0000");
}

function workGroupId(key: string): string {
  return `data-update-work-group-${encodeURIComponent(key)}`;
}

function groupWorkRecords(records: DataUpdateRecord[]): DataUpdateWorkGroup[] {
  return records.reduce<DataUpdateWorkGroup[]>((groups, record) => {
    const key = workGroupKey(record);
    const currentGroup = groups[groups.length - 1];
    if (currentGroup?.key === key) {
      currentGroup.records.push(record);
      return groups;
    }
    groups.push({
      key,
      area: record.identity.area.trim() || "Sin área",
      isCompleted: record.status === "completado",
      records: [record],
    });
    return groups;
  }, []);
}

export function DataUpdatePage() {
  const { profile, user } = useAuth();
  const online = useOnlineStatus();
  const isAdmin = profile?.role === "admin";
  const canAccess = isAdmin || profile?.role === "reclutador";
  const [campaigns, setCampaigns] = useState<DataUpdateCampaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [detail, setDetail] = useState<DataUpdateCampaignDetail | null>(null);
  const [profiles, setProfiles] = useState<DataUpdateProfileOption[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<DataUpdateRecord | null>(null);
  const [incidents, setIncidents] = useState<DataUpdateIncident[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [campaignPendingDelete, setCampaignPendingDelete] = useState<DataUpdateCampaign | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWorkGroup, setSelectedWorkGroup] = useState("");
  const [pendingWorkGroupFocus, setPendingWorkGroupFocus] = useState<string | null>(null);
  const [activeView, setActiveView] = useState("work");

  const loadCampaigns = useCallback(async (preferredId?: string) => {
    if (!canAccess || !online) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await listDataUpdateCampaigns();
      setCampaigns(result);
      setSelectedCampaignId((current) => {
        const requestedId = preferredId ?? current;
        return result.some((campaign) => campaign.id === requestedId)
          ? requestedId
          : result[0]?.id ?? "";
      });
    } catch (caught) {
      setError(dataUpdateError(caught));
    } finally {
      setLoading(false);
    }
  }, [canAccess, online]);

  const loadDetail = useCallback(async (background = false) => {
    if (!selectedCampaignId || !online) {
      setDetail(null);
      return;
    }
    if (!background) setLoading(true);
    setError(null);
    try {
      setDetail(await getDataUpdateCampaignDetail(selectedCampaignId));
    } catch (caught) {
      setError(dataUpdateError(caught));
    } finally {
      if (!background) setLoading(false);
    }
  }, [selectedCampaignId, online]);

  const updateDetailRecord = useCallback((updatedRecord: DataUpdateRecord) => {
    setDetail((current) => {
      if (!current) return current;
      const previous = current.records.find((record) => record.id === updatedRecord.id);
      if (!previous) return current;
      const merged = {
        ...updatedRecord,
        assignedName: updatedRecord.assignedName ?? previous.assignedName,
        campaignName: updatedRecord.campaignName ?? previous.campaignName,
      };
      return {
        ...current,
        records: current.records.map((record) => record.id === merged.id ? merged : record),
      };
    });
  }, []);

  const removeDetailRecord = useCallback((recordId: string) => {
    setDetail((current) => {
      if (!current) return current;
      return {
        ...current,
        records: current.records.filter((record) => record.id !== recordId),
      };
    });
  }, []);

  useEffect(() => { void loadCampaigns(); }, [loadCampaigns]);
  useEffect(() => { void loadDetail(); }, [loadDetail]);
  useEffect(() => {
    if (!isAdmin || !online) return;
    void listEligibleDataUpdateProfiles()
      .then(setProfiles)
      .catch((caught) => setError(dataUpdateError(caught)));
  }, [isAdmin, online]);
  useEffect(() => {
    if (!isAdmin && activeView === "admin") setActiveView("work");
  }, [activeView, isAdmin]);

  const myRecords = useMemo(
    () => detail?.records.filter((record) => record.assignedTo === user?.id) ?? [],
    [detail, user?.id],
  );
  const visibleMyRecords = useMemo(() => {
    const terms = normalizeString(searchTerm).split(/\s+/).filter(Boolean);
    return myRecords
      .filter((record) => {
        if (terms.length === 0) return true;
        const searchableText = normalizeString([
          record.identity.employeeNumber,
          record.identity.name,
          record.identity.area,
          record.identity.section,
          record.identity.position,
          record.identity.shift,
        ].join(" "));
        return terms.every((term) => searchableText.includes(term));
      })
      .sort((left, right) => (
        Number(left.status === "completado") - Number(right.status === "completado")
        || compareDataUpdateRecords(left, right)
      ));
  }, [myRecords, searchTerm]);
  const visibleWorkGroups = useMemo(
    () => groupWorkRecords(visibleMyRecords),
    [visibleMyRecords],
  );
  const filteredWorkRecords = useMemo(
    () => selectedWorkGroup
      ? visibleMyRecords.filter((record) => workGroupKey(record) === selectedWorkGroup)
      : visibleMyRecords,
    [selectedWorkGroup, visibleMyRecords],
  );
  const recordPagination = usePagination(filteredWorkRecords, DATA_UPDATE_PAGE_SIZE);
  const pageWorkGroups = useMemo(
    () => groupWorkRecords(recordPagination.pageItems),
    [recordPagination.pageItems],
  );
  const workGroupOptions = useMemo(
    () => visibleWorkGroups.map((group) => ({
      value: group.key,
      label: `${group.isCompleted ? "COMPLETADOS · " : ""}${group.area}`.toLocaleUpperCase("es-MX"),
    })),
    [visibleWorkGroups],
  );
  const myCompletedCount = myRecords.filter(
    (record) => record.status === "completado",
  ).length;
  const completedCount = detail?.records.filter((record) => record.status === "completado").length ?? 0;
  const totalVisibleCount = detail?.records.length ?? 0;
  const completionPercentage = totalVisibleCount > 0
    ? Math.round((completedCount / totalVisibleCount) * 100)
    : 0;
  const selectedCampaign = campaigns.find((campaign) => campaign.id === selectedCampaignId) ?? null;

  useEffect(() => {
    if (!pendingWorkGroupFocus) return;
    const frame = window.requestAnimationFrame(() => {
      const group = document.getElementById(workGroupId(pendingWorkGroupFocus));
      group?.scrollIntoView({ block: "start" });
      group?.focus({ preventScroll: true });
      setPendingWorkGroupFocus(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pendingWorkGroupFocus, recordPagination.currentPage]);

  const goToWorkGroup = (groupKey: string) => {
    setSelectedWorkGroup(groupKey);
    recordPagination.goToPage(1);
    setPendingWorkGroupFocus(groupKey || null);
  };

  const openRecord = async (record: DataUpdateRecord) => {
    if (!online || record.status === "completado") return;
    setBusy(true);
    try {
      setIncidents(await listDataUpdateIncidents(record.id));
      setSelectedRecord(record);
    } catch (caught) {
      toast.error({ title: dataUpdateError(caught) });
    } finally {
      setBusy(false);
    }
  };

  const confirmCampaignDeletion = async () => {
    if (!campaignPendingDelete || deleting) return;
    setDeleting(true);
    setBusy(true);
    setDeleteError(null);
    try {
      await deleteDataUpdateCampaign(campaignPendingDelete.id);
      setCampaignPendingDelete(null);
      setDetail(null);
      setSelectedRecord(null);
      setSearchTerm("");
      toast.success({ title: "Campaña eliminada" });
      await loadCampaigns();
    } catch (caught) {
      setDeleteError(dataUpdateError(caught));
    } finally {
      setDeleting(false);
      setBusy(false);
    }
  };

  if (!canAccess) {
    return (
      <main className="data-update-page container" aria-labelledby="data-update-title">
        <header className="page-header">
          <div className="page-header__content">
            <h1 id="data-update-title" className="app-page-title">Actualización de datos</h1>
            <p>No tienes acceso a este módulo.</p>
          </div>
        </header>
      </main>
    );
  }

  if (selectedRecord && detail) {
    return (
      <main className="data-update-page container">
        <DataUpdateWizard
          key={selectedRecord.id}
          record={selectedRecord}
          campaign={detail}
          incidents={incidents}
          online={online}
          onCancel={() => setSelectedRecord(null)}
          onCompleted={(updatedRecord) => {
            updateDetailRecord(updatedRecord);
            setSelectedRecord(null);
          }}
        />
      </main>
    );
  }

  return (
    <main className="data-update-page container" aria-labelledby="data-update-title">
      <header className="page-header data-update-page__header">
        <div className="page-header__content">
          <h1 id="data-update-title" className="app-page-title">Actualización de datos</h1>

        </div>
        {isAdmin && (
          <div className="page-header__actions">
            <button type="button" className="btn-primary" onClick={() => setImportOpen(true)} disabled={!online}>
              <FilePlus2 aria-hidden="true" />
              Nueva campaña
            </button>
          </div>
        )}
      </header>

      {!online && <p className="data-update-offline" role="alert">Este módulo necesita conexión. Reconéctate para consultar o guardar información.</p>}
      {error && <p className="form-error" role="alert">{error}</p>}

      {campaigns.length > 0 && (
        <div className="data-update-overview">
          <section className="data-update-campaign-toolbar" aria-label="Campaña activa">
            <div className="form-group">
              <label htmlFor="data-update-campaign">Campaña</label>
              <CustomSelect
                id="data-update-campaign"
                value={selectedCampaignId}
                className="data-update-campaign-select"
                options={campaigns.map((campaign) => ({ value: campaign.id, label: campaignOptionLabel(campaign) }))}
                onChange={(campaignId) => {
                  setSelectedCampaignId(campaignId);
                  setSearchTerm("");
                  setSelectedWorkGroup("");
                  recordPagination.goToPage(1);
                }}
                showPlaceholderOption={false}
                disabled={loading || busy}
              />
            </div>
            <div className="data-update-campaign-actions">
              <button type="button" className="btn-secondary" onClick={() => void loadDetail()} disabled={!online || loading || busy}>
                <RefreshCw aria-hidden="true" />
                Actualizar
              </button>
              {isAdmin && (
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => {
                    setDeleteError(null);
                    setCampaignPendingDelete(selectedCampaign);
                  }}
                  disabled={!online || loading || busy || !selectedCampaign}
                  aria-label={selectedCampaign
                    ? `Eliminar`
                    : "Eliminar"}
                >
                  <Trash2 aria-hidden="true" />
                  Eliminar
                </button>
              )}
            </div>
          </section>

          {!loading && detail && (
            <section className="card data-update-summary-card" aria-label="Resumen de campaña">
              <dl className="data-update-summary">
                <div><dt>Mis asignados</dt><dd>{myRecords.length}</dd></div>
                <div><dt>Completados</dt><dd>{myCompletedCount}</dd></div>
                <div><dt>Total visible</dt><dd>{totalVisibleCount}</dd></div>
              </dl>
              {isAdmin && (
                <div className="data-update-summary-progress">
                  <div className="data-update-summary-progress__heading">
                    <span>Avance global</span>
                    <strong>{completionPercentage}%</strong>
                  </div>
                  <progress
                    className="data-update-summary-progress__bar"
                    value={completedCount}
                    max={totalVisibleCount || 1}
                    aria-label={`${completionPercentage} por ciento de colaboradores completados`}
                  />
                  <p>{completedCount} de {totalVisibleCount} colaboradores completados</p>
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {loading ? (
        <p className="data-update-message" role="status">Cargando actualización de datos…</p>
      ) : campaigns.length === 0 ? (
        <section className="card data-update-empty" aria-labelledby="data-update-empty-title">
          <UserRoundCheck aria-hidden="true" />
          <h2 id="data-update-empty-title">Sin campañas disponibles</h2>
          <p className="text-muted">{isAdmin ? "Crea una campaña, importa la información" : "Aún no tienes colaboradores asignados."}</p>
        </section>
      ) : detail ? (
        <>
          <Tabs.Root className="data-update-tabs" value={activeView} onValueChange={setActiveView}>
            <Tabs.List
              className={`data-update-tabs__list${isAdmin ? " data-update-tabs__list--admin" : ""}`}
              aria-label="Vistas de actualización de datos"
            >
              <Tabs.Trigger className="data-update-tabs__trigger" value="work">
                Mi trabajo
              </Tabs.Trigger>
              <Tabs.Trigger className="data-update-tabs__trigger" value="locker">
                Locker
              </Tabs.Trigger>
              {isAdmin && (
                <Tabs.Trigger className="data-update-tabs__trigger" value="admin">
                  Administración
                </Tabs.Trigger>
              )}
            </Tabs.List>

            <Tabs.Content className="data-update-tabs__content" value="work">
              <section className="data-update-queue" aria-labelledby="data-update-queue-title">
                <div className="data-update-section-heading">
                  <div>
                    <h2 id="data-update-queue-title">Mi trabajo</h2>
                    <p className="text-muted">Los registros en proceso continúan desde el último paso guardado.</p>
                  </div>
                </div>
                {myRecords.length > 0 && (
                  <div className="data-update-work-toolbar">
                    <SearchField
                      id="data-update-record-search"
                      className="data-update-queue__search"
                      label="Buscar en mi trabajo"
                      placeholder="Número, nombre, área, sección, puesto o turno"
                      value={searchTerm}
                      onChange={(event) => {
                        setSearchTerm(event.target.value);
                        recordPagination.goToPage(1);
                      }}
                      onClear={() => {
                        setSearchTerm("");
                        recordPagination.goToPage(1);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Escape" && searchTerm) {
                          setSearchTerm("");
                          recordPagination.goToPage(1);
                        }
                      }}
                      aria-controls="data-update-record-list"
                      autoComplete="off"
                    />
                    {visibleMyRecords.length > 0 && (
                      <div className="form-group data-update-work-group-navigation">
                        <label className="sr-only" htmlFor="data-update-work-group-navigation">
                          Filtrar por área
                        </label>
                        <CustomSelect
                          id="data-update-work-group-navigation"
                          value={selectedWorkGroup}
                          options={workGroupOptions}
                          placeholder="TODAS LAS ÁREAS"
                          showPlaceholderOption
                          onChange={goToWorkGroup}
                        />
                      </div>
                    )}
                  </div>
                )}
                {myRecords.length === 0 ? (
                  <p className="data-update-message">No tienes registros asignados en esta campaña.</p>
                ) : visibleMyRecords.length === 0 ? (
                  <div id="data-update-record-list" className="data-update-search-empty" role="status">
                    <p>No hay coincidencias para “{searchTerm.trim()}”.</p>
                    <button type="button" className="btn-secondary" onClick={() => setSearchTerm("")}>
                      Limpiar búsqueda
                    </button>
                  </div>
                ) : (
                  <>
                    <div id="data-update-record-list" className="data-update-record-grid">
                      {pageWorkGroups.flatMap((group) =>
                        group.records.map((record, index) => (
                          <article
                            key={record.id}
                            id={index === 0 ? workGroupId(group.key) : undefined}
                            className={`card data-update-record-card${index === 0 ? " data-update-work-card__group-start" : ""}`}
                            aria-describedby={index === 0 ? `${workGroupId(group.key)}-label` : undefined}
                            tabIndex={index === 0 ? -1 : undefined}
                          >
                            {index === 0 && (
                              <span id={`${workGroupId(group.key)}-label`} className="sr-only">
                                {group.isCompleted ? "Completados" : "Área"}: {group.area}
                              </span>
                            )}
                            <div>
                              <div className="data-update-work-card__name-row">
                                <span className="data-update-work-card__identity type-caption-up text-muted">
                                  <span>{record.identity.employeeNumber}</span>
                                  {record.identity.shift && <span>Turno: {record.identity.shift}</span>}
                                </span>
                                <DataUpdateStatus status={record.status} />
                              </div>
                              <h3>{record.identity.name}</h3>
                            </div>
                            <button
                              type="button"
                              className={`data-update-work-card__action${record.status === "completado" ? " btn-secondary" : " btn-primary"}`}
                              onClick={() => void openRecord(record)}
                              disabled={!online || busy || record.status === "completado"}
                            >
                              {record.status === "pendiente" ? "Comenzar" : record.status === "en_proceso" ? "Continuar" : "Completado"}
                            </button>
                          </article>
                        )),
                      )}
                    </div>
                    {recordPagination.totalPages > 1 && (
                      <Pagination
                        currentPage={recordPagination.currentPage}
                        totalPages={recordPagination.totalPages}
                        onPageChange={recordPagination.goToPage}
                        onPrev={recordPagination.prevPage}
                        onNext={recordPagination.nextPage}
                        canGoPrev={recordPagination.canGoPrev}
                        canGoNext={recordPagination.canGoNext}
                        ariaLabel="Paginación de registros asignados"
                        variant="compact"
                      />
                    )}
                  </>
                )}
              </section>
            </Tabs.Content>

            <Tabs.Content className="data-update-tabs__content" value="locker">
              <DataUpdateLockerPanel
                records={detail.records}
                canEdit={canAccess}
                onRecordUpdated={updateDetailRecord}
              />
            </Tabs.Content>

            {isAdmin && (
              <Tabs.Content className="data-update-tabs__content" value="admin">
                <DataUpdateAdminPanel
                  detail={detail}
                  profiles={profiles}
                  busy={busy}
                  online={online}
                  onBusyChange={setBusy}
                  onShiftsUpdated={() => void loadDetail(true)}
                  onOpenRecord={(record) => void openRecord(record)}
                  onRecordUpdated={updateDetailRecord}
                  onRecordDeleted={removeDetailRecord}
                />
              </Tabs.Content>
            )}
          </Tabs.Root>
        </>
      ) : null}

      {isAdmin && profile && (
        <CampaignImportModal
          isOpen={importOpen}
          profiles={profiles}
          currentUserId={profile.id}
          onClose={() => setImportOpen(false)}
          onCreated={(campaignId) => {
            setImportOpen(false);
            toast.success({ title: "Campaña creada y repartida" });
            void loadCampaigns(campaignId);
          }}
        />
      )}

      {isAdmin && (
        <ConfirmModal
          isOpen={campaignPendingDelete !== null}
          title="Eliminar"
          description={campaignPendingDelete
            ? `Esta acción no se puede deshacer.`
            : undefined}
          confirmLabel="Eliminar"
          cancelLabel="Cancelar"
          onConfirm={() => void confirmCampaignDeletion()}
          onCancel={() => {
            if (deleting) return;
            setCampaignPendingDelete(null);
            setDeleteError(null);
          }}
          isDestructive
          isLoading={deleting}
          loadingLabel="Eliminando campaña…"
          errorMessage={deleteError ?? undefined}
        />
      )}
    </main>
  );
}

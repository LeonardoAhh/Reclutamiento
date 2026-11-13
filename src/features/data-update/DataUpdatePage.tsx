import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageHeaderAccessory, PageHeading } from '@/components/layout/PageHeading';
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { ChartNoAxesCombined, FilePlus2, FileSpreadsheet, Trash2, UserRoundCheck } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Pagination } from "@/components/ui/Pagination";
import { SearchField } from "@/components/ui/SearchField";
import { useAuth } from "@/hooks/useAuth";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useDataUpdateText } from "./translations";
import { useTeamDirectory } from '@/features/team/TeamProvider';
import { usePagination } from "@/hooks/usePagination";
import { toast } from "@/lib/notify";
import { normalizeString } from "@/lib/utils";
import {
  dataUpdateError,
  deleteDataUpdateCampaign,
  getDataUpdateCampaignDetail,
  listDataUpdateCampaigns,
  listCampaignDataUpdateIncidents,
  listDataUpdateIncidents,
  listDataUpdateAudit,
  listEligibleDataUpdateProfiles,
} from "./api";
import { CampaignImportModal } from "./CampaignImportModal";
import { compareDataUpdateRecords, DATA_UPDATE_PAGE_SIZE } from "./constants";
import { DataUpdateAdminPanel } from "./DataUpdateAdminPanel";
import { DataUpdateCompletedResults } from "./DataUpdateCompletedResults";
import { DataUpdateLockerPanel } from "./DataUpdateLockerPanel";
import { DataUpdateProgressPage } from "./DataUpdateProgressPage";
import { DataUpdateWizard } from "./DataUpdateWizard";
import { DataUpdateWorkResults, type DataUpdateWorkGroup } from "./DataUpdateWorkResults";
import { exportDataUpdateCampaign } from "./exportExcel";
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

function workGroupKey(record: DataUpdateRecord): string {
  const completionGroup = record.status === "completado" ? "completed" : "active";
  return [completionGroup, record.identity.area.trim() || "Sin área"].join("\u0000");
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
  const t = useDataUpdateText();
  const { members } = useTeamDirectory();
  const { profile, user } = useAuth();
  const online = useOnlineStatus();
  const showHeaderSearch = useMediaQuery('(min-width: 768px)');
  const isAdmin = profile?.role === "admin";
  const canAccess = isAdmin || profile?.role === "reclutador";
  const [campaigns, setCampaigns] = useState<DataUpdateCampaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [detail, setDetail] = useState<DataUpdateCampaignDetail | null>(null);
  const [profiles, setProfiles] = useState<DataUpdateProfileOption[]>([]);
  const progressTriggerRef = useRef<HTMLButtonElement>(null);
  const wasProgressPageOpen = useRef(false);
  const [selectedRecord, setSelectedRecord] = useState<DataUpdateRecord | null>(null);
  const [incidents, setIncidents] = useState<DataUpdateIncident[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [campaignPendingDelete, setCampaignPendingDelete] = useState<DataUpdateCampaign | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeView, setActiveView] = useState("work");

  useEffect(() => {
    if (progressOpen) {
      wasProgressPageOpen.current = true;
    } else if (wasProgressPageOpen.current) {
      wasProgressPageOpen.current = false;
      progressTriggerRef.current?.focus();
    }
  }, [progressOpen]);

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
    let current = true;
    void listEligibleDataUpdateProfiles(members)
      .then(rows => { if (current) setProfiles(rows); })
      .catch(caught => { if (current) setError(dataUpdateError(caught)); });
    return () => { current = false; };
  }, [isAdmin, online, members]);
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
  const recordPagination = usePagination(visibleMyRecords, DATA_UPDATE_PAGE_SIZE);
  const pageWorkGroups = useMemo(
    () => groupWorkRecords(recordPagination.pageItems),
    [recordPagination.pageItems],
  );
  const myCompletedCount = myRecords.filter(
    (record) => record.status === "completado",
  ).length;
  const completedRecords = useMemo(
    () => detail?.records.filter((record) => record.status === "completado") ?? [],
    [detail],
  );
  const visibleCompletedRecords = useMemo(() => {
    const terms = normalizeString(searchTerm).split(/\s+/).filter(Boolean);
    if (terms.length === 0) return completedRecords;
    return completedRecords.filter((record) => {
      const searchableText = normalizeString([
        record.identity.employeeNumber,
        record.identity.name,
        record.identity.area,
        record.identity.shift,
      ].join(" "));
      return terms.every((term) => searchableText.includes(term));
    });
  }, [completedRecords, searchTerm]);
  const completedPagination = usePagination(visibleCompletedRecords, DATA_UPDATE_PAGE_SIZE);
  const totalVisibleCount = detail?.records.length ?? 0;
  const selectedCampaign = campaigns.find((campaign) => campaign.id === selectedCampaignId) ?? null;
  const activeSearchLabel = activeView === "work"
    ? t("Buscar en mi trabajo")
    : activeView === "locker"
      ? t("Buscar lockers")
      : activeView === "completed"
        ? t("Buscar completados")
        : t("Buscar en administración");
  const activeSearchCount = activeView === "work"
    ? myRecords.length
    : activeView === "completed"
      ? completedRecords.length
      : detail?.records.length ?? 0;

  const changeSearchTerm = (value: string) => {
    setSearchTerm(value);
    if (activeView === "work") recordPagination.goToPage(1);
    if (activeView === "completed") completedPagination.goToPage(1);
  };

  const searchControl = (
    <SearchField
      id="data-update-active-search"
      className={showHeaderSearch ? 'search-field--intrinsic search-field--header' : undefined}
      label={activeSearchLabel}
      placeholder={t("Buscar")}
      value={searchTerm}
      onChange={(event) => changeSearchTerm(event.target.value)}
      onClear={() => changeSearchTerm("")}
      onKeyDown={(event) => {
        if (event.key === "Escape" && searchTerm) changeSearchTerm("");
      }}
      aria-controls={
        activeView === "work"
          ? "data-update-record-list"
          : activeView === "locker"
            ? "data-update-locker-list"
            : activeView === "completed"
              ? "data-update-completed-list"
              : "data-update-admin-list"
      }
      autoComplete="off"
    />
  );

  const exportCampaign = async () => {
    if (!detail || busy) return;
    setBusy(true);
    try {
      const recordIds = detail.records.map((record) => record.id);
      const [audit, campaignIncidents] = await Promise.all([
        listDataUpdateAudit(recordIds),
        listCampaignDataUpdateIncidents(recordIds),
      ]);
      await exportDataUpdateCampaign({ detail, audit, incidents: campaignIncidents });
      toast.success({ title: t("Excel generado") });
    } catch (caught) {
      toast.error({ title: t(dataUpdateError(caught)) });
    } finally {
      setBusy(false);
    }
  };

  const openRecord = async (record: DataUpdateRecord) => {
    if (!online || record.status === "completado") return;
    setBusy(true);
    try {
      setIncidents(await listDataUpdateIncidents(record.id));
      setSelectedRecord(record);
    } catch (caught) {
      toast.error({ title: t(dataUpdateError(caught)) });
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
      toast.success({ title: t("Campaña eliminada") });
      await loadCampaigns();
    } catch (caught) {
      setDeleteError(dataUpdateError(caught));
    } finally {
      setDeleting(false);
      setBusy(false);
    }
  };

  const newCampaignButton = (
    <button type="button" className="btn-primary data-update-campaign-action--new" data-cuelume-open="" onClick={() => setImportOpen(true)} disabled={!online}>
      <FilePlus2 aria-hidden="true" />
      <span className="data-update-campaign-action__label">{t("Nueva campaña")}</span>
    </button>
  );

  if (!canAccess) {
    return (
      <main className="data-update-page container" aria-labelledby="data-update-title">
        <header className="page-header data-update-page__header">
          <div className="page-header__content">
            <PageHeading id="data-update-title" className="app-page-title">{t("Actualización de datos")}</PageHeading>
            <p>{t("No tienes acceso a este módulo.")}</p>
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

  if (progressOpen && isAdmin && detail) {
    return (
      <DataUpdateProgressPage
        detail={detail}
        profiles={profiles}
        currentUserId={user?.id ?? ""}
        onBack={() => setProgressOpen(false)}
      />
    );
  }

  return (
    <main className="data-update-page container" aria-labelledby="data-update-title">
      <PageHeading id="data-update-title" className="app-page-title">{t("Actualización de datos")}</PageHeading>
      {detail && activeSearchCount > 0 && showHeaderSearch && (
        <PageHeaderAccessory>
          <search aria-label={activeSearchLabel}>
            <div className="data-update-search--header">
              {searchControl}
            </div>
          </search>
        </PageHeaderAccessory>
      )}
      {isAdmin && campaigns.length === 0 && (
        <header className="page-header data-update-page__header">
          <div className="page-header__actions">
            {newCampaignButton}
          </div>
        </header>
      )}

      {!online && <p className="data-update-offline" role="alert">{t("Este módulo necesita conexión. Reconéctate para consultar o guardar información.")}</p>}
      {error && <p className="form-error" role="alert">{t(error)}</p>}

      {campaigns.length > 0 && (
        <div className="data-update-overview">
          <section className="data-update-campaign-toolbar" aria-label={t("Campaña activa")}>
            <div className="form-group">
              <label htmlFor="data-update-campaign">{t("Campaña")}</label>
              <CustomSelect
                id="data-update-campaign"
                value={selectedCampaignId}
                className="data-update-campaign-select"
                options={campaigns.map((campaign) => ({ value: campaign.id, label: campaignOptionLabel(campaign) }))}
                onChange={(campaignId) => {
                  setProgressOpen(false);
                  setSelectedCampaignId(campaignId);
                  changeSearchTerm("");
                  recordPagination.goToPage(1);
                  completedPagination.goToPage(1);
                }}
                showPlaceholderOption={false}
                disabled={loading || busy}
              />
            </div>
            {isAdmin && (
            <div className={`data-update-campaign-actions${isAdmin ? ' data-update-campaign-actions--admin' : ''}`}>
              {isAdmin && newCampaignButton}
              {isAdmin && activeView === "admin" && detail && (
                <button
                  type="button"
                  className="btn-secondary data-update-campaign-action--export"
                  onClick={() => void exportCampaign()}
                  disabled={busy || detail.records.length === 0}
                  aria-label={t("Exportar campaña a Excel")}
                  title={t("Exportar campaña a Excel")}
                >
                  <FileSpreadsheet aria-hidden="true" />
                  <span className="data-update-campaign-action__label">{t("Excel")}</span>
                </button>
              )}
              {isAdmin && (
                <button
                  ref={progressTriggerRef}
                  type="button"
                  className="btn-danger data-update-campaign-action--delete"
                  onClick={() => {
                    setDeleteError(null);
                    setCampaignPendingDelete(selectedCampaign);
                  }}
                  disabled={!online || loading || busy || !selectedCampaign}
                  aria-label={selectedCampaign
                    ? t("Eliminar")
                    : t("Eliminar")}
                >
                  <Trash2 aria-hidden="true" />
                  <span className="data-update-campaign-action__label">{t("Eliminar")}</span>
                </button>
              )}
              {isAdmin && !loading && detail && (
                <button
                  type="button"
                  className="btn-secondary data-update-progress-trigger"
                  data-cuelume-open="" onClick={() => setProgressOpen(true)}
                  aria-label={t("Ver avance")}
                >
                  <ChartNoAxesCombined aria-hidden="true" />
                  <span className="data-update-campaign-action__label">{t("Ver avance")}</span>
                </button>
              )}
            </div>
            )}
          </section>

          {!isAdmin && !loading && detail && (
            <section className="card data-update-summary-card" aria-label={t("Resumen de campaña")}>
              <dl className="data-update-summary">
                <div><dt>{t("Mis asignados")}</dt><dd>{myRecords.length}</dd></div>
                <div><dt>{t("Completados")}</dt><dd>{myCompletedCount}</dd></div>
                <div><dt>{t("Total visible")}</dt><dd>{totalVisibleCount}</dd></div>
              </dl>
            </section>
          )}
        </div>
      )}

      {loading ? (
        <div
          className="data-update-loading"
          role="status"
          aria-label={t("Cargando actualización de datos…")}
          aria-busy="true"
        >
          <span className="data-update-loading__bone data-update-loading__bone--title" aria-hidden="true" />
          <span className="data-update-loading__bone data-update-loading__bone--field" aria-hidden="true" />
          <span className="data-update-loading__bone data-update-loading__bone--content" aria-hidden="true" />
        </div>
      ) : campaigns.length === 0 ? (
        <section className="card data-update-empty" aria-labelledby="data-update-empty-title">
          <UserRoundCheck aria-hidden="true" />
          <h2 id="data-update-empty-title">{t("Sin campañas disponibles")}</h2>
          <p className="text-muted">{isAdmin ? t("Crea una campaña, importa la información") : t("Aún no tienes colaboradores asignados.")}</p>
        </section>
      ) : detail ? (
        <>
          {activeSearchCount > 0 && !showHeaderSearch && (
            <search className="data-update-search--mobile" aria-label={activeSearchLabel}>
              {searchControl}
            </search>
          )}
          <TabsRoot className="data-update-tabs" value={activeView} onValueChange={setActiveView}>
            <TabsList variant="underline" aria-label={t("Vistas de actualización de datos")}>
              <TabsTrigger className="data-update-tabs__trigger" data-cuelume-select="" value="work">
                {t("Mi trabajo")}
              </TabsTrigger>
              <TabsTrigger className="data-update-tabs__trigger" value="locker">
                {t("Locker")}
              </TabsTrigger>
              <TabsTrigger className="data-update-tabs__trigger" value="completed">
                {t("Completados")}
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger className="data-update-tabs__trigger" value="admin">
                  {t("Administración")}
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent className="data-update-tabs__content" value="work">
              <section className="data-update-queue" aria-labelledby="data-update-queue-title">
                <h2 id="data-update-queue-title" className="sr-only">{t("Mi trabajo")}</h2>
                {myRecords.length === 0 ? (
                  <p className="data-update-message">{t("No tienes registros asignados en esta campaña.")}</p>
                ) : visibleMyRecords.length === 0 ? (
                  <div id="data-update-record-list" className="data-update-search-empty" role="status">
                    <p>{t(`No hay coincidencias para “${searchTerm.trim()}”.`)}</p>
                  </div>
                ) : (
                  <>
                    <div id="data-update-record-list" className="data-update-results-panel">
                      <DataUpdateWorkResults
                        groups={pageWorkGroups}
                        online={online}
                        busy={busy}
                        onOpenRecord={(record) => void openRecord(record)}
                      />
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
                        ariaLabel={t("Paginación de registros asignados")}
                      />
                    )}
                  </>
                )}
              </section>
            </TabsContent>

            <TabsContent className="data-update-tabs__content" value="locker">
              <DataUpdateLockerPanel
                records={detail.records}
                searchTerm={searchTerm}
                onSearchChange={changeSearchTerm}
                canEdit={canAccess}
                onRecordUpdated={updateDetailRecord}
              />
            </TabsContent>

            <TabsContent className="data-update-tabs__content" value="completed">
              <section className="data-update-queue" aria-labelledby="data-update-completed-title">
                <h2 id="data-update-completed-title" className="sr-only">{t("Completados")}</h2>
                {completedRecords.length === 0 ? (
                  <p className="data-update-message">{t("Aún no hay registros completados en esta campaña.")}</p>
                ) : (
                  <>
                    {visibleCompletedRecords.length === 0 ? (
                      <div id="data-update-completed-list" className="data-update-search-empty" role="status">
                        <p>{t(`No hay coincidencias para “${searchTerm.trim()}”.`)}</p>
                        <button type="button" className="btn-secondary" onClick={() => changeSearchTerm("")}>
                          {t("Limpiar búsqueda")}
                        </button>
                      </div>
                    ) : (
                      <>
                        <div id="data-update-completed-list" className="data-update-results-panel">
                          <DataUpdateCompletedResults records={completedPagination.pageItems} />
                        </div>
                        {completedPagination.totalPages > 1 && (
                          <Pagination
                            currentPage={completedPagination.currentPage}
                            totalPages={completedPagination.totalPages}
                            onPageChange={completedPagination.goToPage}
                            onPrev={completedPagination.prevPage}
                            onNext={completedPagination.nextPage}
                            canGoPrev={completedPagination.canGoPrev}
                            canGoNext={completedPagination.canGoNext}
                            ariaLabel={t("Paginación de registros completados")}
                          />
                        )}
                      </>
                    )}
                  </>
                )}
              </section>
            </TabsContent>

            {isAdmin && (
              <TabsContent className="data-update-tabs__content" value="admin">
                <DataUpdateAdminPanel
                  detail={detail}
                  profiles={profiles}
                  searchTerm={searchTerm}
                  onSearchChange={changeSearchTerm}
                  busy={busy}
                  onBusyChange={setBusy}
                  onOpenRecord={(record) => void openRecord(record)}
                  onRecordUpdated={updateDetailRecord}
                  onRecordDeleted={removeDetailRecord}
                />
              </TabsContent>
            )}
          </TabsRoot>
        </>
      ) : null}

      {isAdmin && profile && (
        <CampaignImportModal
          isOpen={importOpen}
          profiles={profiles.filter(profile => profile.active)}
          currentUserId={profile.id}
          onClose={() => setImportOpen(false)}
          onCreated={(campaignId) => {
            setImportOpen(false);
            toast.success({ title: t("Campaña creada y repartida") });
            void loadCampaigns(campaignId);
          }}
        />
      )}

      {isAdmin && (
        <ConfirmModal
          isOpen={campaignPendingDelete !== null}
          title={t("Eliminar")}
          description={campaignPendingDelete
            ? t("Esta acción no se puede deshacer.")
            : undefined}
          confirmLabel={t("Eliminar")}
          cancelLabel={t("Cancelar")}
          onConfirm={() => void confirmCampaignDeletion()}
          onCancel={() => {
            if (deleting) return;
            setCampaignPendingDelete(null);
            setDeleteError(null);
          }}
          isDestructive
          isLoading={deleting}
          loadingLabel={t("Eliminar campaña…")}
          errorMessage={deleteError ? t(deleteError) : undefined}
        />
      )}
    </main>
  );
}

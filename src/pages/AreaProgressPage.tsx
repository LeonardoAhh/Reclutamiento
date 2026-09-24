import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { toNaturalCase } from "@/lib/utils";
import "./AreaProgressPage.css";

interface AreaPendingItem {
  id: string;
  titulo: string;
  estatus: string | null;
  progreso: number | null;
}

interface AreaProgressData {
  area: string;
  pendientes: AreaPendingItem[];
}

type LoadState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; data: AreaProgressData };

function isPendingItem(value: unknown): value is AreaPendingItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" && item.id.trim().length > 0
    && typeof item.titulo === "string" && item.titulo.trim().length > 0
    && (item.estatus === null || typeof item.estatus === "string" && item.estatus.trim().length > 0)
    && (item.progreso === null || typeof item.progreso === "number"
      && Number.isInteger(item.progreso) && item.progreso >= 0 && item.progreso <= 100);
}

function isAreaProgressData(value: unknown): value is AreaProgressData {
  if (typeof value !== "object" || value === null) return false;
  const data = value as Record<string, unknown>;
  if (typeof data.area !== "string" || !data.area.trim()
    || !Array.isArray(data.pendientes) || !data.pendientes.every(isPendingItem)) return false;
  const ids = data.pendientes.map((item: AreaPendingItem) => item.id);
  return new Set(ids).size === ids.length;
}

function displayPendingTitle(item: AreaPendingItem, isCoverage: boolean): string {
  const title = isCoverage
    ? item.titulo.replace(/^Cobertura de vacantes? (?:en|de|para el área de)\s+/i, "")
    : item.titulo;
  return toNaturalCase(title);
}

export function AreaProgressPage() {
  const [loadState, setLoadState] = useState<LoadState>({ kind: "loading" });
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    import("@/data/pendientes-reclutamiento.json")
      .then(({ default: importedData }) => {
        const data: unknown = importedData;
        if (!isAreaProgressData(data)) throw new Error("El archivo de pendientes no tiene un formato válido.");
        if (!cancelled) setLoadState({ kind: "ready", data });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          console.error("Error al cargar los pendientes:", error);
          setLoadState({ kind: "error" });
        }
      });
    return () => { cancelled = true; };
  }, [retryKey]);

  const sections = loadState.kind === "ready" ? [
    {
      id: "cobertura",
      title: "Cobertura de vacantes",
      items: loadState.data.pendientes.filter((item) => item.id.startsWith("cobertura-")),
      isCoverage: true,
    },
    {
      id: "otros",
      title: "Otros pendientes",
      items: loadState.data.pendientes.filter((item) => !item.id.startsWith("cobertura-")),
      isCoverage: false,
    },
  ] : [];

  return (
    <main className="area-progress-page container" aria-labelledby="area-progress-title">
      <header className="area-progress-page__header">
        <h1 id="area-progress-title" className="app-page-title">Pendientes Reclutamiento</h1>
        <p>Seguimiento de los pendientes del departamento de Reclutamiento</p>
      </header>

      {loadState.kind === "loading" && <p role="status">Cargando pendientes…</p>}
      {loadState.kind === "error" && (
        <div className="area-progress-page__feedback" role="alert">
          <p>No fue posible cargar los pendientes. Revisa el archivo e inténtalo de nuevo.</p>
          <button type="button" className="btn-secondary" onClick={() => {
            setLoadState({ kind: "loading" });
            setRetryKey((current) => current + 1);
          }}>Reintentar</button>
        </div>
      )}
      {loadState.kind === "ready" && (
        loadState.data.pendientes.length === 0 ? (
          <p className="area-progress-page__feedback">No hay pendientes registrados.</p>
        ) : (
          sections.filter((section) => section.items.length > 0).map((section) => (
            <section key={section.id} className="area-progress-page__section" aria-labelledby={`area-progress-${section.id}`}>
              <h2 id={`area-progress-${section.id}`} className="area-progress-page__section-title type-heading-md">{section.title}</h2>
              <ul className="area-progress-page__list">
                {section.items.map((item) => (
                  <li key={item.id} className="area-progress-page__card">
                    <h3>{displayPendingTitle(item, section.isCoverage)}</h3>
                    <dl className="area-progress-page__details">
                      <div>
                        <dt>Estado</dt>
                        <dd>{toNaturalCase(item.estatus ?? "Sin avance")}</dd>
                      </div>
                      <div>
                        <dt>Avance</dt>
                        <dd>
                          {item.progreso === null ? toNaturalCase("Sin avance") : (
                            <Badge
                              variant={item.progreso === 100 ? "success" : "default"}
                              className="area-progress-page__badge"
                              data-progress-state={item.progreso === 0 ? "not-started" : item.progreso === 100 ? "complete" : "in-progress"}
                            >
                              {item.progreso} %
                            </Badge>
                          )}
                        </dd>
                      </div>
                    </dl>
                    <div className="area-progress-page__progress">
                      {item.progreso === null ? (
                        <div className="area-progress-page__progress-track" aria-hidden="true" />
                      ) : (
                        <progress value={item.progreso} max={100} aria-label={`Avance de ${item.titulo}: ${item.progreso} %`} />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )
      )}
    </main>
  );
}

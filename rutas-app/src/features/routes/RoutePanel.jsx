import Brandbar from '../../components/Brandbar';
import RouteTable from './RouteTable';
import StopList from './StopList';
import RouteExport from './RouteExport';
import PanelSkeleton from './PanelSkeleton';
import useDelayedLoading from '../../hooks/useDelayedLoading';

export default function RoutePanel({ ruta, targetStopNo }) {
  const loading = useDelayedLoading(ruta.id, 350);

  return (
    <article
      id={`panel-${ruta.id}`}
      role="tabpanel"
      aria-labelledby={`tab-${ruta.id}`}
      className="animate-fade-in-up rounded-xl border border-hairline bg-surface p-5 shadow-soft sm:p-8 lg:p-10"
      data-testid="route-panel"
    >
      <Brandbar />

      <div className="flex flex-col gap-3 border-b border-hairline pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            className="text-heading-md font-bold tracking-tight text-ink"
            data-testid="route-name"
          >
            {ruta.nombre}
          </h2>
          <p className="mt-0.5 text-caption-md text-mute" data-testid="route-meta">
            {ruta.paradas.length} paradas · {ruta.turnos.length} turnos
          </p>
        </div>
        <RouteExport ruta={ruta} />
      </div>

      {loading ? (
        <PanelSkeleton rows={Math.min(ruta.paradas.length, 8)} />
      ) : (
        <>
          {/* Desktop / tablet: full schedule table */}
          <div className="hidden md:block">
            <RouteTable ruta={ruta} paradas={ruta.paradas} targetStopNo={targetStopNo} />
          </div>

          {/* Mobile: condensed colonia list -> tap opens detail sheet */}
          <div className="md:hidden">
            <StopList ruta={ruta} paradas={ruta.paradas} targetStopNo={targetStopNo} />
          </div>
        </>
      )}
    </article>
  );
}

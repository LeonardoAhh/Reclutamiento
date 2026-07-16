import { useEffect, useState } from 'react';
import { WifiOff, ArrowLeft, FileSpreadsheet } from 'lucide-react';
import { rutas } from './data/rutas';
import { downloadRutasExcel } from './lib/excelExport';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import RouteSidebar from './features/routes/RouteSidebar';
import RouteTabs from './features/routes/RouteTabs';
import RoutePanel from './features/routes/RoutePanel';
import GlobalSearch from './features/routes/GlobalSearch';

function App() {
  const rutasOrdenadas = [...rutas].sort((a, b) =>
    a.id.localeCompare(b.id, undefined, { numeric: true })
  );
  const [rutaActivaId, setRutaActivaId] = useState(
    () => localStorage.getItem('rutaActiva') || rutasOrdenadas[0].id
  );
  const [query, setQuery] = useState('');
  const [targetStopNo, setTargetStopNo] = useState(null);
  const ruta = rutas.find((r) => r.id === rutaActivaId) ?? rutasOrdenadas[0];

  useEffect(() => {
    document.title = `${ruta.id} · Horarios de Transporte — VIÑOPLASTIC`;
  }, [ruta.id]);

  // Brief initial skeleton for the route menu.
  const [menuLoading, setMenuLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setMenuLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  // PWA: offline status
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  const selectRoute = (id) => {
    setRutaActivaId(id);
    localStorage.setItem('rutaActiva', id);
    setTargetStopNo(null);
  };

  const selectSearchResult = (routeId, stopNo) => {
    setRutaActivaId(routeId);
    localStorage.setItem('rutaActiva', routeId);
    setTargetStopNo(stopNo);
    setQuery('');
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <h1 className="sr-only">Horarios de transporte Viño Plastic / UTEP</h1>

      <RouteSidebar
        rutas={rutasOrdenadas}
        rutaActivaId={rutaActivaId}
        onSeleccionar={selectRoute}
        loading={menuLoading}
      />

      <SidebarInset>
        {/* Top bar with global search */}
        <header className="sticky top-0 z-30 flex min-h-14 pt-[env(safe-area-inset-top)] items-center gap-3 border-b border-hairline bg-canvas/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-canvas/80 sm:px-6">
          <a href="/" className="md:hidden flex items-center justify-center size-8 rounded-md hover:bg-surface-card transition-colors" aria-label="Regresar">
            <ArrowLeft size={18} />
          </a>
          <span className="text-body-strong font-bold text-ink flex-1">
            Horarios de Transporte
          </span>
          <Button variant="outline" size="sm" onClick={downloadRutasExcel} className="hidden sm:flex" aria-label="Descargar Excel">
            <FileSpreadsheet className="size-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" size="icon" onClick={downloadRutasExcel} className="sm:hidden" aria-label="Descargar Excel">
            <FileSpreadsheet className="size-4" />
          </Button>
        </header>

        {!online && (
          <div
            className="flex items-center justify-center gap-2 bg-secondary px-4 py-1.5 text-caption-md font-medium text-on-dark"
            data-testid="offline-banner"
            role="status"
          >
            <WifiOff className="size-4" />
            Sin conexión — mostrando horarios guardados
          </div>
        )}

        {/* Mobile route picker keeps the fast tabs */}
          <div className="px-4 md:hidden">
            <RouteTabs
              rutas={rutasOrdenadas}
              rutaActivaId={rutaActivaId}
              onSeleccionar={selectRoute}
            />
          </div>

        <div className="w-full px-2 py-8 sm:px-6 lg:px-10 lg:py-12">
            <RoutePanel key={ruta.id} ruta={ruta} targetStopNo={targetStopNo} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default App;

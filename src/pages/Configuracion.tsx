import { useState, type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  BarChart2,
  Bus,
  ChevronLeft,
  ClipboardCheck,
  FileText,
  Search,
  Sparkles,
  Wallet,
  UserX,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { BusquedaView } from './configuracion-views/BusquedaView';
import { DocumentosView } from './configuracion-views/DocumentosView';
import { IndicadoresView } from './configuracion-views/IndicadoresView';
import { RutasView } from './configuracion-views/RutasView';
import { TabuladorView } from './configuracion-views/TabuladorView';
import { ToulouseView } from './configuracion-views/ToulouseView';
import { RegistroNoCitadosView } from './configuracion-views/RegistroNoCitadosView';
import { SistemaView } from './configuracion-views/SistemaView';
import './Configuracion.css';

type FeatureId = 'busqueda' | 'documentos' | 'indicadores' | 'rutas' | 'tabulador' | 'toulouse' | 'nocitados' | 'sistema';

interface FeatureItem {
  id: FeatureId;
  label: string;
  icon: LucideIcon;
}

const FEATURES: FeatureItem[] = [
  { id: 'busqueda', label: 'Búsqueda', icon: Search },
  { id: 'documentos', label: 'Documentos', icon: FileText },
  { id: 'indicadores', label: 'Indicadores', icon: BarChart2 },
  { id: 'rutas', label: 'Rutas', icon: Bus },
  { id: 'tabulador', label: 'Tabulador', icon: Wallet },
  { id: 'toulouse', label: 'Toulouse', icon: ClipboardCheck },
  { id: 'nocitados', label: 'No Citados', icon: UserX },
  { id: 'sistema', label: 'Sistema', icon: Settings },
];

const FEATURE_VIEWS: Record<FeatureId, ReactNode> = {
  busqueda: <BusquedaView />,
  documentos: <DocumentosView />,
  indicadores: <IndicadoresView />,
  rutas: <RutasView />,
  tabulador: <TabuladorView />,
  toulouse: <ToulouseView />,
  nocitados: <RegistroNoCitadosView />,
  sistema: <SistemaView />,
};

export function Configuracion() {
  const { loading } = useAuth();
  const reduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<FeatureId>('busqueda');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(true);

  if (loading) {
    return (
      <div className="config-layout">
        <main className="config-main config-main--loading" aria-busy="true">
          <span className="type-body-md text-muted" role="status">Cargando features…</span>
        </main>
      </div>
    );
  }

  const handleTabClick = (tab: FeatureId) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="config-layout">
      <aside
        className={`config-sidebar ${!isMobileMenuOpen ? 'mobile-hidden' : ''}`}
        aria-labelledby="features-navigation-title"
      >
        <header className="config-sidebar__header">
          <Sparkles size={24} aria-hidden="true" className="text-primary" />
          <h1 id="features-navigation-title" className="type-heading-sm m-0">Features</h1>
        </header>
        <nav className="config-sidebar__nav" aria-label="Subpáginas de features">
          {FEATURES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`config-sidebar__link ${activeTab === id ? 'active' : ''}`}
              onClick={() => handleTabClick(id)}
              aria-current={activeTab === id ? 'page' : undefined}
              aria-controls="feature-content"
            >
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main
        id="feature-content"
        className={`config-main ${isMobileMenuOpen ? 'mobile-hidden' : ''}`}
        aria-label={`Feature: ${FEATURES.find(({ id }) => id === activeTab)?.label}`}
        tabIndex={-1}
      >
        <button
          type="button"
          className="config-mobile-back"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Volver al menú de features"
        >
          <ChevronLeft size={20} aria-hidden="true" />
          <span>Volver</span>
        </button>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            className="config-view-transition"
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
          >
            {FEATURE_VIEWS[activeTab]}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

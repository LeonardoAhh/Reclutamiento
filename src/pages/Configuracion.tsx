import { useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { isBoneyardBuild } from "@/lib/boneyard";
import {
  BadgeDollarSign,
  ChartNoAxesCombined,
  ChevronLeft,
  Files,
  MessagesSquare,
  Route,
  ScanSearch,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BusquedaView } from "./configuracion-views/BusquedaView";
import { IndicadoresView } from "./configuracion-views/IndicadoresView";
import { RutasView } from "./configuracion-views/RutasView";
import { TabuladorView } from "./configuracion-views/TabuladorView";
import { SpeechView } from "./configuracion-views/SpeechView";
import { FormatosView } from "./configuracion-views/FormatosView";
import "./Configuracion.css";

type FeatureId =
  | "busqueda"
  | "indicadores"
  | "rutas"
  | "tabulador"
  | "speech"
  | "formatos";

interface FeatureItem {
  id: FeatureId;
  label: string;
  icon: LucideIcon;
}

export type FeatureGroup = {
  title?: string;
  items: FeatureItem[];
};

export const FEATURE_GROUPS: FeatureGroup[] = [
  {
    title: "Principal",
    items: [
      { id: "busqueda", label: "Búsqueda", icon: ScanSearch },
      { id: "formatos", label: "Formatos", icon: Files },
      { id: "rutas", label: "Rutas", icon: Route },
      { id: "speech", label: "Speech WA", icon: MessagesSquare },
    ],
  },
  {
    title: "Administración",
    items: [
      { id: "indicadores", label: "Indicadores", icon: ChartNoAxesCombined },
      { id: "tabulador", label: "Tabulador", icon: BadgeDollarSign },
    ],
  }
];

export const FEATURES: FeatureItem[] = FEATURE_GROUPS.flatMap(group => group.items);

const FEATURE_VIEWS: Record<FeatureId, ReactNode> = {
  busqueda: <BusquedaView />,
  indicadores: <IndicadoresView />,
  rutas: <RutasView />,
  tabulador: <TabuladorView />,
  speech: <SpeechView />,
  formatos: <FormatosView />,
};

export function Configuracion() {
  const reduceMotion = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as FeatureId | null;
  const activeTab =
    tabParam && FEATURES.some((f) => f.id === tabParam) ? tabParam : "busqueda";

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(
    () => !isBoneyardBuild(),
  );

  const handleTabClick = (tab: FeatureId) => {
    setSearchParams({ tab });
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="config-layout">
      <aside
        className={`config-sidebar ${!isMobileMenuOpen ? "mobile-hidden" : ""}`}
        aria-label="Configuración"
      >
        <nav
          className="config-sidebar__nav"
          aria-label="Subpáginas de features"
          role="tablist"
        >
          {FEATURE_GROUPS.map((group, idx) => (
            <div key={idx} className="config-sidebar__group" role="presentation" aria-label={group.title || "Principal"}>
              {group.title && (
                <div className="config-sidebar__group-title">{group.title}</div>
              )}
              {group.items.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  id={`tab-${id}`}
                  type="button"
                  role="tab"
                  className={`config-sidebar__link ${activeTab === id ? "active" : ""}`}
                  onClick={() => handleTabClick(id)}
                  aria-selected={activeTab === id}
                  aria-controls="feature-content"
                >
                  <Icon size={18} aria-hidden="true" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <main
        id="feature-content"
        role="tabpanel"
        className={`config-main ${isMobileMenuOpen ? "mobile-hidden" : ""}`}
        aria-label={`Feature: ${FEATURES.find(({ id }) => id === activeTab)?.label}`}
        aria-labelledby={`tab-${activeTab}`}
        tabIndex={-1}
      >
        <button
          type="button"
          className="btn-text config-mobile-back"
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

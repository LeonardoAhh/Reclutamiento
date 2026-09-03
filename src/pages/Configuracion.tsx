import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { FEATURES, getConfiguracionTab, type FeatureId } from "@/lib/configuracionNavigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BusquedaView } from "./configuracion-views/BusquedaView";
import { IndicadoresView } from "./configuracion-views/IndicadoresView";
import { RutasView } from "./configuracion-views/RutasView";
import { TabuladorView } from "./configuracion-views/TabuladorView";
import { SpeechView } from "./configuracion-views/SpeechView";
import { FormatosView } from "./configuracion-views/FormatosView";
import {
  SupabaseDataProvider,
  type SupabaseDataResource,
} from "@/hooks/useSupabaseData";
import "./Configuracion.css";

export { FEATURES, FEATURE_GROUPS, type FeatureGroup } from "@/lib/configuracionNavigation";

const EMPLOYEE_DATA: readonly SupabaseDataResource[] = ["employees"];
const SPEECH_DATA: readonly SupabaseDataResource[] = ["speechTemplates"];

const FEATURE_VIEWS: Record<FeatureId, ReactNode> = {
  busqueda: (
    <SupabaseDataProvider resources={EMPLOYEE_DATA}>
      <BusquedaView />
    </SupabaseDataProvider>
  ),
  indicadores: <IndicadoresView />,
  rutas: <RutasView />,
  tabulador: <TabuladorView />,
  speech: (
    <SupabaseDataProvider resources={SPEECH_DATA}>
      <SpeechView />
    </SupabaseDataProvider>
  ),
  formatos: (
    <SupabaseDataProvider resources={EMPLOYEE_DATA}>
      <FormatosView />
    </SupabaseDataProvider>
  ),
};

export function Configuracion() {
  const reduceMotion = useReducedMotion();
  const location = useLocation();
  const activeTab = getConfiguracionTab(location.pathname);

  return (
    <div className="config-layout">
      <main
        id="feature-content"
        className="config-main container"
        aria-label={`Configuración: ${FEATURES.find(({ id }) => id === activeTab)?.label}`}
        tabIndex={-1}
      >
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

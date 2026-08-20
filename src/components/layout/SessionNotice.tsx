import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import "./SessionNotice.css";

export function SessionNotice() {
  const { profile } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [taskCount, setTaskCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile) return;

    // 1. Carga inicial (solo 1 vez por sesión)
    if (!sessionStorage.getItem("notified_activities")) {
      const checkTasks = async () => {
        let query = supabase
          .from("activities")
          .select("id", { count: "exact", head: true })
          .eq("estado", "pendiente");

        // Solo notificar si se crearon actividades DESPUÉS de la última vez que revisó
        const lastVisit = localStorage.getItem("last_activities_visit");
        if (lastVisit) {
          query = query.gt("created_at", lastVisit);
        }

        if (profile.role === "reclutador") {
          query = query.or(`asignado_a.eq.${profile.id},asignado_a.is.null`);
        }

        const { count } = await query;

        if (count && count > 0) {
          setTaskCount(count);
          setIsVisible(true);
        } else {
          sessionStorage.setItem("notified_activities", "true");
        }
      };

      checkTasks();
    }

    // 2. Soporte en tiempo real para nuevas asignaciones
    const channel = supabase
      .channel("realtime_activities_notice")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activities" },
        (payload) => {
          const newAct = payload.new as any;

          if (profile.role === "reclutador") {
            // Si la actividad no es para el reclutador ni es para todo el equipo, ignoramos
            if (
              newAct.asignado_a !== profile.id &&
              newAct.asignado_a !== null
            ) {
              return;
            }
          }

          if (newAct.estado === "pendiente") {
            setTaskCount((prev) => prev + 1);
            setIsVisible(true);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        sessionStorage.setItem("notified_activities", "true");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("notified_activities", "true");
  };

  const handleGo = () => {
    handleDismiss();
    navigate("/actividades");
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="session-notice-wrapper">
          <motion.div
            initial={{ y: -50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="session-notice"
            role="alert"
          >
            <Bell
              size={18}
              className="session-notice__icon"
              aria-hidden="true"
            />
            
            <div className="session-notice__content">
              <span>
                <strong>{taskCount}</strong>{" "}
                {taskCount === 1 ? "actividad pendiente" : "actividades pendientes"}
              </span>
              <button
                onClick={handleGo}
                className="btn-text session-notice__action"
              >
                Ir a página <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

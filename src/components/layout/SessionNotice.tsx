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
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="session-notice"
            role="alert"
          >
            <div className="session-notice__content">
              <Bell
                size={18}
                className="session-notice__icon"
                aria-hidden="true"
              />
              <span>
                Tienes{" "}
                <strong>
                  {taskCount}{" "}
                  {taskCount === 1
                    ? "actividad pendiente"
                    : "actividades pendientes"}
                </strong>{" "}
                por revisar.
              </span>
              <button
                onClick={handleGo}
                className="btn-text session-notice__action"
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                Ir <ArrowRight size={16} />
              </button>
            </div>
            <button
              onClick={handleDismiss}
              className="btn-ghost btn-icon session-notice__close"
              aria-label="Cerrar aviso"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

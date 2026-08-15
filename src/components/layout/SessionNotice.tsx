import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import './SessionNotice.css';

export function SessionNotice() {
  const { profile } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [taskCount, setTaskCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Solo mostramos esto 1 vez por sesión
    if (sessionStorage.getItem('notified_activities')) return;
    if (!profile) return;

    const checkTasks = async () => {
      let query = supabase
        .from('activities')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'pendiente');
      
      // Si es reclutador, filtramos por sus tareas asignadas (o las de todo el equipo)
      if (profile.role === 'reclutador') {
        query = query.or(`asignado_a.eq.${profile.id},asignado_a.is.null`);
      }

      const { count } = await query;
      
      if (count && count > 0) {
        setTaskCount(count);
        setIsVisible(true);
      } else {
        // Si no hay tareas, de todos modos marcamos para no consultar de nuevo
        sessionStorage.setItem('notified_activities', 'true');
      }
    };

    checkTasks();
  }, [profile]);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('notified_activities', 'true');
  };

  const handleGo = () => {
    handleDismiss();
    navigate('/actividades');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="session-notice-wrapper">
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="session-notice"
            role="alert"
          >
            <div className="session-notice__content">
              <Bell size={18} className="session-notice__icon" aria-hidden="true" />
              <span>
                Tienes <strong>{taskCount} {taskCount === 1 ? 'tarea pendiente' : 'tareas pendientes'}</strong> por revisar.
              </span>
              <button onClick={handleGo} className="btn-text session-notice__action">
                Ver actividades
              </button>
            </div>
            <button onClick={handleDismiss} className="btn-ghost btn-icon session-notice__close" aria-label="Cerrar aviso">
              <X size={16} aria-hidden="true" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

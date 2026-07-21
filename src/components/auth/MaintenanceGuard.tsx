import { ReactNode, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { TriangleAlert } from 'lucide-react';
import './MaintenanceGuard.css';

// ── Configuración ───────────────────────────────────────────────
const EXCLUDED_EMAIL = 'leonardo@reclutamiento.local';

// Tipo de configuración de mantenimiento
interface AppConfig {
  maintenance_mode: boolean;
}

const STATUS_MESSAGES = [
  "Falla crítica interceptada...",
  "Iniciando protocolos de contención...",
  "Purgando memoria del sistema...",
  "Intentando reconexión forzada...",
  "Sistema inestable, reiniciando servicios...",
];

/**
 * SQL Recomendado para crear la tabla en Supabase:
 *
 * CREATE TABLE public.config (
 *   id text PRIMARY KEY,
 *   maintenance_mode boolean NOT NULL DEFAULT false
 * );
 *
 * INSERT INTO public.config (id, maintenance_mode) VALUES ('main', false);
 *
 * -- Opcional: configurar RLS para que todos puedan leerla
 * ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Permitir lectura publica" ON public.config FOR SELECT USING (true);
 */

export function MaintenanceGuard({ children }: { children: ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [checking, setChecking] = useState(true);
  const [statusIndex, setStatusIndex] = useState(0);

  const checkMaintenance = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('config')
        .select('maintenance_mode')
        .eq('id', 'main')
        .single();

      if (error) {
        console.warn('No se pudo verificar el estado de mantenimiento:', error);
        setIsMaintenance(false);
      } else if (data) {
        setIsMaintenance((data as AppConfig).maintenance_mode);
      }
    } catch (err) {
      console.warn('Error fetching config:', err);
      setIsMaintenance(false);
    } finally {
      setChecking(false);
    }
  }, []);

  // Verificar si el usuario actual está excluido del mantenimiento
  const isExcluded = user?.email?.toLowerCase() === EXCLUDED_EMAIL;

  useEffect(() => {
    let mounted = true;

    async function init() {
      await checkMaintenance();
    }

    init();

    // Suscribirse a cambios en tiempo real
    const sub = supabase
      .channel('public:config')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'config', filter: "id=eq.main" },
        (payload) => {
          if (mounted) {
            setIsMaintenance(payload.new.maintenance_mode);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('Error en suscripción realtime de mantenimiento');
        }
      });

    return () => {
      mounted = false;
      supabase.removeChannel(sub);
    };
  }, [checkMaintenance]);

  useEffect(() => {
    if (!isMaintenance || isExcluded) return;
    if (statusIndex >= STATUS_MESSAGES.length - 1) return;

    const timer = setTimeout(() => {
      setStatusIndex(prev => prev + 1);
    }, 2800);

    return () => clearTimeout(timer);
  }, [isMaintenance, isExcluded, statusIndex]);

  if (loading || checking) {
    return null;
  }

  if (!isMaintenance || isExcluded) {
    return <>{children}</>;
  }

  // Variantes para la animación de la "cortina" (fondo)
  const curtainVariants: Variants = {
    hidden: { y: '-100%' },
    visible: {
      y: '0%',
      transition: {
        duration: 0.7,
        ease: [0.19, 1, 0.22, 1] // --ease-apple
      }
    },
    exit: {
      y: '100%',
      transition: {
        duration: 0.7,
        ease: [0.19, 1, 0.22, 1]
      }
    }
  };

  // Variantes para la animación de la tarjeta
  const cardVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8, y: 30 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        delay: 0.5,
        type: 'spring',
        stiffness: 100,
        damping: 15,
        mass: 1
      }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: -20,
      transition: { duration: 0.3 }
    }
  };

  return (
    <AnimatePresence>
      {isMaintenance && !isExcluded && (
        <motion.div
          variants={curtainVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="maintenance-overlay"
          role="alert"
          aria-live="polite"
          aria-label="Modo mantenimiento activo"
        >
          <motion.div
            variants={cardVariants}
            className="maintenance-card"
          >
            <div className="maintenance-icon-wrap failing-icon-wrap" aria-hidden="true">
              <TriangleAlert className="maintenance-icon" size={32} />
            </div>

            <div className="maintenance-content">
              <div className="maintenance-text-wrapper">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={statusIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="type-body-md maintenance-text glitch-text"
                  >
                    {STATUS_MESSAGES[statusIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            <button
              onClick={signOut}
              className="btn-secondary maintenance-button glitch-text"
              type="button"
            >
              Cerrar sesión
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

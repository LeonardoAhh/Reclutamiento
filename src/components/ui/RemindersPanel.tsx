import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Bell, BellRing, Clock, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCandidates } from '@/hooks/useCandidates';
import { CandidateStatusBadge } from '@/components/ui/CandidateStatusBadge';
import { localTodayIso, addDaysToIso, formatReadableDate } from '@/lib/dates';
import { CandidateModal } from './CandidateModal';
import { EASE_OUT } from '@/lib/motion';
import type { Candidate } from '@/lib/types';
import './RemindersPanel.css';

function formatReminderDate(fecha: string | null | undefined) {
  if (!fecha) return '';
  const today = localTodayIso();
  const yesterday = addDaysToIso(today, -1);
  
  if (fecha === today) return 'Hoy';
  if (fecha === yesterday) return 'Ayer';
  
  return formatReadableDate(fecha).replace(/\s\d{4}$/, '');
}

export function RemindersPanel() {
  const { candidates, updateCandidate } = useCandidates();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const reminders = useMemo(() => {
    const today = localTodayIso();
    return candidates.filter(c => {
      // 1. Solo estados que requieran seguimiento
      const isActive = ['entrevista', 'entrega_documentos', 'faltan_documentos', 'feedback_pendiente'].includes(c.status);
      if (!isActive) return false;
      
      // 2. Que tenga fecha_cita y que sea <= hoy (es decir, ya pasó o es hoy)
      if (!c.fecha_cita) return false;
      
      return c.fecha_cita <= today;
    }).sort((a, b) => a.fecha_cita!.localeCompare(b.fecha_cita!));
  }, [candidates]);

  const handleUpdate = async (payload: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>, id?: string) => {
    if (!id) return { ok: false };
    return updateCandidate(id, payload);
  };

  return (
    <>
      <button 
        type="button" 
        className={`reminders-bell ${reminders.length > 0 ? 'has-reminders' : ''}`}
        onClick={() => setIsOpen(true)}
        aria-label="Ver recordatorios"
      >
        {reminders.length > 0 ? (
          <>
            <BellRing size={20} strokeWidth={2} />
            <span className="type-body-sm font-medium reminders-bell-text">Pendientes</span>
            <span className="reminders-badge">{reminders.length > 99 ? '99+' : reminders.length}</span>
          </>
        ) : (
          <>
            <Bell size={20} strokeWidth={2} />
            <span className="type-body-sm font-medium reminders-bell-text">Pendientes</span>
          </>
        )}
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div 
                className="reminders-overlay popover-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => setIsOpen(false)}
              />
              <motion.div 
                className="reminders-popover"
                role="dialog"
                aria-modal="true"
                aria-labelledby="reminders-title"
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                transition={{ ease: EASE_OUT, duration: 0.2 }}
              >
                <div className="reminders-header">
                  <h2 id="reminders-title">Pendientes</h2>
                </div>

                <div className="reminders-content">
                  {reminders.length === 0 ? (
                    <div className="reminders-empty" role="status">
                      <CheckCircle2 size={32} />
                      <p>Sin pendientes</p>
                    </div>
                  ) : (
                    <div className="reminders-list">
                      {reminders.map(c => (
                        <button 
                          key={c.id} 
                          className="reminder-compact-item" 
                          onClick={() => setSelectedCandidate(c)}
                        >
                          <div className="reminder-compact-main">
                            <span className="type-body-sm font-medium truncate" title={c.nombre}>{c.nombre}</span>
                          </div>
                          <div className="reminder-compact-sub">
                            <span className="type-caption-sm text-muted truncate" title={`${c.reclutador || 'General'} • ${c.fecha_cita}`}>
                              {c.reclutador ? c.reclutador.split(' ')[0] : 'General'}
                              <span className="text-faint" style={{ margin: '0 4px' }}>•</span>
                              <span className="text-faint">
                                {formatReminderDate(c.fecha_cita)}
                              </span>
                            </span>
                            <CandidateStatusBadge status={c.status} compact />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {selectedCandidate && (
        <CandidateModal
          isOpen={true}
          mode="edit"
          candidate={selectedCandidate}
          candidates={candidates}
          onClose={() => setSelectedCandidate(null)}
          onSave={handleUpdate}
        />
      )}
    </>
  );
}

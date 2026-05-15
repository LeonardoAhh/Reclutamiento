import { useEffect, useMemo, useState } from 'react';
import { AlertOctagon, Download, Loader2, CheckCircle2 } from 'lucide-react';
import { Modal } from './Modal';
import type { Employee } from '@/lib/types';
import { formatMxStamp } from '@/lib/dates';
import './PurgeEmployeesModal.css';

interface PurgeEmployeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  /** Devuelve true si el borrado en Supabase tuvo éxito. */
  onConfirm: () => Promise<{ ok: boolean; count: number; message?: string }>;
}

const CONFIRM_WORD = 'BORRAR';

/**
 * Modal de "zona peligrosa" para vaciar la tabla `empleados`. Forza tres
 * pasos en orden:
 *   1. Descargar respaldo JSON con la plantilla actual.
 *   2. Escribir literalmente la palabra `BORRAR` (case-sensitive).
 *   3. Click final en el botón rojo de confirmación.
 *
 * Los pasos se bloquean entre sí: no se puede teclear `BORRAR` antes de
 * descargar el respaldo, ni confirmar antes de teclearlo.
 */
export function PurgeEmployeesModal({
  isOpen,
  onClose,
  employees,
  onConfirm,
}: PurgeEmployeesModalProps) {
  const [backupDownloaded, setBackupDownloaded] = useState(false);
  const [typedWord, setTypedWord] = useState('');
  const [isPurging, setIsPurging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ count: number } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setBackupDownloaded(false);
      setTypedWord('');
      setIsPurging(false);
      setErrorMessage(null);
      setSuccess(null);
    }
  }, [isOpen]);

  const total = employees.length;
  const wordMatches = typedWord === CONFIRM_WORD;
  const canConfirm = backupDownloaded && wordMatches && !isPurging && !success;

  const backupFileName = useMemo(
    () => `empleados-backup-${formatMxStamp()}.json`,
    []
  );

  const handleDownloadBackup = () => {
    const payload = {
      exported_at: new Date().toISOString(),
      table: 'empleados',
      count: employees.length,
      rows: employees,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = backupFileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setBackupDownloaded(true);
  };

  const handleConfirmPurge = async () => {
    if (!canConfirm) return;
    setIsPurging(true);
    setErrorMessage(null);
    try {
      const result = await onConfirm();
      if (result.ok) {
        setSuccess({ count: result.count });
      } else {
        setErrorMessage(result.message ?? 'Fallo desconocido al borrar.');
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Fallo desconocido al borrar.'
      );
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isPurging ? () => undefined : onClose}
      className="purge-employees-modal"
      icon={<AlertOctagon size={20} aria-hidden="true" />}
      title="Borrar plantilla completa"
      subtitle="Esta acción es irreversible"
    >
      <div className="modal-body purge-employees-modal__body">
        {success ? (
          <section className="purge-employees-modal__success" role="status">
            <CheckCircle2
              size={36}
              aria-hidden="true"
              className="purge-employees-modal__success-icon"
            />
            <h3 className="purge-employees-modal__success-title">
              Plantilla borrada
            </h3>
            <p className="purge-employees-modal__success-msg">
              Se eliminaron <strong>{success.count}</strong> registros de la
              tabla <code>empleados</code>. El respaldo JSON ya está descargado
              en tu equipo.
            </p>
            <button
              type="button"
              className="btn-primary purge-employees-modal__close-btn"
              onClick={onClose}
            >
              Cerrar
            </button>
          </section>
        ) : (
          <>
            <header className="purge-employees-modal__warning">
              <AlertOctagon
                size={20}
                aria-hidden="true"
                className="purge-employees-modal__warning-icon"
              />
              <div>
                <p className="purge-employees-modal__warning-title">
                  Vas a eliminar <strong>{total}</strong>{' '}
                  {total === 1 ? 'empleado' : 'empleados'} de la base.
                </p>
                <p className="purge-employees-modal__warning-sub">
                  No se borran <code>bajas</code>, <code>vacancy_requests</code>{' '}
                  ni <code>comentarios</code>. Sólo la tabla{' '}
                  <code>empleados</code>. La acción no se puede deshacer.
                </p>
              </div>
            </header>

            <ol className="purge-employees-modal__steps">
              <li
                className={`purge-employees-modal__step ${
                  backupDownloaded ? 'is-done' : 'is-active'
                }`}
              >
                <div className="purge-employees-modal__step-head">
                  <span className="purge-employees-modal__step-num">1</span>
                  <span className="purge-employees-modal__step-title">
                    Descarga el respaldo JSON
                  </span>
                </div>
                <p className="purge-employees-modal__step-help">
                  Es tu única forma de recuperar los datos si te arrepientes.
                </p>
                <button
                  type="button"
                  className="btn-secondary purge-employees-modal__backup-btn"
                  onClick={handleDownloadBackup}
                  disabled={isPurging}
                >
                  <Download size={14} aria-hidden="true" />
                  {backupDownloaded
                    ? 'Volver a descargar respaldo'
                    : 'Descargar respaldo JSON'}
                </button>
                {backupDownloaded && (
                  <p className="purge-employees-modal__step-confirm">
                    <CheckCircle2 size={14} aria-hidden="true" /> Respaldo
                    descargado como <code>{backupFileName}</code>.
                  </p>
                )}
              </li>

              <li
                className={`purge-employees-modal__step ${
                  !backupDownloaded
                    ? 'is-locked'
                    : wordMatches
                    ? 'is-done'
                    : 'is-active'
                }`}
              >
                <div className="purge-employees-modal__step-head">
                  <span className="purge-employees-modal__step-num">2</span>
                  <span className="purge-employees-modal__step-title">
                    Escribe <code>{CONFIRM_WORD}</code> para desbloquear el
                    botón
                  </span>
                </div>
                <input
                  type="text"
                  className="purge-employees-modal__confirm-input"
                  placeholder={CONFIRM_WORD}
                  value={typedWord}
                  onChange={(e) => setTypedWord(e.target.value)}
                  disabled={!backupDownloaded || isPurging}
                  autoComplete="off"
                  spellCheck={false}
                  aria-label={`Escribe ${CONFIRM_WORD} para confirmar`}
                />
              </li>

              <li
                className={`purge-employees-modal__step ${
                  canConfirm ? 'is-active' : 'is-locked'
                }`}
              >
                <div className="purge-employees-modal__step-head">
                  <span className="purge-employees-modal__step-num">3</span>
                  <span className="purge-employees-modal__step-title">
                    Confirmar borrado
                  </span>
                </div>
                {errorMessage && (
                  <p
                    className="purge-employees-modal__error"
                    role="alert"
                    aria-live="polite"
                  >
                    {errorMessage}
                  </p>
                )}
                <div className="purge-employees-modal__actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={onClose}
                    disabled={isPurging}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="purge-employees-modal__danger-btn"
                    onClick={handleConfirmPurge}
                    disabled={!canConfirm}
                  >
                    {isPurging ? (
                      <>
                        <Loader2
                          size={14}
                          aria-hidden="true"
                          className="purge-employees-modal__spinner"
                        />
                        Borrando…
                      </>
                    ) : (
                      <>
                        <AlertOctagon size={14} aria-hidden="true" />
                        Borrar plantilla
                      </>
                    )}
                  </button>
                </div>
              </li>
            </ol>
          </>
        )}
      </div>
    </Modal>
  );
}

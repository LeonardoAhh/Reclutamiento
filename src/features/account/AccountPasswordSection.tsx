import { useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, KeyRound } from 'lucide-react';
import { useMotionTokens } from '@/hooks/useMotionTokens';
import type { AccountCopy } from '@/pages/account-translations';
import { PasswordChangeForm } from './PasswordChangeForm';

/** Cambio de contraseña en línea: la acción despliega el formulario dentro de la tarjeta. */
export function AccountPasswordSection({ copy }: { copy: AccountCopy }) {
  const id = useId();
  const panelId = `${id}-panel`;
  const [open, setOpen] = useState(false);
  const [focusReady, setFocusReady] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const motionTokens = useMotionTokens('--transition-base');

  const toggle = (
    <button
      ref={toggleRef}
      type="button"
      className="account-setting-row account-password__trigger"
      aria-expanded={open}
      aria-controls={panelId}
      disabled={open}
      onClick={() => { setFocusReady(false); setOpen(true); }}
    >
      <KeyRound size="var(--icon-size-sm)" aria-hidden="true" />
      <span className="account-setting-row__label">{copy.password}</span>
      <ChevronRight size="var(--icon-size-sm)" aria-hidden="true" />
    </button>
  );

  return (
    <div className="account-password">
      {toggle}
      <AnimatePresence initial={false} onExitComplete={() => {
        if (!open && restoreFocus.current) {
          restoreFocus.current = false;
          toggleRef.current?.focus({ preventScroll: true });
        }
      }}>
        {open && (
          <motion.div
            key="password-form"
            id={panelId}
            className="account-disclosure"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={motionTokens.transition}
            onAnimationComplete={() => { if (open) setFocusReady(true); }}
          >
            <PasswordChangeForm
              focusOnMount={focusReady}
              cancelLabel={copy.cancel}
              submitLabel={copy.changePassword}
              onCancel={() => {
                restoreFocus.current = true;
                setFocusReady(false);
                setOpen(false);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

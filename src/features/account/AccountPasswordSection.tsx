import { useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { KeyRound } from 'lucide-react';
import { useMotionTokens } from '@/hooks/useMotionTokens';
import type { AccountCopy } from '@/pages/account-translations';
import { AccountSection } from './AccountSection';
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
      className="btn-secondary account-card__action"
      aria-expanded={open}
      aria-controls={panelId}
      aria-describedby={`${id}-description`}
      disabled={open}
      onClick={() => { setFocusReady(false); setOpen(true); }}
    >
      <KeyRound size="var(--icon-size-sm)" aria-hidden="true" />
      <span>{copy.changePassword}</span>
    </button>
  );

  return (
    <AccountSection id={id} title={copy.password} description={copy.passwordDescription} action={toggle}>
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
    </AccountSection>
  );
}

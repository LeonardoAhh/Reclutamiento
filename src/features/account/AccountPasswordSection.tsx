import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ChevronRight, KeyRound } from 'lucide-react';
import type { AccountCopy } from '@/pages/account-translations';
import { PasswordChangeForm } from './PasswordChangeForm';

/** Ajustes y contraseña comparten dos vistas con navegación lateral. */
export function AccountPasswordSection({ copy, children, actionsTarget }: {
  copy: AccountCopy;
  children: ReactNode;
  actionsTarget: HTMLElement | null;
}) {
  const id = useId();
  const panelId = `${id}-panel`;
  const [open, setOpen] = useState(false);
  const [focusReady, setFocusReady] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const reduce = useReducedMotion();

  function completeTransition() {
    if (open) setFocusReady(true);
    else if (restoreFocus.current) {
      restoreFocus.current = false;
      toggleRef.current?.focus({ preventScroll: true });
    }
  }

  useEffect(() => {
    if (reduce) completeTransition();
  }, [open, reduce]);

  const toggle = (
    <button
      ref={toggleRef}
      type="button"
      className="account-setting-row"
      aria-expanded={open}
      aria-controls={panelId}
      onClick={() => { setFocusReady(false); setOpen(true); }}
    >
      <KeyRound size="var(--icon-size-sm)" aria-hidden="true" />
      <span className="account-setting-row__label">{copy.password}</span>
      <ChevronRight size="var(--icon-size-sm)" aria-hidden="true" />
    </button>
  );

  return (
    <div className="account-password t-page-slide" data-page={open ? '2' : '1'}>
      <div
        className="t-page account-password__settings"
        data-page-id="1"
        inert={open}
        aria-hidden={open}
        onTransitionEnd={(event) => {
          if (!open && event.target === event.currentTarget && event.propertyName === 'opacity') completeTransition();
        }}
      >
        {toggle}
        {children}
      </div>
      <div
        id={panelId}
        className="t-page account-password__detail"
        data-page-id="2"
        inert={!open}
        aria-hidden={!open}
        onTransitionEnd={(event) => {
          if (open && event.target === event.currentTarget && event.propertyName === 'opacity') completeTransition();
        }}
      >
        <h3 className="account-setting-row__label">{copy.password}</h3>
        <PasswordChangeForm
          actionsTarget={open ? actionsTarget : null}
          focusOnMount={focusReady}
          cancelLabel={copy.cancel}
          submitLabel={copy.changePassword}
          onCancel={() => {
            restoreFocus.current = true;
            setFocusReady(false);
            setOpen(false);
          }}
        />
      </div>
    </div>
  );
}

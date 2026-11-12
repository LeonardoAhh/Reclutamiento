import { useId, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ChevronRight, KeyRound } from 'lucide-react';
import type { AccountCopy } from '@/pages/account-translations';
import { AccountPreferencesSection } from './AccountPreferencesSection';
import { PasswordChangeForm } from './PasswordChangeForm';

export type AccountSettingsView = 'settings' | 'password';

/** Ajustes y contraseña comparten navegación entre vistas. */
export function AccountPasswordSection({
  copy,
  actionsTarget,
  view,
  onViewChange,
}: {
  copy: AccountCopy;
  actionsTarget: HTMLElement | null;
  view: AccountSettingsView;
  onViewChange: (view: AccountSettingsView) => void;
}) {
  const id = useId();
  const panelId = `${id}-panel`;
  const [focusReady, setFocusReady] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef<HTMLButtonElement | null>(null);
  const reduce = useReducedMotion();

  function completeTransition() {
    if (view !== 'settings') setFocusReady(true);
    else if (restoreFocus.current) {
      restoreFocus.current.focus({ preventScroll: true });
      restoreFocus.current = null;
    }
  }

  const openDetail = () => {
    setFocusReady(Boolean(reduce));
    onViewChange('password');
  };

  const closeDetail = (trigger: HTMLButtonElement | null) => {
    if (reduce) requestAnimationFrame(() => trigger?.focus({ preventScroll: true }));
    else restoreFocus.current = trigger;
    setFocusReady(false);
    onViewChange('settings');
  };

  return (
    <div className="account-password t-page-slide" data-page={view === 'settings' ? '1' : '2'}>
      <div
        className="t-page account-password__settings"
        data-page-id="1"
        inert={view !== 'settings'}
        aria-hidden={view !== 'settings'}
        onTransitionEnd={(event) => {
          if (view === 'settings' && event.target === event.currentTarget && event.propertyName === 'opacity')
            completeTransition();
        }}
      >
        <button
          ref={toggleRef}
          type="button"
          className="account-setting-row"
          data-cuelume-open=""
          aria-expanded={view === 'password'}
          aria-controls={panelId}
          onClick={openDetail}
        >
          <KeyRound size="var(--icon-size-sm)" aria-hidden="true" />
          <span className="account-setting-row__label">{copy.password}</span>
          <ChevronRight size="var(--icon-size-sm)" aria-hidden="true" />
        </button>
        <AccountPreferencesSection copy={copy} />
      </div>
      <div
        id={panelId}
        className="t-page account-password__detail"
        data-page-id="2"
        inert={view !== 'password'}
        aria-hidden={view !== 'password'}
        onTransitionEnd={(event) => {
          if (view === 'password' && event.target === event.currentTarget && event.propertyName === 'opacity')
            completeTransition();
        }}
      >
        <PasswordChangeForm
          actionsTarget={view === 'password' ? actionsTarget : null}
          focusOnMount={view === 'password' && focusReady}
          cancelLabel={copy.cancel}
          submitLabel={copy.changePassword}
          onCancel={() => closeDetail(toggleRef.current)}
        />
      </div>
    </div>
  );
}

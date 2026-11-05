import { useId, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ChevronRight, KeyRound } from 'lucide-react';
import type { AccountCopy } from '@/pages/account-translations';
import { AccountPaletteView } from './AccountPaletteView';
import { AccountPreferencesSection } from './AccountPreferencesSection';
import { PasswordChangeForm } from './PasswordChangeForm';

export type AccountSettingsView = 'settings' | 'password' | 'palette';

/** Ajustes, contraseña y paleta comparten navegación entre vistas. */
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
  const palettePanelId = `${id}-palette`;
  const [focusReady, setFocusReady] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const paletteTriggerRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef<HTMLButtonElement | null>(null);
  const reduce = useReducedMotion();

  function completeTransition() {
    if (view !== 'settings') setFocusReady(true);
    else if (restoreFocus.current) {
      restoreFocus.current.focus({ preventScroll: true });
      restoreFocus.current = null;
    }
  }

  const openDetail = (nextView: Exclude<AccountSettingsView, 'settings'>) => {
    setFocusReady(Boolean(reduce));
    onViewChange(nextView);
  };

  const closeDetail = (trigger: HTMLButtonElement | null) => {
    if (reduce) requestAnimationFrame(() => trigger?.focus({ preventScroll: true }));
    else restoreFocus.current = trigger;
    setFocusReady(false);
    onViewChange('settings');
  };

  return (
    <div
      className="account-password t-page-slide"
      data-page={view === 'settings' ? '1' : view === 'password' ? '2' : '3'}
    >
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
          onClick={() => openDetail('password')}
        >
          <KeyRound size="var(--icon-size-sm)" aria-hidden="true" />
          <span className="account-setting-row__label">{copy.password}</span>
          <ChevronRight size="var(--icon-size-sm)" aria-hidden="true" />
        </button>
        <AccountPreferencesSection
          copy={copy}
          paletteOpen={view === 'palette'}
          palettePanelId={palettePanelId}
          paletteTriggerRef={paletteTriggerRef}
          onOpenPalette={() => openDetail('palette')}
        />
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
      <div
        id={palettePanelId}
        className="t-page account-password__detail"
        data-page-id="3"
        inert={view !== 'palette'}
        aria-hidden={view !== 'palette'}
        onTransitionEnd={(event) => {
          if (view === 'palette' && event.target === event.currentTarget && event.propertyName === 'opacity')
            completeTransition();
        }}
      >
        <AccountPaletteView
          copy={copy}
          actionsTarget={view === 'palette' ? actionsTarget : null}
          focusReady={view === 'palette' && focusReady}
          onBack={() => closeDetail(paletteTriggerRef.current)}
        />
      </div>
    </div>
  );
}

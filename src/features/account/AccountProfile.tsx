import { useId, useRef, useState, type ChangeEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { useInlineConfirm } from '@/hooks/useInlineConfirm';
import { useMotionTokens } from '@/hooks/useMotionTokens';
import { playSound } from '@/lib/sound';
import type { AccountCopy } from '@/pages/account-translations';
import { useAvatarEditor } from './useAvatarEditor';

interface AccountProfileProps {
  copy: AccountCopy;
  displayName: string;
  email?: string | null;
}

type FocusTarget = 'save' | 'camera' | null;

/** Identidad de la cuenta con edición de foto en línea (sin diálogos). */
export function AccountProfile({ copy, displayName, email }: AccountProfileProps) {
  const id = useId();
  const editor = useAvatarEditor(copy);
  const confirmDelete = useInlineConfirm();
  const [menuOpen, setMenuOpen] = useState(false);
  const motionTokens = useMotionTokens('--transition-fast');
  const inputRef = useRef<HTMLInputElement>(null);
  const focusTarget = useRef<FocusTarget>(null);
  const busy = editor.uploading || editor.deleting;
  const hintId = `${id}-hint`;

  const focusWhenMounted = (target: Exclude<FocusTarget, null>) => (node: HTMLButtonElement | null) => {
    if (node && !busy && focusTarget.current === target) {
      focusTarget.current = null;
      node.focus({ preventScroll: true });
    }
  };

  function openPicker() {
    if (!busy) {
      playSound('select');
      inputRef.current?.click();
      setMenuOpen(false);
    }
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    event.target.value = '';
    confirmDelete.cancel();
    if (editor.select(selected)) {
      playSound('select');
      focusTarget.current = 'save';
    }
  }

  function cancelSelection() {
    playSound('close');
    focusTarget.current = 'camera';
    editor.clear();
  }

  async function save() {
    focusTarget.current = 'camera';
    if (!(await editor.upload())) focusTarget.current = null;
  }

  async function handleDelete() {
    if (!confirmDelete.confirming) {
      playSound('select');
      confirmDelete.request(true);
      return;
    }
    focusTarget.current = 'camera';
    const removed = await editor.remove();
    confirmDelete.cancel();
    if (removed) setMenuOpen(false);
    if (!removed) focusTarget.current = null;
  }

  const actionMotion = {
    initial: { opacity: 0, y: motionTokens.distance },
    animate: { opacity: 1, y: 0 },
    transition: motionTokens.transition,
  };

  return (
    <section className="account-profile" aria-labelledby={`${id}-name`} aria-busy={busy}>
      <div className="account-profile__identity">
        <span className="account-profile__avatar">
          <Avatar name={displayName} src={editor.preview} />
          <DropdownMenu open={menuOpen} onOpenChange={open => { setMenuOpen(open); if (!open) confirmDelete.cancel(); }}>
            <DropdownMenuTrigger asChild>
              <button ref={focusWhenMounted('camera')} type="button" className="account-profile__avatar-badge"
                onClick={() => playSound(menuOpen ? 'close' : 'open')}
                disabled={busy} aria-label={copy.changeAvatar(displayName)} aria-describedby={hintId}>
                <span className="account-profile__camera-mark" aria-hidden="true">
                  <Camera size="var(--icon-size-sm)" />
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild disabled={busy} onSelect={openPicker}><button type="button">{copy.changePhoto}</button></DropdownMenuItem>
              {editor.hasSavedAvatar && <DropdownMenuItem asChild disabled={busy} variant="destructive" onSelect={event => {
                event.preventDefault();
                void handleDelete();
              }}>
                <button type="button" aria-describedby={confirmDelete.confirming ? `${id}-delete-notice` : undefined}>
                  <Trash2 size="var(--icon-size-sm)" aria-hidden="true" />
                  {editor.deleting ? copy.deleting : confirmDelete.confirming ? copy.confirmDeletePhoto : copy.deletePhoto}
                </button>
              </DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </span>
        <div className="account-profile__copy">
          <h2 id={`${id}-name`} className="account-profile__name">{displayName}</h2>
          {email && <p className="account-profile__email">{email}</p>}
        </div>
      </div>

      <input ref={inputRef} type="file" accept="image/png, image/jpeg, image/webp" className="account-profile__input"
        tabIndex={-1} aria-hidden="true" onChange={handleFile} disabled={busy} />

      <p id={hintId} className="account-profile__hint" aria-live="polite">
        {editor.file ? copy.photoPreview : copy.photoHint}
      </p>

      <AnimatePresence mode="popLayout" initial={false}>
        {editor.file ? (
          <motion.div key="pending" className="account-profile__actions" {...actionMotion}>
            <button type="button" className="btn-secondary" onClick={cancelSelection} disabled={editor.uploading}>
              {copy.cancel}
            </button>
            <button ref={focusWhenMounted('save')} type="button" className="btn-primary"
              onClick={() => void save()} disabled={editor.uploading} aria-busy={editor.uploading}>
              {editor.uploading ? copy.saving : copy.save}
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <p id={`${id}-delete-notice`} className="sr-only" role="status">
        {confirmDelete.confirming ? copy.deletePhotoNotice : ''}
      </p>
      {editor.deleteError && <p className="form-error-text" role="alert">{editor.deleteError}</p>}
    </section>
  );
}

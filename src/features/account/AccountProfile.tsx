import { useId, useRef, type ChangeEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { useInlineConfirm } from '@/hooks/useInlineConfirm';
import { useMotionTokens } from '@/hooks/useMotionTokens';
import type { AccountCopy } from '@/pages/account-translations';
import { useAvatarEditor } from './useAvatarEditor';

interface AccountProfileProps {
  copy: AccountCopy;
  displayName: string;
  email?: string | null;
}

type FocusTarget = 'save' | 'avatar' | null;

/** Identidad de la cuenta con edición de foto en línea (sin diálogos). */
export function AccountProfile({ copy, displayName, email }: AccountProfileProps) {
  const id = useId();
  const editor = useAvatarEditor(copy);
  const confirmDelete = useInlineConfirm();
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
    if (!busy) inputRef.current?.click();
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    event.target.value = '';
    confirmDelete.cancel();
    if (editor.select(selected)) focusTarget.current = 'save';
  }

  function cancelSelection() {
    focusTarget.current = 'avatar';
    editor.clear();
  }

  async function save() {
    focusTarget.current = 'avatar';
    if (!(await editor.upload())) focusTarget.current = null;
  }

  async function handleDelete() {
    if (!confirmDelete.confirming) {
      confirmDelete.request(true);
      return;
    }
    focusTarget.current = 'avatar';
    const removed = await editor.remove();
    confirmDelete.cancel();
    if (!removed) focusTarget.current = null;
  }

  const actionMotion = {
    initial: { opacity: 0, y: motionTokens.distance },
    animate: { opacity: 1, y: 0 },
    transition: motionTokens.transition,
  };

  return (
    <section className="account-card account-profile" aria-labelledby={`${id}-name`} aria-busy={busy}>
      <div className="account-profile__identity">
        <button ref={focusWhenMounted('avatar')} type="button" className="account-profile__avatar" onClick={openPicker} disabled={busy}
          aria-label={copy.changeAvatar(displayName)} aria-describedby={hintId}>
          <Avatar name={displayName} src={editor.preview} />
          <span className="account-profile__avatar-badge" aria-hidden="true">
            <Camera size="var(--icon-size-sm)" />
          </span>
        </button>
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
        ) : editor.hasSavedAvatar && (
          <motion.div key="idle" className="account-profile__actions" {...actionMotion}>
            <button type="button" className="btn-ghost account-profile__delete"
              data-confirming={confirmDelete.confirming || undefined}
              onClick={() => void handleDelete()} disabled={busy} aria-busy={editor.deleting}
              aria-describedby={confirmDelete.confirming ? `${id}-delete-notice` : undefined}
              {...(editor.deleting ? {} : confirmDelete.triggerProps)}>
              <Trash2 size="var(--icon-size-sm)" aria-hidden="true" />
              <span>{editor.deleting ? copy.deleting : confirmDelete.confirming ? copy.confirmDeletePhoto : copy.deletePhoto}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <p id={`${id}-delete-notice`} className="sr-only" role="status">
        {confirmDelete.confirming ? copy.deletePhotoNotice : ''}
      </p>
      {editor.deleteError && <p className="form-error-text" role="alert">{editor.deleteError}</p>}
    </section>
  );
}

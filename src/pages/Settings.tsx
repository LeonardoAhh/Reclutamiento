import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  UserPlus,
} from 'lucide-react';
import { useAuth, type Profile } from '@/hooks/useAuth';
import {
  APP_ROLES,
  ROLE_LABEL,
  createUser,
  listProfiles,
  updateProfileRole,
  type AppRole,
} from '@/lib/users';
import { formatShortDate } from '@/lib/dates';
import './Settings.css';

interface FormState {
  username: string;
  display_name: string;
  password: string;
  role: AppRole;
}

const INITIAL_FORM: FormState = {
  username: '',
  display_name: '',
  password: '',
  role: 'reclutador',
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 320, damping: 28 },
  },
};

/** Pantalla protegida sólo para admins. Permite crear usuarios + gestionar roles. */
export function Settings() {
  const { profile, user, loading } = useAuth();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<
    { type: 'success' | 'error'; message: string } | null
  >(null);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [rowState, setRowState] = useState<
    Record<string, { saving?: boolean; error?: string }>
  >({});

  const isAdmin = profile?.role === 'admin';

  async function loadProfiles() {
    setLoadingList(true);
    setListError(null);
    try {
      const rows = await listProfiles();
      setProfiles(rows);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar los usuarios.';
      setListError(message);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    if (!isAdmin) return;
    loadProfiles();
  }, [isAdmin]);

  // Auto-clear del banner de status tras 6s.
  useEffect(() => {
    if (!formStatus) return;
    const id = window.setTimeout(() => setFormStatus(null), 6000);
    return () => window.clearTimeout(id);
  }, [formStatus]);

  const sortedProfiles = useMemo(
    () =>
      [...profiles].sort((a, b) => a.username.localeCompare(b.username, 'es')),
    [profiles]
  );

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setFormStatus(null);

    const username = form.username.trim().toLowerCase();
    const displayName = form.display_name.trim();
    const password = form.password;

    if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
      setFormStatus({
        type: 'error',
        message:
          'Usuario inválido. Usa 3–32 caracteres: letras minúsculas, números, punto, guion o guion bajo.',
      });
      return;
    }
    if (password.length < 8) {
      setFormStatus({
        type: 'error',
        message: 'La contraseña debe tener al menos 8 caracteres.',
      });
      return;
    }

    setSubmitting(true);
    const result = await createUser({
      username,
      display_name: displayName || username,
      password,
      role: form.role,
    });
    setSubmitting(false);

    if (!result.ok) {
      setFormStatus({
        type: 'error',
        message: result.message ?? 'No se pudo crear el usuario.',
      });
      return;
    }

    setFormStatus({
      type: 'success',
      message: `Usuario "${username}" creado como ${ROLE_LABEL[form.role]}.`,
    });
    setForm(INITIAL_FORM);
    setShowPassword(false);
    loadProfiles();
  }

  async function handleRoleChange(p: Profile, role: AppRole) {
    if (role === p.role) return;
    setRowState((s) => ({ ...s, [p.id]: { saving: true } }));
    const result = await updateProfileRole(p.id, role);
    setRowState((s) => ({
      ...s,
      [p.id]: { saving: false, error: result.ok ? undefined : result.message },
    }));
    if (result.ok) {
      setProfiles((rows) =>
        rows.map((r) => (r.id === p.id ? { ...r, role } : r))
      );
    }
  }

  if (loading) return null;
  if (!profile) return <Navigate to="/login" replace />;
  if (!isAdmin) {
    return (
      <main className="settings settings--denied" role="main">
        <section className="settings__denied-card">
          <h1 className="settings__denied-title">Acceso restringido</h1>
          <p className="settings__denied-text">
            Solo los administradores pueden gestionar usuarios. Pide a un admin
            que cambie tu rol si necesitas acceso.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="settings container" role="main">
      <header className="settings__hero">
        <div>
          <p className="settings__eyebrow">Administración</p>
          <h1 className="settings__title">Configuración</h1>
          <p className="settings__subtitle">
            Crea usuarios y administra los roles del equipo sin salir de la app.
          </p>
        </div>
      </header>

      <div className="settings__grid">
        {/* ── Crear usuario ──────────────────────────────────────────── */}
        <section
          className="settings__panel"
          aria-labelledby="settings-create-title"
        >
          <header className="settings__panel-header">
            <h2 id="settings-create-title" className="settings__panel-title">
              <UserPlus size={16} aria-hidden="true" />
              Crear usuario
            </h2>
            <p className="settings__panel-sub">
              El usuario podrá entrar con el nombre que captures, sin email.
            </p>
          </header>

          <form className="settings__form" onSubmit={handleSubmit} noValidate>
            <div className="settings__field">
              <label htmlFor="settings-username" className="settings__label">
                Usuario
              </label>
              <input
                id="settings-username"
                className="settings__input"
                type="text"
                value={form.username}
                onChange={(e) =>
                  setForm((f) => ({ ...f, username: e.target.value }))
                }
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder="ej. maria.lopez"
                disabled={submitting}
                required
              />
              <p className="settings__hint">
                3–32 caracteres. Sólo minúsculas, números, punto, guion o guion bajo.
              </p>
            </div>

            <div className="settings__field">
              <label htmlFor="settings-displayname" className="settings__label">
                Nombre visible
              </label>
              <input
                id="settings-displayname"
                className="settings__input"
                type="text"
                value={form.display_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, display_name: e.target.value }))
                }
                placeholder="ej. María López"
                disabled={submitting}
              />
              <p className="settings__hint">
                Opcional. Si lo dejas vacío se usa el usuario.
              </p>
            </div>

            <div className="settings__field">
              <label htmlFor="settings-password" className="settings__label">
                Contraseña
              </label>
              <div className="settings__input-wrap">
                <input
                  id="settings-password"
                  className="settings__input"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  placeholder="mínimo 8 caracteres"
                  autoComplete="new-password"
                  disabled={submitting}
                  required
                />
                <button
                  type="button"
                  className="settings__visibility"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={
                    showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                  disabled={submitting}
                >
                  {showPassword ? (
                    <EyeOff size={14} aria-hidden="true" />
                  ) : (
                    <Eye size={14} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div className="settings__field">
              <label htmlFor="settings-role" className="settings__label">
                Rol
              </label>
              <select
                id="settings-role"
                className="settings__input settings__input--select"
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({ ...f, role: e.target.value as AppRole }))
                }
                disabled={submitting}
              >
                {APP_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
            </div>

            <AnimatePresence>
              {formStatus && (
                <motion.div
                  key={formStatus.type + formStatus.message}
                  className={`settings__banner settings__banner--${formStatus.type}`}
                  role={formStatus.type === 'error' ? 'alert' : 'status'}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                >
                  {formStatus.type === 'success' ? (
                    <CheckCircle2 size={14} aria-hidden="true" />
                  ) : (
                    <AlertCircle size={14} aria-hidden="true" />
                  )}
                  <span>{formStatus.message}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              className="btn-primary settings__submit"
              disabled={submitting}
              aria-busy={submitting}
              whileHover={!submitting ? { y: -1 } : undefined}
              whileTap={!submitting ? { scale: 0.97 } : undefined}
              transition={{ type: 'spring', stiffness: 380, damping: 24 }}
            >
              {submitting ? (
                <>
                  <Loader2
                    size={14}
                    className="settings__spinner"
                    aria-hidden="true"
                  />
                  Creando…
                </>
              ) : (
                <>
                  <UserPlus size={14} aria-hidden="true" />
                  Crear usuario
                </>
              )}
            </motion.button>
          </form>
        </section>

        {/* ── Lista de usuarios ──────────────────────────────────────── */}
        <section
          className="settings__panel settings__panel--list"
          aria-labelledby="settings-list-title"
        >
          <header className="settings__panel-header settings__panel-header--row">
            <div>
              <h2 id="settings-list-title" className="settings__panel-title">
                Usuarios
              </h2>
              <p className="settings__panel-sub">
                {sortedProfiles.length}{' '}
                {sortedProfiles.length === 1 ? 'cuenta' : 'cuentas'} registrada
                {sortedProfiles.length === 1 ? '' : 's'}.
              </p>
            </div>
            <button
              type="button"
              className="btn-ghost settings__refresh"
              onClick={loadProfiles}
              disabled={loadingList}
              aria-label="Refrescar lista"
              title="Refrescar"
            >
              <RefreshCw
                size={14}
                aria-hidden="true"
                className={loadingList ? 'settings__spinner' : undefined}
              />
              <span>Refrescar</span>
            </button>
          </header>

          {listError && (
            <div className="settings__banner settings__banner--error" role="alert">
              <AlertCircle size={14} aria-hidden="true" />
              <span>{listError}</span>
            </div>
          )}

          {loadingList ? (
            <p className="settings__empty">Cargando usuarios…</p>
          ) : sortedProfiles.length === 0 ? (
            <p className="settings__empty">No hay usuarios todavía.</p>
          ) : (
            <motion.ul
              className="settings__list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {sortedProfiles.map((p) => {
                const isSelf = p.id === user?.id;
                const state = rowState[p.id];
                return (
                  <motion.li
                    key={p.id}
                    className="settings__item"
                    variants={rowVariants}
                  >
                    <div className="settings__item-info">
                      <p className="settings__item-username">
                        {p.username}
                        {isSelf && (
                          <span className="settings__item-self" aria-label="Tú">
                            tú
                          </span>
                        )}
                      </p>
                      <p className="settings__item-meta">
                        {p.display_name || '—'}
                        {p.last_login_at && (
                          <>
                            {' · '}
                            <span title="Último ingreso">
                              {formatShortDate(p.last_login_at)}
                            </span>
                          </>
                        )}
                      </p>
                    </div>

                    <div className="settings__item-actions">
                      <label
                        className="settings__item-role-label"
                        htmlFor={`role-${p.id}`}
                      >
                        Rol
                      </label>
                      <select
                        id={`role-${p.id}`}
                        className="settings__input settings__input--select settings__item-role"
                        value={p.role}
                        onChange={(e) =>
                          handleRoleChange(p, e.target.value as AppRole)
                        }
                        disabled={state?.saving || isSelf}
                        title={
                          isSelf
                            ? 'No puedes cambiar tu propio rol'
                            : 'Cambiar rol'
                        }
                      >
                        {APP_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABEL[r]}
                          </option>
                        ))}
                      </select>
                      {state?.saving && (
                        <Loader2
                          size={14}
                          className="settings__spinner"
                          aria-hidden="true"
                        />
                      )}
                    </div>

                    {state?.error && (
                      <p className="settings__item-error" role="alert">
                        {state.error}
                      </p>
                    )}
                  </motion.li>
                );
              })}
            </motion.ul>
          )}
        </section>
      </div>
    </main>
  );
}

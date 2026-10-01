import { useEffect, useId, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ACCOUNT_PATH, HOME_PATH } from '@/components/layout/navigation';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Badge } from '@/components/ui/Badge';
import { Tooltip } from '@/components/ui/Tooltip';
import { useAuth, type Profile } from '@/hooks/useAuth';
import { listProfiles } from '@/lib/users';
import { useTeamDirectory } from './TeamProvider';
import { archiveTeamMember, setTeamMemberStatus } from './api';
import { normalizeRecruiterName, type TeamMember } from './types';
import { TeamMemberForm } from './TeamMemberForm';
import './TeamManagement.css';

export function TeamPage() {
  const { profile } = useAuth();
  const { members, refresh } = useTeamDirectory();
  const id = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<TeamMember | null | undefined>(undefined);
  const [confirm, setConfirm] = useState<TeamMember | null>(null);
  const [removing, setRemoving] = useState<TeamMember | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (profile?.role !== 'admin') return;
    let live = true;
    void listProfiles().then(rows => { if (live) setProfiles(rows); })
      .catch(() => { if (live) setError('No se pudieron cargar las cuentas. Actualiza la página para volver a intentar.'); });
    return () => { live = false; };
  }, [profile?.role]);
  async function changeStatus() {
    if (!confirm || busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await setTeamMemberStatus(confirm.id, !confirm.active);
      await refresh();
      setMessage(`${confirm.short_name}: ${confirm.active ? 'baja aplicada' : 'reactivación aplicada'}.`);
      setConfirm(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cambiar el estado.');
      await refresh().catch(() => { /* El proveedor presenta el fallo de lectura. */ });
    } finally { setBusy(false); }
  }
  async function removeMember() {
    if (!removing || busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await archiveTeamMember(removing.id);
      await refresh();
      setMessage(`${removing.short_name}: eliminado de Equipo.`);
      setRemoving(null);
      requestAnimationFrame(() => searchRef.current?.focus());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo eliminar al integrante.');
      await refresh().catch(() => { /* El proveedor presenta el fallo de lectura. */ });
    } finally { setBusy(false); }
  }
  const query = normalizeRecruiterName(search);
  const filtered = members.filter(member => !member.archived_at && normalizeRecruiterName([member.full_name, member.short_name, ...member.aliases].join(' ')).includes(query));
  if (profile?.role !== 'admin') return <Navigate to={HOME_PATH} replace />;
  return <>
    <main className="team-page container container--compact" aria-labelledby={`${id}-title`}>
      <header className="page-header">
        <div className="team-page__heading">
          <Tooltip content="Volver a Mi cuenta"><Link to={ACCOUNT_PATH} className="btn-text team-page__back" aria-label="Volver a Mi cuenta">
            <ArrowLeft size="var(--icon-size-md)" aria-hidden="true" />
          </Link></Tooltip>
          <h1 id={`${id}-title`} className="app-page-title">Equipo</h1>
        </div>
      </header>
      <section className="team-management" aria-label="Integrantes del equipo">
        <div className="team-management__tools"><div className="form-group">
          <label htmlFor={`${id}-search`}>Buscar integrante</label><input ref={searchRef} id={`${id}-search`} type="search" value={search} onChange={event => setSearch(event.target.value)} />
        </div><button type="button" className="btn-primary" disabled={!profiles} onClick={() => setEditing(null)}>Agregar integrante</button></div>
        {!profiles && !error && <p role="status">Cargando cuentas…</p>}
        {error && !confirm && !removing && <p className="form-error-text" role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}
        {filtered.length === 0 && <div><p>{search ? 'No hay integrantes que coincidan con la búsqueda.' : 'No hay integrantes en Equipo.'}</p>
          {search && <button type="button" className="btn-secondary" onClick={() => setSearch('')}>Limpiar búsqueda</button>}
        </div>}
        <ul className="team-management__list">{filtered.map(member => {
          const linked = profiles?.find(row => row.id === member.profile_id);
          const canDeactivate = member.profile_id !== profile?.id && linked?.role !== 'admin';
          return <li className="team-management__member" key={member.id}>
            <div className="team-management__identity"><strong className="type-body-strong">{member.full_name}</strong>
              <span className="type-body-sm">{member.job_title || member.short_name}</span>
              <span className="type-body-sm">{linked ? `Cuenta: ${linked.username}` : member.profile_id ? 'Cuenta vinculada' : 'Sin cuenta vinculada'}</span>
            </div>
            <Badge className="team-management__status">{member.active ? 'Activo' : 'Inactivo'}</Badge>
            <div className="team-management__actions">
              <button type="button" className="btn-secondary" disabled={!profiles || busy} onClick={() => setEditing(member)} aria-label={`Editar a ${member.short_name}`}>Editar</button>
              <button type="button" className="btn-secondary" disabled={!profiles || !canDeactivate || busy}
                onClick={() => { setError(''); setConfirm(member); }} aria-label={`${member.active ? 'Dar de baja' : 'Reactivar'} a ${member.short_name}`}>
                {member.active ? 'Dar de baja' : 'Reactivar'}</button>
              {!member.active && canDeactivate && <button type="button" className="btn-secondary" disabled={!profiles || busy}
                onClick={() => { setError(''); setRemoving(member); }} aria-label={`Eliminar a ${member.short_name} de Equipo`}>
                Eliminar</button>}
            </div>
          </li>;
        })}</ul>
      </section>
    </main>
    {editing !== undefined && profiles && <TeamMemberForm member={editing} profiles={profiles.filter(row => row.id === editing?.profile_id || !members.some(member => member.profile_id === row.id))}
      onClose={() => setEditing(undefined)} onSaved={refresh} />}
    {confirm && <ConfirmModal isOpen title={`${confirm.active ? 'Dar de baja' : 'Reactivar'} a ${confirm.short_name}`} isDestructive={confirm.active}
      description={confirm.active ? 'Sin acceso ni nuevas asignaciones.' : 'Podrá iniciar sesión.'}
      confirmLabel={confirm.active ? 'Dar de baja' : 'Reactivar'} isLoading={busy} errorMessage={error}
      onCancel={() => { if (!busy) { setConfirm(null); setError(''); } }} onConfirm={() => void changeStatus()} />}
    {removing && <ConfirmModal isOpen title={`Eliminar a ${removing.short_name}`} isDestructive
      description={removing.profile_id ? 'Se quita de Equipo. El historial se mantiene.' : 'Esta acción no se puede deshacer.'}
      confirmLabel="Eliminar" isLoading={busy} errorMessage={error}
      onCancel={() => { if (!busy) { setRemoving(null); setError(''); } }} onConfirm={() => void removeMember()} />}
  </>;
}

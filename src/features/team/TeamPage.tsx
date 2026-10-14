import { useEffect, useId, useRef, useState } from 'react';
import { PageHeading } from '@/components/layout/PageHeading';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ACCOUNT_PATH } from '@/components/layout/navigation';
import { Badge } from '@/components/ui/Badge';
import { StatusPage } from '@/components/ui/StatusPage';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { useAuth, type Profile } from '@/hooks/useAuth';
import { listProfiles } from '@/lib/users';
import { useTeamDirectory } from './TeamProvider';
import { archiveTeamMember, setTeamMemberStatus } from './api';
import type { TeamMember } from './types';
import { useLanguage } from '@/contexts/LanguageContext';
import { teamCopy, translateTeamMessage } from './translations';
import { TeamMemberForm } from './TeamMemberForm';
import './TeamManagement.css';

export function TeamPage() {
  const { language } = useLanguage();
  const copy = teamCopy(language);
  const { profile } = useAuth();
  const { members, refresh } = useTeamDirectory();
  const id = useId();
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
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
  async function changeStatus(member: TeamMember) {
    if (!confirm || confirm.id !== member.id || confirm.active !== member.active || busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await setTeamMemberStatus(member.id, !member.active);
      await refresh();
      setMessage(copy.statusChanged(member.short_name, member.active));
      setConfirm(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cambiar el estado. Comprueba la conexión y vuelve a intentar.');
      await refresh().catch(() => { /* El proveedor presenta el fallo de lectura. */ });
    } finally { setBusy(false); }
  }
  async function removeMember(member: TeamMember) {
    if (!removing || removing.id !== member.id || member.active || busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await archiveTeamMember(member.id);
      await refresh();
      setMessage(copy.removedFromTeam(member.short_name));
      setRemoving(null);
      requestAnimationFrame(() => addButtonRef.current?.focus());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo eliminar al integrante. Vuelve a intentar.');
      await refresh().catch(() => { /* El proveedor presenta el fallo de lectura. */ });
    } finally { setBusy(false); }
  }
  const visibleMembers = members.filter(member => !member.archived_at);
  if (profile?.role !== 'admin') return <StatusPage kind="forbidden" />;
  return <>
    <main className="team-page container" aria-labelledby={`${id}-title`}>
          <PageHeading id={`${id}-title`} className="app-page-title">
            <Link to={ACCOUNT_PATH} className="team-page__title-link" aria-label={`${copy.title}, ${copy.backToAccount}`}>
              <ArrowLeft size="var(--icon-size-md)" aria-hidden="true" />
              {copy.title}
            </Link>
          </PageHeading>
      <section
        className="team-management"
        aria-labelledby={`${id}-members-title`}
        aria-busy={!profiles && !error}
      >
        <header className="team-management__header">
          <h2 id={`${id}-members-title`} className="team-management__title">{copy.teamMembers}</h2>
          <button ref={addButtonRef} type="button" className="team-management__add" disabled={!profiles} onClick={() => setEditing(null)}>
            <span className="team-management__add-label">{copy.add}</span>
          </button>
        </header>
        <div className="team-management__body">
        {!profiles && !error && (
          <LoadingSkeleton label={copy.loadingAccounts} className="team-management__skeleton">
            <ul className="team-management__list team-management__skeleton-list" aria-hidden="true">
              {['first', 'second', 'third'].map((member) => (
                <li className="team-management__member team-management__member--loading" key={member}>
                  <div className="team-management__skeleton-identity">
                    <span className="loading-skeleton__bone team-management__skeleton-name" />
                    <span className="loading-skeleton__bone team-management__skeleton-detail" />
                    <span className="loading-skeleton__bone team-management__skeleton-detail team-management__skeleton-detail--short" />
                  </div>
                  <span className="loading-skeleton__bone team-management__skeleton-status" />
                  <div className="team-management__skeleton-actions">
                    <span className="loading-skeleton__bone team-management__skeleton-action" />
                    <span className="loading-skeleton__bone team-management__skeleton-action" />
                  </div>
                </li>
              ))}
            </ul>
          </LoadingSkeleton>
        )}
        {error && <p className="team-management__feedback form-error-text" role="alert">{translateTeamMessage(error, language)}</p>}
        {message && <p className="team-management__feedback" role="status">{message}</p>}
        {(profiles || error) && visibleMembers.length === 0 && <p className="team-management__feedback">{copy.empty}</p>}
        {(profiles || error) && <ul className="team-management__list">{visibleMembers.map(member => {
          const linked = profiles?.find(row => row.id === member.profile_id);
          const canDeactivate = member.profile_id !== profile?.id && linked?.role !== 'admin';
          const confirmingStatus = confirm?.id === member.id && confirm.active === member.active;
          const confirmingRemoval = removing?.id === member.id;
          const statusNoteId = `${id}-${member.id}-status-note`;
          const removalNoteId = `${id}-${member.id}-removal-note`;
          const statusAction = member.active ? copy.giveAccess : copy.reactivate;
          return <li className="team-management__member" key={member.id}>
            <div className="team-management__identity">
              <div className="team-management__name">
                <strong className="type-body-strong">{member.full_name}</strong>
                <Badge className="team-management__status" variant="default">
                  {member.active ? copy.active : copy.inactive}
                </Badge>
              </div>
              <span className="type-body-md">{member.job_title || member.short_name}</span>
            </div>
            <div className="team-management__actions">
              <button type="button" className="btn-secondary" disabled={!profiles || busy} onClick={() => setEditing(member)} aria-label={`${copy.edit} ${member.short_name}`}>{copy.edit}</button>
              <button type="button" className="btn-secondary" disabled={!profiles || !canDeactivate || busy}
                onClick={() => {
                  setError('');
                  if (confirmingStatus) void changeStatus(member);
                  else { setRemoving(null); setConfirm(member); }
                }}
                onBlur={() => { if (!busy) setConfirm(current => current?.id === member.id ? null : current); }}
                onKeyDown={event => { if (event.key === 'Escape') setConfirm(null); }}
                aria-busy={busy && confirmingStatus}
                aria-label={`${confirmingStatus ? `${copy.confirm} ${statusAction.toLowerCase()}` : statusAction} ${member.short_name}`}
                aria-describedby={confirmingStatus ? statusNoteId : undefined}>
                {busy && confirmingStatus ? copy.saving : confirmingStatus ? copy.confirm : statusAction}</button>
              {!member.active && canDeactivate && <button type="button" className="btn-secondary" disabled={!profiles || busy}
                onClick={() => {
                  setError('');
                  if (confirmingRemoval) void removeMember(member);
                  else { setConfirm(null); setRemoving(member); }
                }}
                onBlur={() => { if (!busy) setRemoving(current => current?.id === member.id ? null : current); }}
                onKeyDown={event => { if (event.key === 'Escape') setRemoving(null); }}
                aria-busy={busy && confirmingRemoval}
                aria-label={`${confirmingRemoval ? `${copy.confirm} ${copy.delete.toLowerCase()}` : copy.delete} ${member.short_name}`}
                aria-describedby={confirmingRemoval ? removalNoteId : undefined}>
                {busy && confirmingRemoval ? copy.saving : confirmingRemoval ? copy.confirm : copy.delete}</button>}
            </div>
            {confirmingStatus && <p id={statusNoteId} className="team-management__confirmation-note type-body-md">
              {member.active ? copy.deactivateDescription : copy.reactivateDescription}
            </p>}
            {confirmingRemoval && <p id={removalNoteId} className="team-management__confirmation-note type-body-md">
              {member.profile_id ? copy.deleteLinkedDescription : copy.deleteUnlinkedDescription}
            </p>}
          </li>;
        })}</ul>}
        </div>
      </section>
    </main>
    {editing !== undefined && profiles && <TeamMemberForm member={editing} profiles={profiles.filter(row => row.id === editing?.profile_id || !members.some(member => member.profile_id === row.id))}
      onClose={() => setEditing(undefined)} onSaved={refresh} />}
  </>;
}

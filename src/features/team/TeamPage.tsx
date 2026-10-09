import { useEffect, useId, useRef, useState } from 'react';
import { PageHeading } from '@/components/layout/PageHeading';
import { ArrowLeft } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { ACCOUNT_PATH, HOME_PATH } from '@/components/layout/navigation';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Badge } from '@/components/ui/Badge';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { SearchField } from '@/components/ui/SearchField';
import { useAuth, type Profile } from '@/hooks/useAuth';
import { listProfiles } from '@/lib/users';
import { useTeamDirectory } from './TeamProvider';
import { archiveTeamMember, setTeamMemberStatus } from './api';
import { normalizeRecruiterName, type TeamMember } from './types';
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
      setMessage(copy.statusChanged(confirm.short_name, confirm.active));
      setConfirm(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cambiar el estado. Comprueba la conexión y vuelve a intentar.');
      await refresh().catch(() => { /* El proveedor presenta el fallo de lectura. */ });
    } finally { setBusy(false); }
  }
  async function removeMember() {
    if (!removing || busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await archiveTeamMember(removing.id);
      await refresh();
      setMessage(copy.removedFromTeam(removing.short_name));
      setRemoving(null);
      requestAnimationFrame(() => searchRef.current?.focus());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo eliminar al integrante. Vuelve a intentar.');
      await refresh().catch(() => { /* El proveedor presenta el fallo de lectura. */ });
    } finally { setBusy(false); }
  }
  const query = normalizeRecruiterName(search);
  const filtered = members.filter(member => !member.archived_at && normalizeRecruiterName([member.full_name, member.short_name, ...member.aliases].join(' ')).includes(query));
  if (profile?.role !== 'admin') return <Navigate to={HOME_PATH} replace />;
  return <>
    <main className="team-page container container--compact" aria-labelledby={`${id}-title`}>
          <PageHeading id={`${id}-title`} className="app-page-title">
            <Link to={ACCOUNT_PATH} className="team-page__title-link" aria-label={`${copy.title}, ${copy.backToAccount}`}>
              <ArrowLeft size="var(--icon-size-md)" aria-hidden="true" />
              {copy.title}
            </Link>
          </PageHeading>
      <section
        className="team-management"
        aria-label={copy.teamMembers}
        aria-busy={!profiles && !error}
      >
        <div className="team-management__tools">
          <SearchField
            id={`${id}-search`}
            ref={searchRef}
            label={copy.search}
            placeholder={language === 'en' ? 'Search' : 'Buscar'}
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
          <button type="button" className="btn-primary" disabled={!profiles} onClick={() => setEditing(null)}>{copy.add}</button>
        </div>
        {!profiles && !error && (
          <LoadingSkeleton label={copy.loadingAccounts} className="team-management__skeleton">
            <ul className="team-management__list team-management__skeleton-list" aria-hidden="true">
              {['first', 'second', 'third'].map((member) => (
                <li className="team-management__member" key={member}>
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
        {error && !confirm && !removing && <p className="form-error-text" role="alert">{translateTeamMessage(error, language)}</p>}
        {message && <p role="status">{message}</p>}
        {(profiles || error) && filtered.length === 0 && <div><p>{search ? copy.noMatches : copy.empty}</p>
          {search && <button type="button" className="btn-secondary" onClick={() => setSearch('')}>{copy.clearSearch}</button>}
        </div>}
        {(profiles || error) && <ul className="team-management__list">{filtered.map(member => {
          const linked = profiles?.find(row => row.id === member.profile_id);
          const canDeactivate = member.profile_id !== profile?.id && linked?.role !== 'admin';
          return <li className="team-management__member" key={member.id}>
            <div className="team-management__identity"><strong className="type-body-strong">{member.full_name}</strong>
              <span className="type-body-sm">{member.job_title || member.short_name}</span>
              <span className="type-body-sm">{linked ? copy.linkedAccount(linked.username) : member.profile_id ? copy.linked : copy.unlinked}</span>
            </div>
            <Badge className="team-management__status" variant="default">
              {member.active ? copy.active : copy.inactive}
            </Badge>
            <div className="team-management__actions">
              <button type="button" className="btn-secondary" disabled={!profiles || busy} onClick={() => setEditing(member)} aria-label={`${copy.edit} ${member.short_name}`}>{copy.edit}</button>
              <button type="button" className="btn-secondary" disabled={!profiles || !canDeactivate || busy}
                onClick={() => { setError(''); setConfirm(member); }} aria-label={`${member.active ? copy.giveAccess : copy.reactivate} ${member.short_name}`}>
                {member.active ? copy.giveAccess : copy.reactivate}</button>
              {!member.active && canDeactivate && <button type="button" className="btn-secondary" disabled={!profiles || busy}
                onClick={() => { setError(''); setRemoving(member); }} aria-label={`${copy.delete} ${member.short_name}`}>
                {copy.delete}</button>}
            </div>
          </li>;
        })}</ul>}
      </section>
    </main>
    {editing !== undefined && profiles && <TeamMemberForm member={editing} profiles={profiles.filter(row => row.id === editing?.profile_id || !members.some(member => member.profile_id === row.id))}
      onClose={() => setEditing(undefined)} onSaved={refresh} />}
    {confirm && <ConfirmModal isOpen title={`${confirm.active ? copy.confirmDeactivate : copy.confirmReactivate} ${confirm.short_name}`} isDestructive={confirm.active}
      description={confirm.active ? copy.deactivateDescription : copy.reactivateDescription}
      confirmLabel={confirm.active ? copy.confirmDeactivate : copy.confirmReactivate} cancelLabel={copy.cancel} loadingLabel={copy.saving} isLoading={busy} errorMessage={error ? translateTeamMessage(error, language) : undefined}
      onCancel={() => { if (!busy) { setConfirm(null); setError(''); } }} onConfirm={() => void changeStatus()} />}
    {removing && <ConfirmModal isOpen title={copy.deleteMember(removing.short_name)} isDestructive
      description={removing.profile_id ? copy.deleteLinkedDescription : copy.deleteUnlinkedDescription}
      confirmLabel={copy.delete} cancelLabel={copy.cancel} loadingLabel={copy.saving} isLoading={busy} errorMessage={error ? translateTeamMessage(error, language) : undefined}
      onCancel={() => { if (!busy) { setRemoving(null); setError(''); } }} onConfirm={() => void removeMember()} />}
  </>;
}

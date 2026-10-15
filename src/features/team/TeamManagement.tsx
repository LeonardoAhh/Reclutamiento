import { useEffect, useId, useRef, useState } from 'react';
import { Clock, PowerOff, RotateCcw, Trash2, X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { useAuth, type Profile } from '@/hooks/useAuth';
import { listProfiles } from '@/lib/users';
import { subscribeOnlineUserIds } from '@/lib/presence';
import { supabase } from '@/lib/supabase';
import { formatAccountLastAccess, formatLastAccess } from '@/lib/userActivity';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTeamDirectory } from './TeamProvider';
import { archiveTeamMember, setTeamMemberStatus } from './api';
import { TeamMemberForm } from './TeamMemberForm';
import { teamCopy, translateTeamMessage } from './translations';
import type { TeamMember } from './types';
import './TeamManagement.css';

type PendingAction = { member: TeamMember; kind: 'status' | 'remove' };

export function TeamManagement() {
  const { language } = useLanguage();
  const copy = teamCopy(language);
  const { profile } = useAuth();
  const { members, refresh } = useTeamDirectory();
  const id = useId();
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(() => new Set());
  const [now, setNow] = useState(() => Date.now());
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (profile?.role !== 'admin') return;
    let live = true;
    void listProfiles().then(rows => { if (live) setProfiles(rows); })
      .catch(() => { if (live) setError(copy.accountsError); });
    return () => { live = false; };
  }, [profile?.role, copy.accountsError]);

  useEffect(() => {
    if (profile?.role !== 'admin') return;
    const unsubscribe = subscribeOnlineUserIds(setOnlineUsers);
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    const channel = supabase.channel('team-management-profiles')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, payload => {
        setProfiles(current => current?.map(row => row.id === payload.new.id ? { ...row, ...payload.new } : row) ?? null);
      }).subscribe();
    return () => {
      unsubscribe();
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [profile?.role]);

  useEffect(() => {
    if (!pending) return;
    const frame = requestAnimationFrame(() => confirmButtonRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [pending]);

  async function confirmAction() {
    if (!pending || busy) return;
    const { member, kind } = pending;
    const current = members.find(row => row.id === member.id && !row.archived_at);
    if (!current || current.active !== member.active || current.profile_id === profile?.id || current.profile_role === 'admin' || (kind === 'remove' && current.active)) {
      setPending(null);
      return;
    }
    setBusy(true); setError(''); setMessage('');
    try {
      if (kind === 'status') {
        await setTeamMemberStatus(current.id, !current.active);
        await refresh();
        setMessage(copy.statusChanged(member.short_name, member.active));
      } else {
        await archiveTeamMember(current.id);
        await refresh();
        setMessage(copy.removedFromTeam(member.short_name));
        requestAnimationFrame(() => addButtonRef.current?.focus());
      }
      setPending(null);
    } catch (cause) {
      setError(cause instanceof Error ? translateTeamMessage(cause.message, language) : kind === 'status' ? copy.statusFailure : copy.deleteFailure);
      await refresh().catch(() => { /* El proveedor conserva los datos y presenta el error. */ });
    } finally { setBusy(false); }
  }

  const visibleMembers = members.filter(member => !member.archived_at);
  if (profile?.role !== 'admin') return null;

  return <section className="team-management" aria-labelledby={`${id}-title`} aria-busy={!profiles && !error}>
    <header className="team-management__header">
      <div className="team-management__heading">
        <h2 id={`${id}-title`} className="team-management__title">{copy.teamMembers}</h2>
        <span className="team-management__count type-body-sm">{visibleMembers.length} {language === 'en' ? visibleMembers.length === 1 ? 'person' : 'people' : visibleMembers.length === 1 ? 'persona' : 'personas'}</span>
      </div>
      <button ref={addButtonRef} type="button" className="team-management__add" disabled={!profiles || busy} onClick={() => setAdding(true)}>{copy.add}</button>
    </header>
    {error && <p className="team-management__feedback form-error-text" role="alert">{error}</p>}
    {message && <p className="team-management__feedback type-body-md" role="status">{message}</p>}
    {!profiles && !error && <LoadingSkeleton label={copy.loadingAccounts} className="team-management__skeleton">
      <div className="team-management__skeleton-list" aria-hidden="true">
        {['first', 'second', 'third'].map(key => <span key={key} className="loading-skeleton__bone team-management__skeleton-row" />)}
      </div>
    </LoadingSkeleton>}
    {(profiles || error) && visibleMembers.length === 0 && <p className="team-management__feedback type-body-md">{copy.empty}</p>}
    {profiles && visibleMembers.length > 0 && <div className="team-management__list" role="list">
      <div className="team-management__columns" aria-hidden="true">
        <span>{language === 'en' ? 'Member' : 'Integrante'}</span>
        <span>{language === 'en' ? 'Role' : 'Puesto'}</span>
        <span>{language === 'en' ? 'Status' : 'Estado'}</span>
        <span className="sr-only">{language === 'en' ? 'Actions' : 'Acciones'}</span>
      </div>
      {visibleMembers.map(member => {
        const linked = profiles.find(row => row.id === member.profile_id);
        const online = Boolean(member.active && linked && onlineUsers.has(linked.id));
        const lastAccess = linked ? formatLastAccess(linked.last_login_at, now, language) : null;
        const presence = !member.active ? copy.inactive : !linked ? copy.unlinkedStatus : online ? language === 'en' ? 'Online now' : 'En línea ahora' : formatAccountLastAccess(lastAccess ?? '', language);
        const canChange = member.profile_id !== profile.id && member.profile_role !== 'admin' && linked?.role !== 'admin';
        const isPending = pending?.member.id === member.id;
        return <div className="team-management__member" role="listitem" key={member.id}>
          <div className="team-management__row">
            <div className="team-management__person">
              <Avatar name={member.full_name} src={linked?.avatar_url} title="" />
              <div className="team-management__person-copy">
                <strong className="type-body-strong">{member.full_name}</strong>
              </div>
            </div>
            <span className="team-management__role type-body-md">{member.job_title || member.short_name}</span>
            <span className="team-management__status type-body-md" data-online={online} title={lastAccess && !online ? lastAccess : undefined}>
              {online || !linked || !member.active ? <span className="team-management__status-dot" data-online={online} aria-hidden="true" /> : <Clock size="var(--icon-size-sm)" aria-hidden="true" />}
              {presence}
            </span>
            <div className="team-management__actions">
              {canChange && <div className="team-management__action-group" onKeyDown={event => { if (event.key === 'Escape' && !busy) setPending(null); }} onBlur={event => { if (!busy && !event.currentTarget.contains(event.relatedTarget)) setPending(null); }}>
                {isPending ? <>
                  <button ref={confirmButtonRef} type="button" className={`team-management__confirm${pending.kind === 'remove' ? ' team-management__confirm--danger' : ''}`} disabled={busy} aria-busy={busy} aria-label={`${copy.confirm} ${pending.kind === 'remove' ? copy.delete.toLowerCase() : (member.active ? copy.giveAccess : copy.reactivate).toLowerCase()} ${member.full_name}`} title={pending.kind === 'remove' ? member.profile_id ? copy.deleteLinkedDescription : copy.deleteUnlinkedDescription : member.active ? copy.deactivateDescription : copy.reactivateDescription} onClick={() => void confirmAction()}>
                    {pending.kind === 'remove' ? <Trash2 size="var(--icon-size-sm)" aria-hidden="true" /> : member.active ? <PowerOff size="var(--icon-size-sm)" aria-hidden="true" /> : <RotateCcw size="var(--icon-size-sm)" aria-hidden="true" />}
                    <span>{busy ? copy.saving : copy.confirm}</span>
                  </button>
                  <button type="button" className="team-management__action-icon" disabled={busy} aria-label={`${copy.cancel}: ${member.full_name}`} onClick={() => setPending(null)}><X size="var(--icon-size-sm)" aria-hidden="true" /></button>
                </> : <>
                  <button type="button" className="team-management__action-icon" disabled={busy} aria-label={`${member.active ? copy.giveAccess : copy.reactivate}: ${member.full_name}`} onClick={() => setPending({ member, kind: 'status' })}>{member.active ? <PowerOff size="var(--icon-size-sm)" aria-hidden="true" /> : <RotateCcw size="var(--icon-size-sm)" aria-hidden="true" />}</button>
                  {!member.active && <button type="button" className="team-management__action-icon team-management__action-icon--danger" disabled={busy} aria-label={`${copy.delete}: ${member.full_name}`} onClick={() => setPending({ member, kind: 'remove' })}><Trash2 size="var(--icon-size-sm)" aria-hidden="true" /></button>}
                </>}
              </div>}
            </div>
          </div>
        </div>;
      })}
    </div>}
    {adding && profiles && <TeamMemberForm member={null} profiles={profiles.filter(row => !members.some(member => member.profile_id === row.id))} onClose={() => setAdding(false)} onSaved={refresh} />}
  </section>;
}

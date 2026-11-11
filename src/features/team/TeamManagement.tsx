import { useEffect, useId, useRef, useState } from 'react';
import { Check, Clock, EllipsisVertical, Pencil, PowerOff, RotateCcw, Trash2, X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
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
  const confirmMenuItemRef = useRef<HTMLDivElement>(null);
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(() => new Set());
  const [now, setNow] = useState(() => Date.now());
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [openActionsFor, setOpenActionsFor] = useState<string | null>(null);
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
    const frame = requestAnimationFrame(() => confirmMenuItemRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [pending]);

  async function confirmAction() {
    if (!pending || busy) return;
    const { member, kind } = pending;
    const current = members.find(row => row.id === member.id && !row.archived_at);
    if (!current || current.active !== member.active || current.profile_id === profile?.id || current.profile_role === 'admin' || (kind === 'remove' && current.active)) {
      setPending(null);
      setOpenActionsFor(null);
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
      setOpenActionsFor(null);
    } catch (cause) {
      setError(cause instanceof Error ? translateTeamMessage(cause.message, language) : kind === 'status' ? copy.statusFailure : copy.deleteFailure);
      await refresh().catch(() => { /* El proveedor conserva los datos y presenta el error. */ });
    } finally { setBusy(false); }
  }

  const visibleMembers = members.filter(member => !member.archived_at);
  const availableProfiles = profiles?.filter(row => !members.some(member =>
    member.profile_id === row.id && member.id !== editing?.id)) ?? [];
  if (profile?.role !== 'admin') return null;

  return <section className="team-management" aria-labelledby={`${id}-title`} aria-busy={!profiles && !error}>
    <header className="team-management__header">
      <div className="team-management__heading">
        <h2 id={`${id}-title`} className="team-management__title">{copy.teamMembers}</h2>
        <span className="team-management__count type-body-sm">{visibleMembers.length} {language === 'en' ? visibleMembers.length === 1 ? 'person' : 'people' : visibleMembers.length === 1 ? 'persona' : 'personas'}</span>
      </div>
      <button data-cuelume-tap="" ref={addButtonRef} type="button" className="team-management__add" disabled={!profiles || busy} onClick={() => setAdding(true)}>{copy.add}</button>
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
        <span className="sr-only">{copy.actions}</span>
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
              <DropdownMenu
                open={openActionsFor === member.id}
                onOpenChange={open => {
                  if (open) {
                    setPending(current => current?.member.id === member.id ? current : null);
                    setOpenActionsFor(member.id);
                  } else {
                    setOpenActionsFor(current => current === member.id ? null : current);
                    if (!busy) setPending(current => current?.member.id === member.id ? null : current);
                  }
                }}
              >
                <DropdownMenuTrigger asChild>
                  <button data-cuelume-tap="" type="button" disabled={busy} aria-label={`${copy.actions}: ${member.full_name}`}>
                    <EllipsisVertical aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" aria-label={`${copy.actions}: ${member.full_name}`}>
                  {isPending ? <>
                    <DropdownMenuItem ref={confirmMenuItemRef} disabled={busy} aria-label={`${copy.confirm} ${pending.kind === 'remove' ? copy.delete.toLowerCase() : (member.active ? copy.giveAccess : copy.reactivate).toLowerCase()}`} onSelect={event => { event.preventDefault(); void confirmAction(); }}>
                      <Check aria-hidden="true" />
                      <span>{copy.confirm}: {pending.kind === 'remove' ? copy.delete : member.active ? copy.giveAccess : copy.reactivate}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={busy} onSelect={() => setPending(null)}>
                      <X aria-hidden="true" />
                      <span>{copy.cancel}</span>
                    </DropdownMenuItem>
                  </> : <>
                    <DropdownMenuItem onSelect={() => { setPending(null); setEditing(member); }}>
                      <Pencil aria-hidden="true" />
                      <span>{copy.edit}</span>
                    </DropdownMenuItem>
                    {canChange && <DropdownMenuItem onSelect={event => { event.preventDefault(); setPending({ member, kind: 'status' }); }}>
                      {member.active ? <PowerOff aria-hidden="true" /> : <RotateCcw aria-hidden="true" />}
                      <span>{member.active ? copy.giveAccess : copy.reactivate}</span>
                    </DropdownMenuItem>}
                    {canChange && !member.active && <DropdownMenuItem variant="destructive" onSelect={event => { event.preventDefault(); setPending({ member, kind: 'remove' }); }}>
                      <Trash2 aria-hidden="true" />
                      <span>{copy.delete}</span>
                    </DropdownMenuItem>}
                  </>}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>;
      })}
    </div>}
    {adding && profiles && <TeamMemberForm member={null} profiles={availableProfiles} onClose={() => setAdding(false)} onSaved={refresh} />}
    {editing && profiles && <TeamMemberForm member={editing} profiles={availableProfiles} onClose={() => setEditing(null)} onSaved={refresh} />}
  </section>;
}

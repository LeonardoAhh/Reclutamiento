import { useId, useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { Profile } from '@/hooks/useAuth';
import { toNaturalCase } from '@/lib/utils';
import { saveTeamMember } from './api';
import { normalizeRecruiterName, type TeamMember, type TeamMemberInput } from './types';

function formatField(key: 'canonical_name' | 'full_name' | 'short_name' | 'access_card_name' | 'job_title', value: string) {
  if (key === 'canonical_name') return normalizeRecruiterName(value);
  return toNaturalCase(value, { preserveAcronyms: key === 'job_title' });
}

interface Props { member: TeamMember | null; profiles: Profile[]; onClose: () => void; onSaved: () => Promise<void> }
export function TeamMemberForm({ member, profiles, onClose, onSaved }: Props) {
  const id = useId();
  const formatInput = (key: Parameters<typeof formatField>[0], value: string) =>
    member?.[key] === value ? value : formatField(key, value);
  const [form, setForm] = useState<TeamMemberInput>(() => member ?? {
    canonical_name: '', full_name: '', short_name: '', access_card_name: '', job_title: '',
    badge_role: 'reclutadora', profile_id: null, selectable: true, include_in_metrics: true, aliases: [],
  });
  const [aliases, setAliases] = useState(member?.aliases.join('\n') ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      await saveTeamMember({
        ...form,
        canonical_name: formatInput('canonical_name', form.canonical_name),
        full_name: formatInput('full_name', form.full_name),
        short_name: formatInput('short_name', form.short_name),
        access_card_name: formatInput('access_card_name', form.access_card_name),
        job_title: formatInput('job_title', form.job_title),
        aliases: aliases.split('\n').map(value => value.trim().replace(/\s+/g, ' ')).filter(Boolean),
      });
      await onSaved(); onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar.'); }
    finally { setBusy(false); }
  }
  const fields = [
    ['canonical_name', 'Identificador', 120], ['full_name', 'Nombre completo', 200],
    ['short_name', 'Nombre visible', 120], ['access_card_name', 'Nombre en pase de acceso', 200],
    ['job_title', 'Puesto', 200],
  ] as const;
  return <Modal isOpen title={member ? 'Editar integrante' : 'Agregar integrante'} size="md"
    onClose={() => { if (!busy) onClose(); }} footerActions={<>
      <button type="button" className="btn-secondary" disabled={busy} onClick={onClose}>Cancelar</button>
      <button type="submit" form={id} className="btn-primary" disabled={busy} aria-busy={busy}>{busy ? 'Guardando…' : 'Guardar'}</button>
    </>}>
    <form id={id} className="modal-body form-grid team-form" onSubmit={submit} aria-describedby={error ? `${id}-error` : undefined}>
      {fields.map(([key, label, maxLength]) => <div className="form-group" key={key}>
        <label htmlFor={`${id}-${key}`}>{label}</label>
        <input id={`${id}-${key}`} value={form[key]} maxLength={maxLength} required={key !== 'job_title'}
          disabled={busy || (key === 'canonical_name' && Boolean(member))}
          autoCapitalize={key === 'canonical_name' ? 'characters' : 'words'}
          spellCheck={key === 'job_title'} lang="es-MX"
          onChange={event => setForm(previous => ({ ...previous, [key]: event.target.value }))}
          onBlur={() => setForm(previous => ({ ...previous, [key]: formatInput(key, previous[key]) }))} />
      </div>)}
      <div className="form-group"><label htmlFor={`${id}-role`}>Función en reclutamiento</label>
        <select id={`${id}-role`} value={form.badge_role} disabled={busy}
          onChange={event => setForm({ ...form, badge_role: event.target.value === 'coordinador' ? 'coordinador' : 'reclutadora' })}>
          <option value="reclutadora">Reclutador</option><option value="coordinador">Coordinador</option>
        </select>
      </div>
      <div className="form-group team-form__wide"><label htmlFor={`${id}-account`}>Cuenta vinculada</label>
        <select id={`${id}-account`} value={form.profile_id ?? ''} disabled={busy || Boolean(member?.profile_id) || member?.active === false}
          aria-describedby={`${id}-account-help`}
          onChange={event => setForm({ ...form, profile_id: event.target.value || null })}>
          <option value="">Sin cuenta vinculada</option>
          {profiles.map(profile => <option key={profile.id} value={profile.id}>{profile.display_name || profile.username} ({profile.username})</option>)}
        </select>
        <p className="type-body-sm" id={`${id}-account-help`}>La baja bloqueará esta cuenta. Una cuenta vinculada no se puede sustituir.</p>
      </div>
      <div className="form-group team-form__wide"><label htmlFor={`${id}-aliases`}>Variantes del nombre, una por línea</label>
        <textarea id={`${id}-aliases`} value={aliases} disabled={busy} rows={4} maxLength={20000} aria-describedby={`${id}-aliases-help`}
          onChange={event => setAliases(event.target.value)} />
        <p id={`${id}-aliases-help`} className="type-body-sm">Los nombres anteriores se conservan para reconocer los registros históricos.</p>
      </div>
      <label className="team-check"><input type="checkbox" checked={form.selectable} disabled={busy}
        onChange={event => setForm({ ...form, selectable: event.target.checked })} />Disponible para asignaciones</label>
      <label className="team-check"><input type="checkbox" checked={form.include_in_metrics} disabled={busy}
        onChange={event => setForm({ ...form, include_in_metrics: event.target.checked })} />Incluir en métricas individuales</label>
      {error && <p id={`${id}-error`} className="form-error-text team-form__wide" role="alert">{error}</p>}
    </form>
  </Modal>;
}

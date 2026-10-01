export type RecruiterRole = 'reclutadora' | 'coordinador';

export interface TeamMember {
  id: string;
  canonical_name: string;
  full_name: string;
  short_name: string;
  access_card_name: string;
  job_title: string;
  badge_role: RecruiterRole;
  profile_id: string | null;
  profile_role: 'admin' | 'reclutador' | null;
  active: boolean;
  archived_at: string | null;
  selectable: boolean;
  include_in_metrics: boolean;
  aliases: string[];
}

export type TeamMemberInput = Omit<TeamMember, 'id' | 'active' | 'archived_at' | 'profile_role'> & { id?: string };

export function normalizeRecruiterName(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim().replace(/\s+/g, ' ').toUpperCase();
}

export function findTeamMember(members: readonly TeamMember[], value: string | null | undefined) {
  if (!value?.trim()) return undefined;
  const key = normalizeRecruiterName(value);
  return members.find(member => [member.canonical_name, member.full_name, member.short_name,
    member.access_card_name, ...member.aliases].some(name => normalizeRecruiterName(name) === key));
}

export function recruiterOptions(members: readonly TeamMember[], current?: string | null, full = false) {
  const options = members.filter(member => member.active && member.selectable)
    .map(member => ({ value: member.canonical_name, label: full ? member.full_name : member.short_name }));
  if (current && !options.some(option => option.value === current)) {
    const member = findTeamMember(members, current);
    options.push({ value: current, label: `${member?.short_name ?? current} (asignación actual)` });
  }
  return options;
}

export function accessCardRecruiterName(members: readonly TeamMember[], value: string | null | undefined) {
  if (!value?.trim()) return null;
  const member = findTeamMember(members, value);
  if (member) return member.access_card_name;
  const parts = value.trim().split(/\s+/);
  return `Lic. ${parts[0]}${parts.length > 1 ? ` ${parts[parts.length - 1]}` : ''}`;
}

import type { CandidateGroup } from './CandidateFilters';
import type { Candidate } from '@/lib/types';

export function matchesCandidateGroup(candidate: Candidate, group: CandidateGroup): boolean {
  if (group === 'activos') {
    return !['contratado', 'baja', 'rechazado', 'no_asistio'].includes(candidate.status);
  }
  if (group === 'contratados') return candidate.status === 'contratado';
  return true;
}

export function findCandidateSearchResults(candidates: Candidate[], searchTerm: string): Candidate[] {
  const query = searchTerm.trim().toLowerCase();
  if (!query) return [];

  const digitsOnly = query.replace(/\D/g, '');
  const isPhoneQuery = digitsOnly.length >= 10;
  const phoneToSearch = isPhoneQuery ? digitsOnly.slice(-10) : digitsOnly;
  const isNumericQuery = digitsOnly.length > 0 && query.replace(/[\s-]/g, '') === digitsOnly;

  return candidates
    .filter((candidate) => {
      const phone = candidate.telefono ? String(candidate.telefono) : '';
      const cleanPhone = phone.replace(/\D/g, '');
      const searchableText = [
        candidate.nombre,
        candidate.puesto,
        candidate.area,
        candidate.reclutador,
        candidate.source,
        candidate.email,
        phone,
        cleanPhone,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (isPhoneQuery) {
        return cleanPhone.includes(phoneToSearch) || searchableText.includes(phoneToSearch);
      }

      if (isNumericQuery) {
        return cleanPhone.includes(digitsOnly) || searchableText.includes(digitsOnly);
      }

      return searchableText.includes(query);
    })
    .slice(0, 5);
}

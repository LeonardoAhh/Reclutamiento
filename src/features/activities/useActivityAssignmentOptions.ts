import { useMemo } from 'react';
import { usePositions } from '@/lib/positions';
import { useTeamDirectory } from '@/features/team/TeamProvider';

export function useActivityAssignmentOptions(
  en: boolean,
  members: ReturnType<typeof useTeamDirectory>['members'],
  vacancyArea: string,
  vacancySection: string,
) {
  const { positions, configurablePositions } = usePositions();
  const recruiters = useMemo(
    () =>
      members.flatMap((member) =>
        member.active && member.selectable && member.profile_id && member.profile_role === 'reclutador'
          ? [
              {
                id: member.profile_id,
                display_name: member.full_name,
                username: member.short_name,
              },
            ]
          : [],
      ),
    [members],
  );
  const teamRecruiterOptions = useMemo(
    () => [
      { value: '', label: en ? 'Whole team' : 'Todo el equipo' },
      ...recruiters.map((recruiter) => ({
        value: recruiter.id,
        label: recruiter.username,
      })),
    ],
    [recruiters, en],
  );
  const vacancyRecruiterOptions = useMemo(
    () => [
      { value: '', label: en ? 'Unassigned' : 'Sin asignar' },
      ...recruiters.map((recruiter) => ({
        value: recruiter.id,
        label: recruiter.username,
      })),
    ],
    [recruiters, en],
  );
  const areasOptions = useMemo(
    () =>
      Array.from(new Set(configurablePositions.map((position) => position.area))).sort((first, second) =>
        first.localeCompare(second, 'es'),
      ),
    [configurablePositions],
  );
  const seccionesOptions = useMemo(() => {
    let availablePositions = configurablePositions;
    if (vacancyArea) {
      availablePositions = availablePositions.filter((position) => position.area === vacancyArea);
    }
    return Array.from(new Set(availablePositions.map((position) => position.seccion).filter(Boolean))).sort(
      (first, second) => first.localeCompare(second, 'es'),
    );
  }, [configurablePositions, vacancyArea]);
  const puestosOptions = useMemo(() => {
    let availablePositions = configurablePositions;
    if (vacancyArea) {
      availablePositions = availablePositions.filter((position) => position.area === vacancyArea);
    }
    if (vacancySection) {
      availablePositions = availablePositions.filter((position) => position.seccion === vacancySection);
    }
    return Array.from(new Set(availablePositions.map((position) => position.puesto))).sort((first, second) =>
      first.localeCompare(second, 'es'),
    );
  }, [configurablePositions, vacancyArea, vacancySection]);

  return {
    positions,
    recruiters,
    teamRecruiterOptions,
    vacancyRecruiterOptions,
    areasOptions,
    seccionesOptions,
    puestosOptions,
  };
}

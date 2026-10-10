import { motion, useReducedMotion } from 'framer-motion';
import { fadeUp } from '@/lib/motion';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTeamDirectory } from '@/features/team/TeamProvider';
import { BrandMarkPath } from '@/components/ui/BrandMark';
import { toNaturalCase } from '@/lib/utils';

export function SidebarBrand() {
  const reduceMotion = useReducedMotion();
  const { username, profile } = useAuth();
  const { language } = useLanguage();
  const { members } = useTeamDirectory();
  const linkedMember = members.find(member => member.profile_id === profile?.id);
  const displayName = toNaturalCase(profile?.display_name || username || '', {
    preserveAcronyms: false,
  });
  const jobTitle = linkedMember?.job_title.trim() || (
    profile?.role === 'admin'
      ? language === 'en' ? 'Administrator' : 'Administrador'
      : language === 'en' ? 'Recruiter' : 'Reclutador'
  );

  return (
    <div className="sidebar__brand">
      <motion.span
        className="sidebar__brand-mark"
        variants={fadeUp}
        initial={reduceMotion ? false : 'hidden'}
        animate="show"
      >
        <svg
          viewBox="0 0 1800 1800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          focusable="false"
        >
          <BrandMarkPath />
        </svg>
      </motion.span>
      <span className="sidebar__brand-text">
        <span className="sidebar__brand-title" title={displayName}>{displayName}</span>
        <span className="sidebar__brand-subtitle" title={jobTitle}>{jobTitle}</span>
      </span>
    </div>
  );
}

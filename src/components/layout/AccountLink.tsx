import { UserRound } from 'lucide-react';
import { Link, useMatch } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { useLanguage } from '@/contexts/LanguageContext';
import { ACCOUNT_PATH } from './navigation';
import { playSound } from '@/lib/sound';
import './AccountLink.css';

interface AccountLinkProps {
  displayName: string;
  avatarUrl?: string | null;
}

export function AccountLink({ displayName, avatarUrl }: AccountLinkProps) {
  const { language } = useLanguage();
  const english = language === 'en';
  const isAccountPage = Boolean(useMatch(ACCOUNT_PATH));

  return (
    <Link to={ACCOUNT_PATH} className="account-link"
      onClick={() => playSound('navigate')}
      aria-current={isAccountPage ? 'page' : undefined}
      aria-label={english ? `Go to My account for ${displayName}` : `Ir a Mi cuenta de ${displayName}`}>
      <span className="account-link__surface">
        <Avatar name={displayName} src={avatarUrl}
          fallback={<UserRound className="account-link__avatar-icon" aria-hidden="true" />} />
        <span className="account-link__name" aria-hidden="true" title={displayName}>{displayName}</span>
      </span>
    </Link>
  );
}

import { useState } from 'react';
import { Link, useMatch } from 'react-router-dom';
import { LogOut, UserRound } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Tooltip } from '@/components/ui/Tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSignOut } from '@/features/account/useSignOut';
import { playSound } from '@/lib/sound';
import { toNaturalCase } from '@/lib/utils';
import { ACCOUNT_PATH } from './navigation';

type SidebarAccountMenuProps = {
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  role?: string;
  collapsed: boolean;
};

export function SidebarAccountMenu({ username, displayName, avatarUrl, role, collapsed }: SidebarAccountMenuProps) {
  const { language } = useLanguage();
  const accountActive = Boolean(useMatch(ACCOUNT_PATH));
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const { handleSignOut, isLoading } = useSignOut();
  const name = toNaturalCase(displayName || username, { preserveAcronyms: false });
  const roleLabel = role === 'admin' ? (language === 'en' ? 'Administrator' : 'Administrador')
    : role === 'reclutador' ? (language === 'en' ? 'Recruiter' : 'Reclutador') : '';
  const trigger = (
    <DropdownMenuTrigger asChild>
      <button type="button" className="sidebar__account-trigger" aria-label={language === 'en' ? `Account menu for ${name}` : `Menú de cuenta de ${name}`} aria-expanded={open}>
        <Avatar name={name} src={avatarUrl} fallback={<UserRound aria-hidden="true" />} />
        <span className="sidebar__account-copy">
          <span className="sidebar__account-name">{name}</span>
          {roleLabel && <span className="sidebar__account-role">{roleLabel}</span>}
        </span>
      </button>
    </DropdownMenuTrigger>
  );

  return (
    <DropdownMenu open={open} onOpenChange={(nextOpen) => {
      setOpen(nextOpen);
      if (!nextOpen) setConfirming(false);
    }}>
      {collapsed ? <Tooltip content={language === 'en' ? 'Account' : 'Cuenta'} side="right">{trigger}</Tooltip> : trigger}
      <DropdownMenuContent side="top" align="start" className="sidebar__account-menu">
        <DropdownMenuItem asChild>
          <Link to={ACCOUNT_PATH} aria-current={accountActive ? 'page' : undefined} onClick={() => playSound('navigate')}>
            <UserRound aria-hidden="true" />{language === 'en' ? 'My account' : 'Mi cuenta'}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {confirming && <DropdownMenuItem onSelect={(event) => { event.preventDefault(); setConfirming(false); }}>
          {language === 'en' ? 'Cancel' : 'Cancelar'}
        </DropdownMenuItem>}
        <DropdownMenuItem variant="destructive" disabled={isLoading} onSelect={(event) => {
          event.preventDefault();
          if (!confirming) {
            playSound('attention');
            setConfirming(true);
          } else {
            void handleSignOut();
          }
        }}>
          <LogOut aria-hidden="true" />
          {isLoading ? (language === 'en' ? 'Signing out…' : 'Cerrando sesión…')
            : confirming ? (language === 'en' ? 'Confirm sign out' : 'Confirmar cierre de sesión')
              : (language === 'en' ? 'Sign out' : 'Cerrar sesión')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

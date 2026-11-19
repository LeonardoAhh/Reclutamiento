import { LogOut } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/DropdownMenu';
import type { Language } from '@/contexts/LanguageContext';
import { accountCopy } from '@/pages/account-translations';

interface SidebarAccountMenuFooterProps {
  language: Language;
  isSigningOut: boolean;
  onSignOut: () => void;
}

export function SidebarAccountMenuFooter({ language, isSigningOut, onSignOut }: SidebarAccountMenuFooterProps) {
  const copy = accountCopy(language);

  return (
    <div className="sidebar__account-menu-footer">
      <DropdownMenuItem
        className="sidebar__sign-out"
        variant="destructive"
        disabled={isSigningOut}
        aria-busy={isSigningOut}
        aria-label={isSigningOut ? (language === 'en' ? 'Signing out' : 'Cerrando sesión') : undefined}
        data-cuelume-tap=""
        onSelect={onSignOut}
      >
        <LogOut aria-hidden="true" />
        {isSigningOut ? (language === 'en' ? 'Signing out…' : 'Cerrando sesión…') : copy.signOut}
      </DropdownMenuItem>
    </div>
  );
}

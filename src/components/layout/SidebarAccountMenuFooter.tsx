import { ChevronRight, LogOut, Monitor, Moon, Sun, SunMoon } from 'lucide-react';
import {
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/DropdownMenu';
import type { Language } from '@/contexts/LanguageContext';
import { useTheme } from '@/hooks/useTheme';
import { playSound } from '@/lib/sound';
import { accountCopy } from '@/pages/account-translations';

interface SidebarAccountMenuFooterProps {
  language: Language;
  isSigningOut: boolean;
  onSignOut: () => void;
  showTheme: boolean;
}

export function SidebarAccountMenuFooter({
  language,
  isSigningOut,
  onSignOut,
  showTheme,
}: SidebarAccountMenuFooterProps) {
  const copy = accountCopy(language);
  const { preference, storageError, setPreference } = useTheme();
  const options = [
    { value: 'light', label: copy.lightTheme, Icon: Sun },
    { value: 'dark', label: copy.darkTheme, Icon: Moon },
    { value: 'system', label: copy.systemTheme, Icon: Monitor },
  ] as const;

  return (
    <div className="sidebar__account-menu-footer">
      {showTheme && (
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="sidebar__theme-trigger">
            <SunMoon aria-hidden="true" />
            <span>{copy.theme}</span>
            <ChevronRight className="sidebar__theme-chevron" aria-hidden="true" />
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="sidebar__theme-menu">
            <DropdownMenuRadioGroup
              className="sidebar__theme-options"
              aria-label={copy.theme}
              value={preference}
              onValueChange={(value) => {
                if (value !== 'light' && value !== 'dark' && value !== 'system') return;
                if (value === preference) return;
                setPreference(value);
                playSound('select');
              }}
            >
              {options.map(({ value, label, Icon }) => (
                <DropdownMenuRadioItem
                  key={value}
                  value={value}
                  className="sidebar__theme-option"
                  onSelect={(event) => event.preventDefault()}
                >
                  <Icon className="sidebar__theme-icon" aria-hidden="true" />
                  <span>{label}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      )}
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
      {showTheme && storageError && <output className="sidebar__theme-notice">{copy.preferenceStorageFailed}</output>}
    </div>
  );
}

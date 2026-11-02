import { useId } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/DropdownMenu';
import type { Language } from '@/contexts/LanguageContext';
import { useTheme } from '@/hooks/useTheme';
import { playSound } from '@/lib/sound';
import { accountCopy } from '@/pages/account-translations';

interface SidebarThemeFooterProps {
  language: Language;
}

export function SidebarThemeFooter({ language }: SidebarThemeFooterProps) {
  const labelId = useId();
  const copy = accountCopy(language);
  const { preference, storageError, setPreference } = useTheme();
  const options = [
    { value: 'light', label: copy.lightTheme, Icon: Sun },
    { value: 'dark', label: copy.darkTheme, Icon: Moon },
    { value: 'system', label: copy.systemTheme, Icon: Monitor },
  ] as const;

  return (
    <div className="sidebar__theme-footer">
      <DropdownMenuLabel id={labelId}>{copy.theme}</DropdownMenuLabel>
      <DropdownMenuRadioGroup
        className="sidebar__theme-options"
        aria-labelledby={labelId}
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
            aria-label={label}
            onSelect={(event) => event.preventDefault()}
          >
            <Icon className="sidebar__theme-icon" aria-hidden="true" />
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
      {storageError && <output className="sidebar__theme-notice">{copy.preferenceStorageFailed}</output>}
    </div>
  );
}

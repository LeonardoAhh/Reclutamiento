import { useThemeController } from '@/hooks/useTheme';

/** Mantiene sincronizado el tema global incluso cuando sus controles no están montados. */
export function ThemeController() {
  useThemeController();
  return null;
}

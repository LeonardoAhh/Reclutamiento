export const LAYOUT_BREAKPOINTS = {
  mobileNarrow: 375,
  mobile: 600,
  tablet: 768,
  desktop: 1080,
  desktopWide: 1280,
  wide: 1440,
} as const;

export const DESKTOP_MEDIA_QUERY = `(min-width: ${LAYOUT_BREAKPOINTS.desktop}px)`;

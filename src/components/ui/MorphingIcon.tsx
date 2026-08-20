import { MorphIcon, type IconInput, type MorphIconProps } from 'morphicons/react';

interface MorphingIconProps
  extends Omit<MorphIconProps, 'icon' | 'from' | 'to' | 'progress' | 'label'> {
  icon: IconInput;
  label?: string;
}

/**
 * Ícono de estado compartido. Centraliza Morphicons para que los controles
 * interactivos conserven la misma física, accesibilidad y API visual. Por
 * defecto honra `prefers-reduced-motion` mediante la política nativa `user`.
 */
export function MorphingIcon({
  icon,
  label,
  spring = 'snappy',
  ...svgProps
}: MorphingIconProps) {
  return (
    <MorphIcon
      icon={icon}
      label={label}
      spring={spring}
      {...svgProps}
    />
  );
}

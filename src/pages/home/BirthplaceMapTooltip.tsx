import { Tooltip } from '@/components/ui/Tooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import type { BirthplaceMapTooltipData } from './useBirthplaceMapTooltip';
import './BirthplaceMapTooltip.css';

type BirthplaceMapTooltipProps = {
  data: BirthplaceMapTooltipData | null;
  onClose: () => void;
};

export function BirthplaceMapTooltip({ data, onClose }: BirthplaceMapTooltipProps) {
  const { language } = useLanguage();
  const en = language === 'en';
  if (!data) return null;

  return (
    <Tooltip
      open
      onOpenChange={open => { if (!open) onClose(); }}
      content={
        <div className="birthplace-tooltip">
          <strong className="birthplace-tooltip__title">{data.name}</strong>
          {data.count === undefined ? (
            <span className="birthplace-tooltip__label">{en ? 'No records' : 'Sin registros'}</span>
          ) : (
            <div className="birthplace-tooltip__metric">
              <strong className="birthplace-tooltip__count">{data.count}</strong>
              <span className="birthplace-tooltip__label">{en ? 'Employees' : 'Colaboradores'}</span>
            </div>
          )}
        </div>
      }
    >
      <span className="birthplace-tooltip__anchor" style={{ left: data.x, top: data.y }} aria-hidden="true" />
    </Tooltip>
  );
}

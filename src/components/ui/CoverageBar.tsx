import './CoverageBar.css';

interface CoverageBarProps {
  percentage: number;
  color: string;
  height?: number;
  showLabel?: boolean;
}

export function CoverageBar({
  percentage,
  color,
  height = 8,
  showLabel = true,
}: CoverageBarProps) {
  const clampedPct = Math.min(Math.max(percentage, 0), 100);

  return (
    <div className="coverage-bar">
      {showLabel && (
        <span className="coverage-bar__label" style={{ color }}>
          {clampedPct}%
        </span>
      )}
      <div
        className="coverage-bar__track"
        style={{ height }}
      >
        <div
          className="coverage-bar__fill"
          style={{
            width: `${clampedPct}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

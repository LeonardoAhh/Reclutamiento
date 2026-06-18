import ReporteDiarioContent from '@/components/reporte-diario';

export function ReporteDiario() {
  return (
    <div
      className="
        container
        py-[var(--spacing-xl)]
        md:py-[var(--spacing-xxl)]
        lg:py-[var(--spacing-section)]
        animate-in fade-in slide-in-from-bottom-4 duration-500
        motion-reduce:animate-none
      "
    >
      <ReporteDiarioContent />
    </div>
  );
}

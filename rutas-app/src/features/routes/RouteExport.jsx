import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RouteExport({ ruta }) {
  const cardRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    if (!cardRef.current || busy) return;
    setBusy(true);
    try {
      await document.fonts.ready;
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: '#fdfcfc',
      });
      const link = document.createElement('a');
      const fecha = new Date().toISOString().slice(0, 10);
      link.download = `Horarios-${ruta.id}-${fecha}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('No se pudo generar la imagen', err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleExport}
        disabled={busy}
        data-testid="export-png-button"
        className="shrink-0"
      >
        {busy ? <Loader2 className="animate-spin" /> : <Download />}
        {busy ? 'Generando…' : 'Descargar imagen'}
      </Button>

      {/* Off-screen high-resolution capture target (full route, fixed width) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -left-[10000px] top-0"
      >
        <div
          ref={cardRef}
          className="w-[1100px] bg-surface p-12 font-sans text-ink"
        >
          <div className="mb-6 flex items-end justify-between border-b-2 border-ink pb-4">
            <p className="text-[32px] font-bold tracking-tight">
              VIÑO<span className="text-brand">PLASTIC</span>
            </p>
            <p className="text-[28px] font-extrabold italic leading-none">
              utep<sup className="align-super text-[14px] not-italic">®</sup>
            </p>
          </div>

          <h2 className="rounded-lg bg-secondary px-4 py-3 text-center text-[18px] font-bold tracking-tight text-white">
            {ruta.nombre}
          </h2>

          <table className="mt-6 w-full border-collapse text-[15px]">
            <thead>
              <tr className="bg-surface-card text-ink">
                <th className="w-12 border border-hairline px-2 py-2">No.</th>
                <th className="border border-hairline px-3 py-2 text-left">Colonia</th>
                <th className="border border-hairline px-3 py-2 text-left">Referencia</th>
                <th
                  colSpan={ruta.turnos.length}
                  className="border border-hairline px-2 py-2 text-center"
                >
                  Horario
                </th>
              </tr>
              <tr className="border-b border-hairline bg-surface-soft">
                <th
                  colSpan={3}
                  className="border border-hairline px-3 py-1.5 text-left text-[13px] uppercase"
                >
                  Parada
                </th>
                {ruta.turnos.map((turno, i) => (
                  <th key={i} className="border border-hairline px-3 py-1.5 text-center font-bold">
                    {turno}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ruta.paradas.map((p, idx) => (
                <tr key={p.no} className={idx % 2 === 0 ? 'bg-surface' : 'bg-surface-soft'}>
                  <th className="border border-hairline px-2 py-2 text-center font-bold">
                    {p.no}
                  </th>
                  <td className="whitespace-nowrap border border-hairline px-3 py-2 text-left font-semibold">
                    {p.colonia}
                  </td>
                  <td className="border border-hairline px-3 py-2 text-left text-body">
                    {p.referencia}
                  </td>
                  {p.horarios.map((h, i) => (
                    <td key={i} className="border border-hairline px-3 py-2 text-center tabular-nums">
                      {h}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <p className="mt-4 text-right text-[12px] text-mute">
            © {new Date().getFullYear()} VIÑOPLASTIC · Transporte de personal
          </p>
        </div>
      </div>
    </>
  );
}

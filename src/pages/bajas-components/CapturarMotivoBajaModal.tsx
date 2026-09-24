import { useId, useState, type FormEvent } from 'react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Modal } from '@/components/ui/Modal';
import { BAJA_REASON_CATALOG, toBajaSentenceCase } from '@/lib/bajaReasonCatalog';
import { parseBajaReasonRecord, type BajaReasonUpdate } from '@/lib/bajaReasonUpdates';
import { maskDdMmYyyyInput, parseDdMmYyyy } from '@/lib/dates';
import { toast } from '@/lib/notify';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  existingEmployees: ReadonlySet<string>;
  onCreate: (record: BajaReasonUpdate) => Promise<{ ok: true } | { ok: false; message: string }>;
}

export function CapturarMotivoBajaModal({ isOpen, onClose, existingEmployees, onCreate }: Props) {
  const id = useId();
  const [employee, setEmployee] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState('');
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [employeeError, setEmployeeError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);
  const reasons = Object.entries(BAJA_REASON_CATALOG).find(([key]) => key === type)?.[1] ?? [];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setError(null);
    setEmployeeError(null);
    setDateError(null);

    if (!/^\d{1,4}$/.test(employee)) {
      setEmployeeError('Escribe un número de empleado de hasta 4 dígitos.');
      return;
    }

    const isoDate = parseDdMmYyyy(date);
    if (!isoDate) {
      setDateError('Escribe una fecha válida en formato DD/MM/AAAA.');
      return;
    }

    const parsed = parseBajaReasonRecord({
      numero_empleado: employee,
      fecha_baja: isoDate,
      tipo_baja: type,
      motivo_baja: reason,
      detalle_baja: detail.trim() ? toBajaSentenceCase(detail) : '-',
    });
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }
    if (existingEmployees.has(parsed.record.num_empleado)) {
      setError('Este número de empleado ya está en el indicador. No se modificó su registro.');
      return;
    }

    setSaving(true);
    try {
      const result = await onCreate(parsed.record);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setEmployee('');
      setDate('');
      setType('');
      setReason('');
      setDetail('');
      toast.success({ title: 'Motivo agregado al indicador' });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title="Registrar baja"
      size="md"
      onClose={() => { if (!saving) onClose(); }}
      footerActions={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="submit" className="btn-primary" form={`${id}-form`} disabled={saving} aria-busy={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </>
      }
    >
      <form id={`${id}-form`} className="modal-body motivos-baja__capture-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <div className="form-group">
          <label htmlFor={`${id}-employee`}>No. empleado</label>
          <input
            id={`${id}-employee`}
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={employee}
            onChange={(event) => {
              setEmployee(event.target.value.replace(/\D/g, '').slice(0, 4));
              setEmployeeError(null);
            }}
            aria-invalid={Boolean(employeeError) || undefined}
            aria-describedby={employeeError ? `${id}-employee-error` : undefined}
            required
            autoComplete="off"
          />
          {employeeError && <p id={`${id}-employee-error`} className="form-error-text" role="alert">{employeeError}</p>}
        </div>
        <div className="form-group">
          <label htmlFor={`${id}-date`}>Fecha de baja</label>
          <input
            id={`${id}-date`}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="DD/MM/AAAA"
            maxLength={10}
            value={date}
            onChange={(event) => { setDate(maskDdMmYyyyInput(event.target.value)); setDateError(null); }}
            aria-invalid={Boolean(dateError) || undefined}
            aria-describedby={dateError ? `${id}-date-error` : undefined}
            required
          />
          {dateError && <p id={`${id}-date-error`} className="form-error-text" role="alert">{dateError}</p>}
        </div>
        <div className="form-group">
          <label htmlFor={`${id}-type`}>Tipo de baja</label>
          <CustomSelect
            id={`${id}-type`}
            value={type}
            onChange={(value) => { setType(value); setReason(''); }}
            options={Object.keys(BAJA_REASON_CATALOG).map((value) => ({ value, label: toBajaSentenceCase(value) }))}
            placeholder="Seleccionar tipo"
            aria-required="true"
          />
        </div>
        <div className="form-group">
          <label htmlFor={`${id}-reason`}>Motivo de baja</label>
          <CustomSelect
            id={`${id}-reason`}
            value={reason}
            onChange={setReason}
            options={reasons.map((value) => ({ value, label: toBajaSentenceCase(value) }))}
            placeholder="Seleccionar motivo"
            disabled={!type}
            aria-required="true"
          />
        </div>
        <div className="form-group motivos-baja__capture-detail">
          <label htmlFor={`${id}-detail`}>Detalle de la baja</label>
          <textarea id={`${id}-detail`} value={detail} onChange={(event) => setDetail(event.target.value)} />
        </div>
        {error && <p className="form-error-text motivos-baja__capture-error" role="alert">{error}</p>}
      </form>
    </Modal>
  );
}

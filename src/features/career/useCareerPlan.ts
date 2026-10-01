import { useEffect, useState } from 'react';
import { emptyCareerPlan } from './types';
import type { CareerPlan } from './types';
import { readCareerPlan, writeCareerPlan } from './storage';
import type { PlanRead } from './storage';

function load(userId: string): PlanRead {
  try { return readCareerPlan(userId, window.localStorage); }
  catch { return { ok: false, message: 'El navegador no permite consultar tus metas. Habilita el almacenamiento local y vuelve a intentar.' }; }
}
/** El workspace se monta con key=userId para evitar compartir borradores entre cuentas. */
export function useCareerPlan(userId: string, currentPosition: string) {
  const [initial] = useState(() => load(userId));
  const [baseline, setBaseline] = useState<CareerPlan>(() =>
    initial.ok && initial.plan ? initial.plan : emptyCareerPlan(currentPosition));
  const [draft, setDraft] = useState(baseline);
  const [revision, setRevision] = useState(initial.ok ? initial.revision : null);
  const [readError, setReadError] = useState(initial.ok ? '' : initial.message);
  const [saveError, setSaveError] = useState('');
  const [message, setMessage] = useState('');
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);

  useEffect(() => {
    if (!dirty) return;
    const preventLeave = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', preventLeave);
    return () => window.removeEventListener('beforeunload', preventLeave);
  }, [dirty]);

  function reload() {
    const result = load(userId);
    if (!result.ok) { setReadError(result.message); return; }
    const plan = result.plan ?? emptyCareerPlan(currentPosition);
    setBaseline(plan); setDraft(plan); setRevision(result.revision);
    setReadError(''); setSaveError(''); setMessage('Metas guardadas cargadas.');
  }
  function save(nextPlan: CareerPlan = draft) {
    if (readError) return false;
    setDraft(nextPlan); setMessage('');
    try {
      const result = writeCareerPlan(userId, nextPlan, revision, window.localStorage);
      if (!result.ok) { setSaveError(result.message); return false; }
      setRevision(result.revision); setBaseline(nextPlan); setSaveError('');
      setMessage('Tus metas se guardaron en este navegador.');
      return true;
    } catch {
      setSaveError('El navegador no permite guardar tus metas. Tu texto sigue aquí.');
      return false;
    }
  }
  return { draft, dirty, readError, saveError, message, reload, save };
}

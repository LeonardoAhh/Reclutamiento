import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { ClipboardCheck, LayoutDashboard, Settings2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useBajas } from '@/hooks/useBajas';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { fetchProfileGeneralData, type ProfileGeneralData } from '@/features/profile-general/api';
import { ProfileEvaluationPanel } from '@/features/profile-general/ProfileEvaluationPanel';
import { ProfileSummary } from '@/features/profile-general/ProfileSummary';
import { ProfileTemplateManager } from '@/features/profile-general/ProfileTemplateManager';
import { buildEligibleProfileEmployees } from '@/features/profile-general/types';
import './ProfileGeneral.css';

const INITIAL_CYCLE_START = '2026-06-01';
const INITIAL_CYCLE_END = '2026-11-30';

export function ProfileGeneral() {
  const { profile } = useAuth();
  const { employees, loading: employeesLoading } = useSupabaseData();
  const { bajas, loading: bajasLoading } = useBajas();
  const [data, setData] = useState<ProfileGeneralData>({ cycles: [], templates: [], evaluations: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await fetchProfileGeneralData());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos cargar Perfil General.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const cycle = data.cycles.find((item) => (
    item.starts_on === INITIAL_CYCLE_START && item.ends_on === INITIAL_CYCLE_END
  )) ?? null;
  const eligibleEmployees = useMemo(
    () => buildEligibleProfileEmployees(employees, bajas, cycle),
    [employees, bajas, cycle],
  );
  const isAdmin = profile?.role === 'admin';
  const hasAccess = isAdmin || profile?.role === 'reclutador';

  if (!hasAccess) {
    return (
      <main className="profile-general container">
        <header className="page-header"><div className="page-header__content"><h1 className="page-title">Perfil General</h1></div></header>
        <section className="card profile-general__notice" role="alert">
          <h2>Acceso no disponible</h2>
          <p>Esta función está habilitada para Administrador y Reclutador.</p>
        </section>
      </main>
    );
  }

  const isLoading = loading || employeesLoading || bajasLoading;

  return (
    <main className="profile-general container" id="page-profile-general">
      <header className="page-header">
        <div className="page-header__content">
          <h1 className="page-title">Perfil General</h1>
          <p className="profile-general__subtitle">Alineación de contrataciones con el descriptivo de puesto.</p>
        </div>
      </header>

      {isLoading ? (
        <div className="card profile-general__loading" role="status" aria-live="polite">Cargando Perfil General…</div>
      ) : error ? (
        <section className="card profile-general__notice" role="alert">
          <h2>No pudimos cargar la información</h2>
          <p>{error}</p>
          <button type="button" className="btn-secondary" onClick={() => void loadData()}>Reintentar</button>
        </section>
      ) : !cycle ? (
        <section className="card profile-general__notice" role="alert">
          <h2>Falta configurar el ciclo inicial</h2>
          <p>Aplica la migración 029 para habilitar junio–noviembre de 2026.</p>
        </section>
      ) : (
        <Tabs.Root className="profile-general__tabs" defaultValue="capture">
          <Tabs.List className="profile-general__tab-list" aria-label="Vistas de Perfil General">
            <Tabs.Trigger className="profile-general__tab" value="capture"><ClipboardCheck size={16} aria-hidden="true" /> Captura</Tabs.Trigger>
            <Tabs.Trigger className="profile-general__tab" value="summary"><LayoutDashboard size={16} aria-hidden="true" /> Resumen</Tabs.Trigger>
            {isAdmin && <Tabs.Trigger className="profile-general__tab" value="templates"><Settings2 size={16} aria-hidden="true" /> Plantillas</Tabs.Trigger>}
          </Tabs.List>
          <Tabs.Content className="profile-general__tab-content" value="capture">
            <ProfileEvaluationPanel
              cycle={cycle}
              employees={eligibleEmployees}
              templates={data.templates}
              evaluations={data.evaluations}
              isAdmin={isAdmin}
              onSaved={loadData}
            />
          </Tabs.Content>
          <Tabs.Content className="profile-general__tab-content" value="summary">
            <ProfileSummary cycle={cycle} employees={eligibleEmployees} evaluations={data.evaluations} />
          </Tabs.Content>
          {isAdmin && (
            <Tabs.Content className="profile-general__tab-content" value="templates">
              <ProfileTemplateManager templates={data.templates} onSaved={loadData} />
            </Tabs.Content>
          )}
        </Tabs.Root>
      )}
    </main>
  );
}

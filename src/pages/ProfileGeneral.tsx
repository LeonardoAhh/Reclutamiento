import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeading } from '@/components/layout/PageHeading';
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { ClipboardCheck, LayoutDashboard, Settings2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useBajas } from '@/hooks/useBajas';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { fetchProfileGeneralData, type ProfileGeneralData } from '@/features/profile-general/api';
import { ProfileEvaluationPanel } from '@/features/profile-general/ProfileEvaluationPanel';
import { ProfileSummary } from '@/features/profile-general/ProfileSummary';
import { ProfileTemplateManager } from '@/features/profile-general/ProfileTemplateManager';
import { buildEligibleProfileEmployees } from '@/features/profile-general/types';
import { BoneyardSkeleton } from '@/components/ui/BoneyardSkeleton';
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
        <PageHeading className="app-page-title">Perfil General</PageHeading>
        <section className="card profile-general__notice" role="alert">
          <h2>Acceso no disponible</h2>
          <p>Esta función está habilitada para Administrador y Reclutador.</p>
        </section>
      </main>
    );
  }

  const isLoading = loading || employeesLoading || bajasLoading;

  return (
    <BoneyardSkeleton name="perfil-general-page" loading={isLoading} loadingLabel="Cargando Perfil General…">
      <main className="profile-general container" id="page-profile-general">
        <header className="page-header">
          <div className="page-header__content">
            <PageHeading className="app-page-title">Perfil General</PageHeading>
            <p className="profile-general__subtitle">Alineación de contrataciones con el descriptivo de puesto.</p>
          </div>
        </header>

        {error ? (
          <section className="card profile-general__notice" role="alert">
            <h2>No pudimos cargar la información</h2>
            <p>{error}</p>
            <button data-cuelume-tap="" type="button" className="btn-secondary" onClick={() => void loadData()}>Reintentar</button>
          </section>
        ) : !cycle ? (
          <section className="card profile-general__notice" role="alert">
            <h2>Falta configurar el ciclo inicial</h2>
            <p>Aplica la migración 029 para habilitar junio–noviembre de 2026.</p>
          </section>
        ) : (
          <TabsRoot className="profile-general__tabs" defaultValue="capture">
            <TabsList variant="segmented" className="profile-general__tab-list" aria-label="Vistas de Perfil General">
              <TabsTrigger className="profile-general__tab" value="capture"><ClipboardCheck size={16} aria-hidden="true" /> Captura</TabsTrigger>
              <TabsTrigger className="profile-general__tab" value="summary"><LayoutDashboard size={16} aria-hidden="true" /> Resumen</TabsTrigger>
              {isAdmin && <TabsTrigger className="profile-general__tab" value="templates"><Settings2 size={16} aria-hidden="true" /> Plantillas</TabsTrigger>}
            </TabsList>
            <TabsContent className="profile-general__tab-content" value="capture">
              <ProfileEvaluationPanel
                cycle={cycle}
                employees={eligibleEmployees}
                templates={data.templates}
                evaluations={data.evaluations}
                isAdmin={isAdmin}
                onSaved={loadData}
              />
            </TabsContent>
            <TabsContent className="profile-general__tab-content" value="summary">
              <ProfileSummary cycle={cycle} employees={eligibleEmployees} evaluations={data.evaluations} />
            </TabsContent>
            {isAdmin && (
              <TabsContent className="profile-general__tab-content" value="templates">
                <ProfileTemplateManager templates={data.templates} onSaved={loadData} />
              </TabsContent>
            )}
          </TabsRoot>
        )}
      </main>
    </BoneyardSkeleton>
  );
}

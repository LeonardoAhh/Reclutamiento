import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { ShieldAlert } from 'lucide-react';
import { sileo } from '@/lib/notify';
import './SistemaView.css';

export function SistemaView() {
  const { user } = useAuth();
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);

  // Verificar si es el administrador autorizado
  const isAdmin = user?.email?.toLowerCase() === 'leonardo@reclutamiento.local';

  useEffect(() => {
    async function fetchConfig() {
      try {
        const { data, error } = await supabase
          .from('config')
          .select('maintenance_mode')
          .eq('id', 'main')
          .single();
        if (data && !error) {
          setIsMaintenance(data.maintenance_mode);
        }
      } catch (err) {
        console.warn('Error fetching config', err);
      } finally {
        setLoading(false);
      }
    }
    
    if (isAdmin) {
      fetchConfig();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const toggleMaintenance = async () => {
    const newValue = !isMaintenance;
    // Optimistic update
    setIsMaintenance(newValue);
    
    try {
      const { error } = await supabase
        .from('config')
        .update({ maintenance_mode: newValue })
        .eq('id', 'main');
        
      if (error) {
        throw error;
      }
      sileo.success({ title: `Mantenimiento ${newValue ? 'activado' : 'desactivado'}` });
    } catch (error) {
      // Revertir si falla
      setIsMaintenance(!newValue);
      sileo.error({ title: 'Error al cambiar el estado de mantenimiento' });
      console.error(error);
    }
  };

  if (!isAdmin) {
    return (
      <div className="view-container">
        <h2 className="type-heading-md">Sistema</h2>
        <p className="type-body-md text-muted mt-2">No tienes permisos para ver esta sección.</p>
      </div>
    );
  }

  return (
    <div className="view-container">
      <header className="view-header">
        <div>
          <h2 className="type-heading-md m-0">Sistema</h2>
          <p className="type-body-sm text-muted mt-1">
            Configuraciones globales del sistema.
          </p>
        </div>
      </header>

      <section className="sistema-view-section">
        <div className="sistema-icon-wrap">
          <ShieldAlert className="sistema-icon" size={20} />
        </div>
        <div className="sistema-content">
          <h3 className="type-heading-sm">Modo Mantenimiento</h3>
          <p className="type-body-md text-muted">
            Al activar esta opción, se bloqueará el acceso a la aplicación para todos los usuarios excepto tú (<code>leonardo@reclutamiento.local</code>). Usa esto antes de hacer un despliegue de nueva versión.
          </p>
          
          <button
            onClick={toggleMaintenance}
            disabled={loading}
            className={`type-button sistema-btn ${isMaintenance ? 'sistema-btn--active' : 'sistema-btn--inactive'}`}
          >
            {loading ? 'Cargando...' : isMaintenance ? 'Desactivar Mantenimiento' : 'Activar Mantenimiento'}
          </button>
        </div>
      </section>
    </div>
  );
}

import { useState, useMemo, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { RutaAgrupada } from '@/hooks/useRutas';
import './RutaEmployeesModal.css';

interface RutaEmployeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  ruta: RutaAgrupada | null;
}

export function RutaEmployeesModal({ isOpen, onClose, ruta }: RutaEmployeesModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string | null>(null);

  // Agrupamos a los empleados por turno para que sea más fácil visualizarlos
  const employeesByShift = useMemo(() => {
    if (!ruta) return {};
    
    const term = searchTerm.toLowerCase();
    const filtered = ruta.empleados.filter(
      emp => 
        emp.nombre.toLowerCase().includes(term) || 
        emp.numeroEmpleado.toLowerCase().includes(term)
    );

    const grouped: Record<string, typeof ruta.empleados> = {};
    for (const emp of filtered) {
      if (!grouped[emp.turno]) {
        grouped[emp.turno] = [];
      }
      grouped[emp.turno].push(emp);
    }
    return grouped;
  }, [ruta, searchTerm]);

  const availableTabs = useMemo(() => {
    const tabs = Object.keys(employeesByShift);
    // Ordenar tabs numéricamente: 1, 2, 3, 4, 5
    return tabs.sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.localeCompare(b);
    });
  }, [employeesByShift]);

  useEffect(() => {
    // Si el tab activo no existe en los disponibles (o es la primera carga), selecciona el primero
    if (availableTabs.length > 0 && (!activeTab || !availableTabs.includes(activeTab))) {
      setActiveTab(availableTabs[0]);
    } else if (availableTabs.length === 0) {
      setActiveTab(null);
    }
  }, [availableTabs, activeTab]);

  if (!ruta) return null;

  // Extraer solo el código de ruta (ejemplo: "R1- QUERETARO..." -> "R1")
  const routeCode = ruta.nombreRuta.split('-')[0].trim();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={routeCode}
      className="ruta-employees-modal"
    >
      <div className="ruta-employees-modal__content">
        <div className="ruta-employees-modal__search">
          <Search size={16} className="ruta-employees-modal__search-icon" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ruta-employees-modal__input"
          />
        </div>

        <div className="ruta-employees-modal__list">
          {availableTabs.length === 0 ? (
            <div className="rutas-empty-state">
              No se encontraron pasajeros que coincidan con la búsqueda.
            </div>
          ) : (
            <>
              <div className="ruta-employees-modal__tabs" role="tablist" aria-label="Turnos">
                {availableTabs.map((turno) => (
                  <button
                    key={turno}
                    role="tab"
                    type="button"
                    aria-selected={activeTab === turno}
                    aria-controls={`panel-turno-${turno}`}
                    id={`tab-turno-${turno}`}
                    className={`ruta-employees-modal__tab ${activeTab === turno ? 'ruta-employees-modal__tab--active' : ''}`}
                    onClick={() => setActiveTab(turno)}
                  >
                    T{turno}
                    <span className="ruta-employees-modal__tab-badge">
                      {employeesByShift[turno].length}
                    </span>
                  </button>
                ))}
              </div>

              {activeTab && employeesByShift[activeTab] && (
                <div 
                  className="ruta-employees-modal__tab-panel" 
                  role="tabpanel" 
                  id={`panel-turno-${activeTab}`} 
                  aria-labelledby={`tab-turno-${activeTab}`}
                >
                  <div className="ruta-employees-modal__table-wrapper">
                    <table className="ruta-employees-modal__table">
                      <thead>
                        <tr>
                          <th className="type-caption-md text-muted">ID</th>
                          <th className="type-caption-md text-muted">Nombre</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employeesByShift[activeTab].map(emp => (
                          <tr key={emp.numeroEmpleado}>
                            <td className="type-body-sm text-muted-soft">{emp.numeroEmpleado}</td>
                            <td className="type-body-sm text-ink font-medium">{emp.nombre}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

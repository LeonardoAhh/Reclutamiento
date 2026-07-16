import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Users } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { RutaAgrupada, EmpleadoRuta } from '@/hooks/useRutas';
import './RutaEmployeesModal.css';

interface RutaEmployeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  ruta: RutaAgrupada | null;
}

export function RutaEmployeesModal({ isOpen, onClose, ruta }: RutaEmployeesModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const tablistRef = useRef<HTMLDivElement>(null);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      const id = setTimeout(() => searchInputRef.current?.focus(), 80);
      return () => clearTimeout(id);
    }
  }, [isOpen]);

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) setSearchTerm('');
  }, [isOpen]);

  // Group employees by shift, applying search filter
  const employeesByShift = useMemo(() => {
    if (!ruta) return {};

    const term = searchTerm.toLowerCase();
    const filtered = ruta.empleados.filter(
      (emp) =>
        emp.nombre.toLowerCase().includes(term) ||
        emp.numeroEmpleado.toLowerCase().includes(term),
    );

    const grouped: Record<string, EmpleadoRuta[]> = {};
    for (const emp of filtered) {
      if (!grouped[emp.turno]) grouped[emp.turno] = [];
      grouped[emp.turno].push(emp);
    }

    // Sort employees alphabetically by name within each shift
    for (const turno in grouped) {
      grouped[turno].sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    return grouped;
  }, [ruta, searchTerm]);

  const availableTabs = useMemo(() => {
    return Object.keys(employeesByShift).sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [employeesByShift]);

  useEffect(() => {
    if (availableTabs.length > 0 && (!activeTab || !availableTabs.includes(activeTab))) {
      setActiveTab(availableTabs[0]);
    } else if (availableTabs.length === 0) {
      setActiveTab(null);
    }
  }, [availableTabs, activeTab]);

  // Keyboard navigation for tabs (← →)
  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (!tablistRef.current) return;
    const tabs = Array.from(
      tablistRef.current.querySelectorAll<HTMLElement>('[role="tab"]'),
    );
    if (tabs.length === 0) return;

    let next = index;
    if (e.key === 'ArrowRight') {
      next = (index + 1) % tabs.length;
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      next = (index - 1 + tabs.length) % tabs.length;
      e.preventDefault();
    }

    if (next !== index) {
      tabs[next].focus();
      tabs[next].click();
    }
  };

  // A-Z grouping for the active tab
  const activeEmployees = activeTab ? employeesByShift[activeTab] || [] : [];

  const groupedByLetter = useMemo(() => {
    const map = new Map<string, EmpleadoRuta[]>();
    for (const emp of activeEmployees) {
      const ch = emp.nombre.charAt(0).toUpperCase();
      const letter = /[A-Z]/.test(ch) ? ch : '#';
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(emp);
    }
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (a === '#') return 1;
      if (b === '#') return -1;
      return a.localeCompare(b);
    });
  }, [activeEmployees]);

  if (!ruta) return null;

  const routeCode = ruta.nombreRuta.split('-')[0].trim();
  const routeName = ruta.nombreRuta.replace(routeCode, '').replace(/^[\s-]+/, '').trim();
  const totalEmployees = ruta.empleados.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={routeCode}
      subtitle={`${routeName} — ${totalEmployees} empleado${totalEmployees !== 1 ? 's' : ''}`}
      className="ruta-employees-modal"
      fullscreenMobile
    >
      <div className="ruta-employees-modal__content">
        {/* ── Search ── */}
        <div className="ruta-employees-modal__search-container">
          <div className="ruta-employees-modal__search">
            <Search
              size={18}
              className="ruta-employees-modal__search-icon"
              aria-hidden="true"
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar por nombre o número…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ruta-employees-modal__input"
              aria-label="Buscar empleados"
            />
          </div>
          {/* Screen-reader live region */}
          <div aria-live="polite" className="sr-only">
            {searchTerm &&
              `Mostrando ${activeEmployees.length} resultado${activeEmployees.length !== 1 ? 's' : ''}`}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="ruta-employees-modal__list-area">
          {availableTabs.length === 0 ? (
            <div className="ruta-employees-modal__empty">
              <Users size={32} aria-hidden="true" style={{ color: 'var(--color-muted-soft)' }} />
              <p className="type-body-sm" style={{ color: 'var(--color-muted)' }}>
                No se encontraron empleados que coincidan con "{searchTerm}".
              </p>
            </div>
          ) : (
            <>
              {/* ── Tabs ── */}
              <div
                className="ruta-employees-modal__tabs"
                role="tablist"
                aria-label="Turnos disponibles"
                ref={tablistRef}
              >
                {availableTabs.map((turno, index) => {
                  const count = employeesByShift[turno].length;
                  return (
                    <button
                      key={turno}
                      role="tab"
                      type="button"
                      aria-selected={activeTab === turno}
                      aria-controls={`panel-turno-${turno}`}
                      id={`tab-turno-${turno}`}
                      tabIndex={activeTab === turno ? 0 : -1}
                      className={`ruta-employees-modal__tab${activeTab === turno ? ' ruta-employees-modal__tab--active' : ''}`}
                      onClick={() => setActiveTab(turno)}
                      onKeyDown={(e) => handleTabKeyDown(e, index)}
                    >
                      T{turno}
                      <span
                        className="ruta-employees-modal__tab-badge"
                        aria-label={`${count} empleados`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* ── Panel ── */}
              {activeTab && (
                <div
                  className="ruta-employees-modal__tab-panel"
                  role="tabpanel"
                  id={`panel-turno-${activeTab}`}
                  aria-labelledby={`tab-turno-${activeTab}`}
                  tabIndex={0}
                >
                  {/* Context bar */}
                  <div className="ruta-employees-modal__panel-header">
                    <span className="type-body-sm text-muted">
                      Turno {activeTab} · {activeEmployees.length} empleado
                      {activeEmployees.length !== 1 ? 's' : ''}
                    </span>
                    {ruta.maxCapacityPerShift[activeTab] != null && (
                      <span
                        className={`ruta-employees-modal__capacity-badge${
                          activeEmployees.length > ruta.maxCapacityPerShift[activeTab]
                            ? ' ruta-employees-modal__capacity-badge--over'
                            : ''
                        }`}
                      >
                        {activeEmployees.length} / {ruta.maxCapacityPerShift[activeTab]} cap.
                      </span>
                    )}
                  </div>

                  {/* Scrollable employee list */}
                  <div className="ruta-employees-modal__scroll-area">
                    <ul className="ruta-employees-modal__employee-list">
                      {groupedByLetter.map(([letter, employees]) => (
                        <li key={letter} className="ruta-employees-modal__letter-group">
                          <div
                            className="ruta-employees-modal__letter-header"
                            role="separator"
                            aria-label={`Letra ${letter}`}
                          >
                            <span>{letter}</span>
                          </div>
                          <ul className="ruta-employees-modal__group-items">
                            {employees.map((emp) => (
                              <li
                                key={emp.numeroEmpleado}
                                className="ruta-employees-modal__employee-card"
                              >
                                <span className="ruta-employees-modal__emp-id">
                                  {emp.numeroEmpleado}
                                </span>
                                <span className="ruta-employees-modal__emp-name">
                                  {emp.nombre}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
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

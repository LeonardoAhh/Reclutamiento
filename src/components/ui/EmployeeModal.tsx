import { useState, useEffect } from 'react';
import { X, UserPlus, Trash2, AlertCircle } from 'lucide-react';
import type { Employee } from '@/lib/types';
import { PLANTILLA_AUTORIZADA } from '@/lib/constants';
import './EmployeeModal.css';

interface EmployeeModalProps {
  isOpen: boolean;
  mode: 'add' | 'delete';
  employee?: Employee | null;
  onClose: () => void;
  onSave?: (emp: Employee) => void;
  onDelete?: (num_empleado: string) => void;
}

export function EmployeeModal({ isOpen, mode, employee, onClose, onSave, onDelete }: EmployeeModalProps) {
  const [formData, setFormData] = useState<Partial<Employee>>({
    num_empleado: '',
    nombre: '',
    area: '',
    seccion: '',
    puesto: '',
    categoria: 'N/A',
    turno: '1',
    fecha_ingreso: new Date().toLocaleDateString('es-MX'),
  });

  // Extract unique areas and their sections/puestos from constants
  const areas = Array.from(new Set(PLANTILLA_AUTORIZADA.map(p => p.area)));
  
  const sectionsForArea = Array.from(
    new Set(PLANTILLA_AUTORIZADA.filter(p => p.area === formData.area).map(p => p.seccion))
  );

  const puestosForSection = Array.from(
    new Set(PLANTILLA_AUTORIZADA.filter(p => p.area === formData.area && p.seccion === formData.seccion).map(p => p.puesto))
  );

  useEffect(() => {
    if (employee && mode === 'delete') {
      setFormData(employee);
    } else if (mode === 'add') {
      setFormData({
        num_empleado: '',
        nombre: '',
        area: areas[0] || '',
        seccion: '',
        puesto: '',
        categoria: 'N/A',
        turno: '1',
        fecha_ingreso: new Date().toLocaleDateString('es-MX'),
      });
    }
  }, [isOpen, mode, employee]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'add' && onSave) {
      onSave(formData as Employee);
    } else if (mode === 'delete' && onDelete && formData.num_empleado) {
      onDelete(formData.num_empleado);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content employee-modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div className="modal-title">
            {mode === 'add' ? <UserPlus size={20} /> : <Trash2 size={20} className="color-error" />}
            <h2>{mode === 'add' ? 'Nuevo Empleado' : 'Eliminar Empleado'}</h2>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="modal-body">
          {mode === 'delete' ? (
            <div className="delete-warning">
              <AlertCircle size={48} className="color-error" />
              <p>¿Estás seguro de que deseas eliminar a <strong>{formData.nombre}</strong>?</p>
              <p className="delete-meta">Num. Empleado: {formData.num_empleado} | {formData.puesto}</p>
              <p className="delete-sub">Esta acción no se puede deshacer.</p>
            </div>
          ) : (
            <div className="form-grid">
              <div className="form-group">
                <label>Número de Empleado</label>
                <input
                  type="text"
                  required
                  value={formData.num_empleado}
                  onChange={(e) => setFormData({ ...formData, num_empleado: e.target.value })}
                  placeholder="Ej: 1234"
                />
              </div>
              <div className="form-group">
                <label>Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
                  placeholder="APELLIDOS NOMBRE"
                />
              </div>
              <div className="form-group">
                <label>Área</label>
                <select
                  required
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value, seccion: '', puesto: '' })}
                >
                  <option value="">Seleccione Área...</option>
                  {areas.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Sección</label>
                <select
                  required
                  value={formData.seccion}
                  onChange={(e) => setFormData({ ...formData, seccion: e.target.value, puesto: '' })}
                  disabled={!formData.area}
                >
                  <option value="">Seleccione Sección...</option>
                  {sectionsForArea.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Puesto</label>
                <select
                  required
                  value={formData.puesto}
                  onChange={(e) => setFormData({ ...formData, puesto: e.target.value })}
                  disabled={!formData.seccion}
                >
                  <option value="">Seleccione Puesto...</option>
                  {puestosForSection.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Turno</label>
                <select
                  value={formData.turno}
                  onChange={(e) => setFormData({ ...formData, turno: e.target.value })}
                >
                  <option value="0">Administrativo (0)</option>
                  <option value="1">1er Turno</option>
                  <option value="2">2do Turno</option>
                  <option value="3">3er Turno</option>
                  <option value="4">4to Turno</option>
                  <option value="5">5to Turno</option>
                </select>
              </div>
            </div>
          )}

          <footer className="modal-footer">
            <button type="button" className="btn-text" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={mode === 'add' ? 'btn-primary' : 'btn-primary btn-danger'}>
              {mode === 'add' ? 'Guardar Empleado' : 'Eliminar'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

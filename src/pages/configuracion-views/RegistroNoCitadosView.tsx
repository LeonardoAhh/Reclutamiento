import { useState, useMemo, useEffect } from 'react';
import { UserX, Save, ChevronLeft, ChevronRight, Plus, UserPlus, Trash2, MessageSquare, MessageSquareDashed, CheckCircle2, XCircle, Inbox, FileSpreadsheet, Filter, AlertTriangle } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { AnimatedSubmitButton } from '@/components/ui/AnimatedSubmitButton';
import { Modal } from '@/components/ui/Modal';
import { Checkbox } from '@/components/ui/Checkbox';
import { Tooltip } from '@/components/ui/Tooltip';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/Popover';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { RECLUTADORES_ACTIVOS } from '@/lib/constants';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useCandidates } from '@/hooks/useCandidates';

import { usePositions } from '@/lib/positions';
import { NoCitadosChart } from './NoCitadosChart';
import { NoCitadoRowActions } from '@/components/ui/NoCitadoRowActions';
import { ReclutadorBadge } from '@/components/ui/Badge';
import { type NoCitado, CANDIDATE_SOURCES } from '@/lib/types';
import './NoCitados.css';

const MOTIVOS_OPTIONS = [
  { value: 'no_contesta', label: 'No contesta' },
  { value: 'ya_trabaja', label: 'Ya está trabajando' },
  { value: 'distancia', label: 'Le queda lejos / Sin transporte' },
  { value: 'sueldo', label: 'Sueldo no convence' },
  { value: 'horario', label: 'Sin turno disponible' },
  { value: 'otro', label: 'Otro motivo' },
];

const SUB_MOTIVOS_OPTIONS: Record<string, Array<{ value: string; label: string }>> = {
  no_contesta: [
    { value: 'brindo_informacion', label: 'Se le brindó información' }
  ],
  distancia: [
    { value: 'r1', label: 'R1 - Querétaro - Pie de la Cuesta' },
    { value: 'r2', label: 'R2 - San José Iturbide' },
    { value: 'r3', label: 'R3 - San José Iturbide 2' },
    { value: 'r4', label: 'R4 - Santa Rosa' },
    { value: 'r5', label: 'R5 - Querétaro - Av. de la Luz' },
    { value: 'r6', label: 'R6 - Av. de la Luz - Paseos Querétaro' },
    { value: 'otra_zona', label: 'Fuera de zona / Otra' }
  ],
  horario: [
    { value: 'turno_1', label: 'Turno 1' },
    { value: 'turno_2', label: 'Turno 2' },
    { value: 'turno_3', label: 'Turno 3' },
    { value: 'turno_4', label: 'Turno 4' },
    { value: 'mixto', label: 'Mixto' }
  ]
};

const RECLUTADORES_OPTIONS = RECLUTADORES_ACTIVOS.map((r) => ({
  value: r,
  label: r.charAt(0) + r.slice(1).toLowerCase(),
}));

const FUENTES_OPTIONS = CANDIDATE_SOURCES.map((s) => ({
  value: s,
  label: s,
}));

export function RegistroNoCitadosView() {
  const ITEMS_PER_PAGE = 5;

  const { noCitados: records, addNoCitado, updateNoCitado, deleteNoCitado, loading } = useSupabaseData();
  const { candidates } = useCandidates();
  const { positions } = usePositions();

  const PUESTOS_OPTIONS = useMemo(() => {
    const unique = Array.from(new Set(positions.map((p) => p.puesto))).sort();
    return unique.map((p) => ({ value: p, label: p }));
  }, [positions]);
  
  const formatName = (nombre: string, apellido: string) => {
    const formatWord = (w: string) => w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : '';
    const first = nombre?.split(' ').map(formatWord).join(' ') || '';
    const last = apellido?.split(' ').map(formatWord).join(' ') || '';
    return `${first} ${last}`.trim();
  };

  const formatTitle = (title: string | null | undefined) => {
    if (!title) return '';
    return title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [keepOpen, setKeepOpen] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    motivo: '',
    subMotivo: '',
    reclutador: '',
    fuente: '',
    puesto: '',
    notas: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [filterDate, setFilterDate] = useState('');
  const [filterReclutador, setFilterReclutador] = useState('');

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchDate = filterDate ? r.fecha === filterDate : true;
      const matchRec = filterReclutador ? r.reclutador === filterReclutador : true;
      return matchDate && matchRec;
    });
  }, [records, filterDate, filterReclutador]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterDate, filterReclutador]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / ITEMS_PER_PAGE));
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.motivo) {
      setErrorMsg('Por favor selecciona un motivo');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    if (!formData.reclutador) {
      setErrorMsg('Por favor selecciona un reclutador');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    setStatus('loading');

    let result;
    if (editingId) {
      result = await updateNoCitado(editingId, {
        nombre: formData.nombre,
        apellido: formData.apellido,
        telefono: formData.telefono,
        motivo: formData.motivo,
        sub_motivo: formData.subMotivo || null,
        reclutador: formData.reclutador,
        fuente: formData.fuente || null,
        puesto: formData.puesto || null,
        notas: formData.notas || null,
      });
    } else {
      result = await addNoCitado({
        nombre: formData.nombre,
        apellido: formData.apellido,
        telefono: formData.telefono,
        motivo: formData.motivo,
        sub_motivo: formData.subMotivo || null,
        reclutador: formData.reclutador,
        fuente: formData.fuente || null,
        puesto: formData.puesto || null,
        notas: formData.notas || null,
        fecha: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      });
    }

    if (result.ok) {
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setFormData({ nombre: '', apellido: '', telefono: '', motivo: '', subMotivo: '', reclutador: '', fuente: '', puesto: '', notas: '' });
        setEditingId(null);
        if (!keepOpen) {
          setIsModalOpen(false); // Close modal on success
        } else {
          // Focus the first input (nombre)
          setTimeout(() => document.getElementById('nombre')?.focus(), 100);
        }
      }, 1500);
    } else {
      setStatus('idle');
      setErrorMsg(result.message || 'Ocurrió un error');
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => {
      // Allow only numbers in phone field and max 10 digits
      if (field === 'telefono') {
        const onlyNums = value.replace(/[^0-9]/g, '');
        if (onlyNums.length > 10) return prev; // Limit to 10 digits
        return { ...prev, [field]: onlyNums };
      }

      // Auto-capitalize first letter of each word for nombre and apellido
      if (field === 'nombre' || field === 'apellido') {
        const capitalized = value
          .split(' ')
          .map(word => word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : '')
          .join(' ');
        return { ...prev, [field]: capitalized };
      }

      if (field === 'motivo') {
        return { ...prev, motivo: value, subMotivo: '' };
      }
      return { ...prev, [field]: value };
    });
  };

  const isPhoneValid = formData.telefono.length === 10;
  const showPhoneError = formData.telefono.length > 0 && !isPhoneValid;

  const duplicateInNoCitados = useMemo(() => {
    if (!isPhoneValid) return null;
    return records.find(r => r.telefono === formData.telefono && r.id !== editingId);
  }, [formData.telefono, records, editingId, isPhoneValid]);

  const duplicateInPipeline = useMemo(() => {
    if (!isPhoneValid) return null;
    return candidates.find(c => {
      const cleanPhone = String(c.telefono || '').replace(/\D/g, '');
      return cleanPhone === formData.telefono;
    });
  }, [formData.telefono, candidates, isPhoneValid]);

  const missingRequiredFields = [
    (!formData.nombre.trim() || formData.nombre.trim().length < 2) && 'Nombre (min. 2 letras)',
    !isPhoneValid && 'Teléfono (10 dígitos)',
    !formData.motivo && 'Motivo principal',
    (formData.motivo && SUB_MOTIVOS_OPTIONS[formData.motivo]?.length > 0 && !formData.subMotivo) && 'Detalle del motivo',
    !formData.reclutador && 'Reclutador',
    !formData.fuente && 'Fuente'
  ].filter(Boolean) as string[];

  const isFormValid = missingRequiredFields.length === 0;

  const handlePrevPage = () => {
    setCurrentPage((p) => Math.max(1, p - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((p) => Math.min(totalPages, p + 1));
  };



  const getReclutadorLabel = (val: string) => {
    return RECLUTADORES_OPTIONS.find(m => m.value === val)?.label || val;
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData({ nombre: '', apellido: '', telefono: '', motivo: '', subMotivo: '', reclutador: '', fuente: '', puesto: '', notas: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (record: NoCitado) => {
    setEditingId(record.id);
    setFormData({
      nombre: record.nombre,
      apellido: record.apellido,
      telefono: record.telefono,
      motivo: record.motivo,
      subMotivo: record.sub_motivo || '',
      reclutador: record.reclutador,
      fuente: record.fuente || '',
      puesto: record.puesto || '',
      notas: record.notas || '',
    });
    setIsModalOpen(true);
  };

  const requestDelete = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (deletingId) {
      const result = await deleteNoCitado(deletingId);
      if (result.ok) {
        // Adjust pagination if needed
        const remaining = records.length - 1;
        const totalPagesAfterDelete = Math.max(1, Math.ceil(remaining / ITEMS_PER_PAGE));
        if (currentPage > totalPagesAfterDelete) {
          setCurrentPage(totalPagesAfterDelete);
        }
        setDeletingId(null);
      } else {
        alert(result.message || 'Error al eliminar el registro');
      }
    }
  };

  return (
    <section className="no-citados-view config-page__content">
      <header className="config-page__header no-citados-header">
        <h2 className="config-page__title">
          <UserX size={24} className="text-primary" aria-hidden="true" />
          Registro de No Citados
        </h2>
        <button
          type="button"
          className="btn-primary"
          onClick={openNewModal}
        >
          <Plus size={16} aria-hidden="true" className="no-citados-icon-mr-xs" />
          Nuevo
        </button>
      </header>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Editar candidato" : "Registrar candidato"}
        icon={<UserPlus size={20} className="text-primary" />}
        footerActions={
          <div className="no-citados-modal-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
            <label htmlFor="keepOpenToggle" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', cursor: 'pointer', userSelect: 'none' }}>
              <Checkbox 
                id="keepOpenToggle"
                checked={keepOpen} 
                onChange={e => setKeepOpen(e.target.checked)} 
              />
              <span style={{ fontSize: 'var(--type-caption-sm-size)', color: 'var(--color-ink-muted)', fontWeight: 500 }}>
                Modo ráfaga
              </span>
            </label>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </button>
              <div>
              <AnimatedSubmitButton
                type="submit"
                form="form-no-citados"
                isSubmitting={status === 'loading'}
                isSuccess={status === 'success'}
                isError={!!errorMsg}
                errorText={errorMsg || undefined}
                idleText={(duplicateInNoCitados || duplicateInPipeline) ? "Forzar registro" : "Registrar"}
                loadingText="Guardando..."
                successText="Listo"
                idleIcon={Save}
                className="btn-primary"
                disabled={!isFormValid}
              />
            </div>
          </div>
        </div>
        }
      >
        <div className="modal-body">
          <form id="form-no-citados" onSubmit={handleSubmit} className="no-citados-form">
          <div className="form-group">
            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Ej. Juan"
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label htmlFor="apellido">Apellido</label>
            <input
              id="apellido"
              type="text"
              value={formData.apellido}
              onChange={(e) => handleChange('apellido', e.target.value)}
              placeholder="Ej. Pérez"
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label htmlFor="telefono">Teléfono</label>
            <div className="phone-input-wrapper">
              <input
                id="telefono"
                type="tel"
                value={formData.telefono}
                onChange={(e) => handleChange('telefono', e.target.value)}
                placeholder="Ej. 442 123 4567"
                required
                className={showPhoneError ? 'input-error' : ''}
                aria-describedby={showPhoneError ? "telefono-error" : undefined}
                aria-invalid={showPhoneError}
              />
              {isPhoneValid && !duplicateInNoCitados && !duplicateInPipeline && (
                <CheckCircle2 size={18} className="phone-validation-icon valid" />
              )}
              {showPhoneError && (
                <XCircle size={18} className="phone-validation-icon invalid" />
              )}
            </div>
            {showPhoneError && (
              <span id="telefono-error" className="no-citados-subtext" style={{ color: 'var(--color-accent-orange)', display: 'block', marginTop: 'var(--spacing-xxs)' }}>
                El teléfono debe tener 10 dígitos.
              </span>
            )}
            
            {/* Alertas de Duplicados */}
            {isPhoneValid && duplicateInNoCitados && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: 'var(--spacing-xs)', color: 'var(--color-accent-orange)', fontSize: 'var(--type-caption-sm-size)', fontWeight: 500 }}>
                <AlertTriangle size={14} />
                <span>Ya registrado ({duplicateInNoCitados.fecha})</span>
              </div>
            )}
            
            {isPhoneValid && !duplicateInNoCitados && duplicateInPipeline && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-xs)' }}>
                <span style={{ color: 'var(--color-primary)', fontSize: 'var(--type-caption-sm-size)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <UserPlus size={14} /> Candidato activo
                </span>
                <button 
                  type="button" 
                  style={{ background: 'none', border: 'none', color: 'var(--color-ink-muted)', textDecoration: 'underline', cursor: 'pointer', fontSize: 'var(--type-caption-sm-size)', padding: 0 }}
                  onClick={() => {
                    const [first, ...rest] = (duplicateInPipeline.nombre || '').split(' ');
                    setFormData(prev => ({
                      ...prev,
                      nombre: first || prev.nombre,
                      apellido: rest.join(' ') || prev.apellido,
                      reclutador: duplicateInPipeline.reclutador || prev.reclutador,
                      fuente: duplicateInPipeline.source || prev.fuente,
                      puesto: duplicateInPipeline.puesto || prev.puesto
                    }));
                  }}
                >
                  Autocompletar datos
                </button>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="motivo">Motivo principal</label>
            <CustomSelect
              id="motivo"
              value={formData.motivo}
              onChange={(val) => handleChange('motivo', val)}
              options={MOTIVOS_OPTIONS}
              placeholder="Selecciona un motivo..."
            />
          </div>

          {formData.motivo && SUB_MOTIVOS_OPTIONS[formData.motivo] && SUB_MOTIVOS_OPTIONS[formData.motivo].length > 0 && (
            <div className="form-group">
              <label htmlFor="subMotivo">Detalle del motivo</label>
              <CustomSelect
                id="subMotivo"
                value={formData.subMotivo}
                onChange={(val) => handleChange('subMotivo', val)}
                options={SUB_MOTIVOS_OPTIONS[formData.motivo]}
                placeholder="Selecciona el detalle..."
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="reclutador">Reclutador</label>
            <CustomSelect
              id="reclutador"
              value={formData.reclutador}
              onChange={(val) => handleChange('reclutador', val)}
              options={RECLUTADORES_OPTIONS}
              placeholder="Selecciona un reclutador..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="fuente">Fuente</label>
            <CustomSelect
              id="fuente"
              value={formData.fuente}
              onChange={(val) => handleChange('fuente', val)}
              options={FUENTES_OPTIONS}
              placeholder="Selecciona una fuente..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="puesto">Puesto</label>
            <CustomSelect
              id="puesto"
              value={formData.puesto}
              onChange={(val) => handleChange('puesto', val)}
              options={PUESTOS_OPTIONS}
              placeholder="Selecciona un puesto..."
              searchable
            />
          </div>

          <div className="form-group no-citados-form-full-width">
            <label htmlFor="notas">Notas / Comentarios</label>
            <textarea
              id="notas"
              value={formData.notas}
              onChange={(e) => handleChange('notas', e.target.value)}
              placeholder="Agrega comentarios adicionales..."
            />
          </div>
        </form>
        </div>
      </Modal>

      <Modal
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        title="Eliminar registro"
        icon={<Trash2 size={20} aria-hidden="true" />}
        fullscreenMobile={false}
      >
        <form
          onSubmit={(e) => { e.preventDefault(); confirmDelete(); }}
          className="modal-body"
          noValidate
        >
          <div className="delete-warning">
            <p className="delete-warning__title">
              ¿Eliminar a{' '}
              <span className="delete-warning__name">
                {records.find(r => r.id === deletingId)?.nombre}{' '}
                {records.find(r => r.id === deletingId)?.apellido}
              </span>?
            </p>
          </div>

          <footer className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setDeletingId(null)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-secondary"
            >
              <Trash2 size={16} className="no-citados-icon-mr-xxs" />
              Eliminar
            </button>
          </footer>
        </form>
      </Modal>

      <NoCitadosChart data={filteredRecords} />

      <div className="no-citados-table-container">
        <div className="no-citados-table-header">
          <h3 className="type-heading-3 m-0">
            Registros (<AnimatedNumber value={filteredRecords.length} />)
          </h3>
          <div className="no-citados-pagination">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="btn-secondary btn-icon no-citados-filter-trigger"
                  title="Filtrar"
                  aria-label="Filtrar"
                >
                  <Filter size={16} className="color-primary" />
                  {(filterDate || filterReclutador) && (
                    <span className="no-citados-filter-indicator"></span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="no-citados-filter-popover">
                <div className="no-citados-filter-content">
                  <div className="no-citados-filter-header">
                    <span className="type-body-sm no-citados-filter-title">Filtros</span>
                    {(filterDate || filterReclutador) && (
                      <button
                        className="btn-secondary btn-sm no-citados-btn-clear"
                        onClick={() => { setFilterDate(''); setFilterReclutador(''); }}
                      >
                        Limpiar
                      </button>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="no-citados-label-sm">Fecha de registro</label>
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="no-citados-label-sm">Reclutador</label>
                    <CustomSelect
                      id="filter-reclutador"
                      value={filterReclutador}
                      onChange={setFilterReclutador}
                      options={RECLUTADORES_OPTIONS}
                      placeholder="Todos"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <button
              type="button"
              className="btn-secondary btn-icon no-citados-export-btn"
              title="Exportar a Excel"
              aria-label="Exportar a Excel"
            >
              <FileSpreadsheet size={16} className="color-primary" />
            </button>

            <div className="no-citados-pagination-group">
              <button
                type="button"
                className="btn-secondary btn-icon"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                aria-label="Página anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="no-citados-pagination__label">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                className="btn-secondary btn-icon"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                aria-label="Página siguiente"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="animated-empty-state">
            <div className="animated-empty-state__icon">
              <Inbox aria-hidden="true" />
            </div>
            <div className="animated-empty-state__title">Aún no hay registros</div>
          </div>
        ) : (
          <>
            {/* Vista Móvil: Tarjetas apiladas */}
            <div className="no-citados-mobile-list">
              {paginatedRecords.map((r) => (
                <div key={r.id} className="no-citado-mobile-card">
                  <div className="no-citado-mobile-card__header">
                    <span className="no-citado-mobile-card__name">{formatName(r.nombre, r.apellido)}</span>
                  </div>
                  <div className="no-citado-mobile-card__meta">
                    <span className="no-citado-mobile-card__reclutador">
                      <ReclutadorBadge nombre={r.reclutador} />
                    </span>
                    {r.puesto && (
                      <span className="no-citado-mobile-card__puesto no-citados-subtext">
                        {formatTitle(r.puesto)}
                      </span>
                    )}
                    {r.fuente && (
                      <span className="no-citado-mobile-card__fuente no-citados-subtext no-citados-subtext--right">
                        {r.fuente}
                      </span>
                    )}
                  </div>
                  {r.notas && (
                    <div className="no-citado-mobile-card__notas" style={{ fontStyle: 'normal' }}>
                      <MessageSquare size={14} className="color-primary no-citados-icon-mt" />
                      <span className="no-citados-notas-text">{r.notas}</span>
                    </div>
                  )}
                  <div className="no-citado-mobile-card__actions">
                    <NoCitadoRowActions
                      noCitado={r}
                      onEdit={openEditModal}
                      onDelete={(n) => requestDelete(n.id)}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Vista Desktop: Tabla tradicional */}
            <table className="no-citados-desktop-table">
              <thead>
                <tr>
                  <th>Candidato</th>
                  <th>Reclutador</th>
                  <th>Puesto</th>
                  <th>Fuente</th>
                  <th>Notas</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRecords.map((r) => (
                  <tr key={r.id}>
                    <td>{formatName(r.nombre, r.apellido)}</td>
                    <td><ReclutadorBadge nombre={r.reclutador} /></td>
                    <td>{formatTitle(r.puesto) || '-'}</td>
                    <td>{r.fuente || '-'}</td>
                    <td className="td-notas">
                      {r.notas ? (
                        <Tooltip content={<div className="no-citados-tooltip-notas">{r.notas}</div>}>
                          <div className="notas-icon-wrapper has-notas">
                            <MessageSquare size={14} className="color-primary notas-icon" />
                          </div>
                        </Tooltip>
                      ) : (
                        <Tooltip content="Sin notas">
                          <div className="notas-icon-wrapper empty-notas">
                            <MessageSquareDashed size={14} className="notas-icon" />
                          </div>
                        </Tooltip>
                      )}
                    </td>
                    <td>
                      <NoCitadoRowActions
                        noCitado={r}
                        onEdit={openEditModal}
                        onDelete={(n) => requestDelete(n.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </section>
  );
}

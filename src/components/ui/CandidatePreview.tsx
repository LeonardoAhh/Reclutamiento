import { CalendarDays, FileImage, LayoutGrid, PenLine, Phone, Search, Star, Trash2, UserRound, BadgeCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { candidateSourceLabel, candidateStatusLabel } from '@/lib/candidateTranslations';
import { formatReadableDate } from '@/lib/dates';
import { CANDIDATE_STATUSES, type Candidate, type CandidateStatus } from '@/lib/types';
import { toNaturalCase } from '@/lib/utils';
import { Avatar } from './Avatar';
import { StarliteBadge, VinoplasticBadge } from './Badge';
import { CandidateStatusBadge } from './CandidateStatusBadge';
import { CustomSelect } from './CustomSelect';
import { Modal } from './Modal';
import './CandidatePreview.css';

interface CandidatePreviewProps {
  candidate: Candidate | null;
  isMobile: boolean;
  canDelete: boolean;
  onClose: () => void;
  onEdit: (candidate: Candidate) => void;
  onDelete: (candidate: Candidate) => void;
  onViewPass: (candidate: Candidate) => void;
  onHire: (candidate: Candidate) => void;
  onStatusChange: (candidate: Candidate, status: CandidateStatus) => void;
}

export function CandidatePreview({
  candidate,
  isMobile,
  canDelete,
  onClose,
  onEdit,
  onDelete,
  onViewPass,
  onHire,
  onStatusChange,
}: CandidatePreviewProps) {
  const { language } = useLanguage();
  const en = language === 'en';

  if (!candidate) return null;

  const canViewPass = Boolean(candidate.reclutador && candidate.puesto);
  const canHire = candidate.status === 'contratado' && !candidate.employee_num;
  const name = toNaturalCase(candidate.nombre, { preserveAcronyms: false });

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={en ? 'Candidate' : 'Candidato'}
      icon={<UserRound aria-hidden="true" />}
      className="candidate-preview"
      overlayClassName="candidate-preview-overlay"
      presentation={isMobile ? 'modal' : 'sheet'}
      placement={isMobile ? 'bottom' : undefined}
      headerActions={
        <button type="button" className="btn-secondary candidate-preview__edit" onClick={() => onEdit(candidate)}>
          <PenLine aria-hidden="true" />
          {en ? 'Edit' : 'Editar'}
        </button>
      }
      footerActions={
        <div className="candidate-preview__actions">
          {canDelete && (
            <button type="button" className="btn-secondary candidate-preview__delete" onClick={() => onDelete(candidate)}>
              <Trash2 aria-hidden="true" />
              {en ? 'Delete' : 'Eliminar'}
            </button>
          )}
          <div className="candidate-preview__actions-end">
            {canHire && (
              <button type="button" className="btn-primary" onClick={() => onHire(candidate)}>
                <BadgeCheck aria-hidden="true" />
                {en ? 'Hire' : 'Contratar'}
              </button>
            )}
            {canViewPass && (
              <button type="button" className="btn-secondary" onClick={() => onViewPass(candidate)}>
                <FileImage aria-hidden="true" />
                {en ? 'View pass' : 'Ver pase'}
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="modal-body candidate-preview__body">
        <div className="candidate-preview__identity">
          <Avatar name={name} fallback={name.charAt(0)} />
          <div className="candidate-preview__identity-text">
            <h3>{name}</h3>
            <p>{toNaturalCase(candidate.puesto)}{candidate.seccion ? ` · ${toNaturalCase(candidate.seccion)}` : ''}</p>
          </div>
        </div>
        <CustomSelect
          id={`candidate-preview-status-${candidate.id}`}
          className="candidate-preview__status-select"
          value={candidate.status}
          onChange={(status) => onStatusChange(candidate, status as CandidateStatus)}
          options={CANDIDATE_STATUSES.map((status) => ({
            value: status,
            label: candidateStatusLabel(status, language),
          }))}
          placeholder=""
          aria-label={`${en ? 'Change status for' : 'Cambiar estado de'} ${candidate.nombre}`}
          customTrigger={<CandidateStatusBadge status={candidate.status} showCaret />}
        />

        <dl className="candidate-preview__details">
          {candidate.telefono && (
            <div className="candidate-preview__detail">
              <dt><Phone aria-hidden="true" />{en ? 'Phone' : 'Teléfono'}</dt>
              <dd>{candidate.telefono}</dd>
            </div>
          )}
          <div className="candidate-preview__detail">
            <dt><LayoutGrid aria-hidden="true" />{en ? 'Area' : 'Área'}</dt>
            <dd>{toNaturalCase(candidate.area)}</dd>
          </div>
          {candidate.reclutador && (
            <div className="candidate-preview__detail">
              <dt><UserRound aria-hidden="true" />{en ? 'Recruiter' : 'Reclutador'}</dt>
              <dd>{toNaturalCase(candidate.reclutador, { preserveAcronyms: false })}</dd>
            </div>
          )}
          {candidate.source && (
            <div className="candidate-preview__detail">
              <dt><Search aria-hidden="true" />{en ? 'Source' : 'Fuente'}</dt>
              <dd>{toNaturalCase(candidateSourceLabel(candidate.source, language))}</dd>
            </div>
          )}
          <div className="candidate-preview__detail">
            <dt><Star aria-hidden="true" />Starlite</dt>
            <dd>{candidate.is_starlite ? (en ? 'Yes' : 'Sí') : 'No'}</dd>
          </div>
          <div className="candidate-preview__detail">
            <dt className="candidate-preview__detail-label--plain">{en ? 'Company' : 'Empresa'}</dt>
            <dd>{candidate.is_starlite ? <StarliteBadge /> : <VinoplasticBadge />}</dd>
          </div>
          {candidate.fecha_cita && (
            <div className="candidate-preview__detail">
              <dt><CalendarDays aria-hidden="true" />{en ? 'Interview' : 'Entrevista'}</dt>
              <dd>{formatReadableDate(candidate.fecha_cita, en ? 'en-US' : 'es-MX')}</dd>
            </div>
          )}
          {candidate.email && (
            <div className="candidate-preview__detail">
              <dt className="candidate-preview__detail-label--plain">{en ? 'Email' : 'Correo electrónico'}</dt>
              <dd>{candidate.email}</dd>
            </div>
          )}
          {candidate.employee_num && (
            <div className="candidate-preview__detail">
              <dt className="candidate-preview__detail-label--plain">{en ? 'Employee number' : 'Número de empleado'}</dt>
              <dd>{candidate.employee_num}</dd>
            </div>
          )}
          {candidate.notas && (
            <div className="candidate-preview__detail">
              <dt className="candidate-preview__detail-label--plain">{en ? 'Notes' : 'Notas'}</dt>
              <dd>{toNaturalCase(candidate.notas, { preserveAcronyms: false })}</dd>
            </div>
          )}
        </dl>
      </div>
    </Modal>
  );
}

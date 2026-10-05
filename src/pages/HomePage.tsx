import { useId, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, Brain, CalendarDays, ChevronLeft, ChevronRight, RotateCcw, Scale, ShieldCheck, UsersRound } from "lucide-react";
import { validation, wave } from "robot-toast/robots";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Calendar } from "@/components/ui/Calendar";
import { BrandMark } from "@/components/ui/BrandMark";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/hooks/useAuth";
import { formatCompactDateRange, formatEmploymentTenure, formatReadableDate, localTodayIso, localDateToIso, isoToLocalDateString, TZ_MX } from "@/lib/dates";
import { getUserTitle } from "@/lib/userIdentity";
import { useTeamDirectory } from '@/features/team/TeamProvider';
import { CAREER_JOURNEY_ENABLED } from '@/features/career/types';
import { toNaturalCase } from "@/lib/utils";
import { HomeLessonCard } from "./home/HomeLessonCard";
import {
  MOTIVATION_BY_TITLE, DEFAULT_MOTIVATION, LEADERSHIP_CUE_BY_TITLE,
  DEFAULT_LEADERSHIP_CUE, EMPLOYEE_LIFECYCLE, LABOR_GUIDANCE,
  DEVELOPMENT_SECTIONS, PRACTICE_REFLECTIONS, RESPONSIBLE_PROCESS_CARD,
  RESPONSIBLE_PROCESS_COMMITMENTS, HOME_TOPICS, LEGACY_LESSONS,
  LEAVE_POLICY_NOTICE, type DevelopmentSection,
} from "./homeContent";
import {
  canReviewLeaveRequests, createLeaveRequest, leaveTypeLabel, requiresNoticeException, validateLeaveDraft,
  LEAVE_REQUESTS_PATH, LEAVE_TYPE_OPTIONS, type LeaveDraft,
} from '@/features/leave/requests';
import "./HomePage.css";

function HomeContext({ section }: { section: DevelopmentSection }) {
  return (
    <HomeLessonCard
      title={section.title}
      eyebrow={section.eyebrow}
      icon={section.topics[0].icon}
    >
      <p>{section.introduction}</p>
    </HomeLessonCard>
  );
}

function TopicLessons({ topicId, leadershipCue }: {
  topicId: string;
  leadershipCue: string;
}) {
  switch (topicId) {
    case "reclutamiento":
      return (
        <>
          <HomeLessonCard {...RESPONSIBLE_PROCESS_CARD} icon={ShieldCheck}>
            <ul className="home-page__commitment-list">
              {RESPONSIBLE_PROCESS_COMMITMENTS.map(({ title, description, icon: Icon }) => (
                <li key={title}>
                  <Icon aria-hidden="true" />
                  <div><h4>{title}</h4><p>{description}</p></div>
                </li>
              ))}
            </ul>
          </HomeLessonCard>
          <HomeLessonCard {...LEGACY_LESSONS[0]} />
          <HomeLessonCard {...LEGACY_LESSONS[1]} />
          <HomeContext section={DEVELOPMENT_SECTIONS[0]} />
          {DEVELOPMENT_SECTIONS[0].topics.map(topic => (
            <HomeLessonCard {...topic} key={topic.title} />
          ))}
        </>
      );
    case "administracion":
      return (
        <>
          <HomeLessonCard {...LEGACY_LESSONS[2]} />
          <HomeLessonCard
            {...LEGACY_LESSONS[3]}
            action={
              <a href="https://www.diputados.gob.mx/LeyesBiblio/pdf/LFT.pdf"
                target="_blank" rel="noreferrer">
                Fuente oficial
                <span className="sr-only">(abre en nueva pestaña)</span>
                <ArrowUpRight aria-hidden="true" />
              </a>
            }
          >
            <ul className="home-page__labor-list">
              {LABOR_GUIDANCE.map(({ article, label }) => (
                <li key={article}><strong>{article}</strong><span>{label}</span></li>
              ))}
            </ul>
            <footer className="home-page__legal-footer">
              <span>Orientación general; consulta el texto vigente.</span>
            </footer>
          </HomeLessonCard>
          <HomeLessonCard title="Una experiencia completa"
            eyebrow="Ciclo de la persona" icon={UsersRound}
            description="La responsabilidad de Recursos Humanos continúa antes, durante y después de la contratación."
            steps={EMPLOYEE_LIFECYCLE} />
          <HomeLessonCard {...DEVELOPMENT_SECTIONS[2].topics[1]} />
          <HomeLessonCard {...LEGACY_LESSONS[9]} />
        </>
      );
    case "liderazgo":
      return (
        <>
          <HomeLessonCard title={HOME_TOPICS[2].title} icon={HOME_TOPICS[2].icon}>
            <p>{leadershipCue}</p>
          </HomeLessonCard>
          {[4, 5, 6].map(index => (
            <HomeLessonCard {...LEGACY_LESSONS[index]} key={LEGACY_LESSONS[index].title} />
          ))}
          <HomeContext section={DEVELOPMENT_SECTIONS[1]} />
          {DEVELOPMENT_SECTIONS[1].topics.map(topic => (
            <HomeLessonCard {...topic} key={topic.title} />
          ))}
          <HomeLessonCard {...DEVELOPMENT_SECTIONS[2].topics[0]} />
        </>
      );
    case "desarrollo":
      return (
        <>
          {[7, 8, 10].map(index => (
            <HomeLessonCard {...LEGACY_LESSONS[index]} key={LEGACY_LESSONS[index].title} />
          ))}
          <HomeContext section={DEVELOPMENT_SECTIONS[2]} />
          <HomeLessonCard {...DEVELOPMENT_SECTIONS[2].topics[2]} />
          <HomeContext section={DEVELOPMENT_SECTIONS[3]} />
          {DEVELOPMENT_SECTIONS[3].topics.map(topic => (
            <HomeLessonCard {...topic} key={topic.title} />
          ))}
        </>
      );
    case "reflexion":
      return (
        <>
          {PRACTICE_REFLECTIONS.map(({ label, title, description, icon }) => (
            <HomeLessonCard title={title} eyebrow={label} icon={icon} key={label}>
              <p>{description}</p>
            </HomeLessonCard>
          ))}
          <HomeLessonCard title="Cuando una impresión aparece antes que la evidencia"
            eyebrow="Caso para pensar" icon={Brain}
            description="Durante una conversación surge una conclusión rápida sobre una persona, pero todavía faltan preguntas relacionadas con el puesto.">
            <h4>Antes de decidir</h4>
            <ul>
              <li>¿Qué observé directamente?</li>
              <li>¿Qué estoy interpretando?</li>
              <li>¿Qué pregunta aportaría evidencia relevante?</li>
            </ul>
          </HomeLessonCard>
          <HomeLessonCard title="Contraste práctico"
            description="Ayuda / Dificulta" icon={Scale}>
            <div className="home-page__contrast-columns">
              <div>
                <h4>Ayuda</h4>
                <ul>
                  <li>Preguntar y confirmar</li>
                  <li>Explicar el criterio</li>
                  <li>Acordar el siguiente paso</li>
                </ul>
              </div>
              <div>
                <h4>Dificulta</h4>
                <ul>
                  <li>Suponer sin verificar</li>
                  <li>Prometer sin respaldo</li>
                  <li>Dejar un cierre ambiguo</li>
                </ul>
              </div>
            </div>
          </HomeLessonCard>
        </>
      );
    default:
      return null;
  }
}

export function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationState: unknown = location.state;
  const showCareerMotivation = CAREER_JOURNEY_ENABLED && navigationState !== null
    && typeof navigationState === 'object'
    && 'careerMotivation' in navigationState
    && navigationState.careerMotivation === true;
  const { members } = useTeamDirectory();
  const { profile, user, username } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const [leavePolicyOpen, setLeavePolicyOpen] = useState(false);
  const [leaveStep, setLeaveStep] = useState<'policy' | 'form' | 'saved'>('policy');
  const [leaveDraft, setLeaveDraft] = useState<LeaveDraft>({ type: 'vacation', startDate: '', endDate: '' });
  const [leaveSaving, setLeaveSaving] = useState(false);
  const [leaveError, setLeaveError] = useState('');
  const leaveFormId = useId();
  const leaveFormRef = useRef<HTMLFormElement>(null);
  const leaveSuccessRef = useRef<HTMLHeadingElement>(null);
  const leaveErrorRef = useRef<HTMLParagraphElement>(null);
  const leaveBusyRef = useRef(false);
  const leaveSubmissionRef = useRef<{ fingerprint: string; id: string } | null>(null);

  const titleRef = useRef<HTMLHeadingElement>(null);
  const moveFocus = useRef(false);
  const activeTopic = HOME_TOPICS[activeIndex];

  useLayoutEffect(() => {
    if (moveFocus.current) {
      titleRef.current?.focus();
      moveFocus.current = false;
    }
  }, [activeIndex]);

  useLayoutEffect(() => {
    if (!leavePolicyOpen) return;
    if (leaveStep === 'form') leaveFormRef.current?.querySelector<HTMLElement>('[role="combobox"]')?.focus();
    else if (leaveStep === 'saved') leaveSuccessRef.current?.focus();
  }, [leavePolicyOpen, leaveStep]);

  useLayoutEffect(() => {
    if (leavePolicyOpen && leaveError) leaveErrorRef.current?.focus();
  }, [leavePolicyOpen, leaveError]);

  function leaveCalendarDate(value: string) {
    const iso = localDateToIso(value);
    return iso ? new Date(iso) : undefined;
  }
  const leaveCalendarToday = leaveCalendarDate(localTodayIso())!;

  function openLeavePolicy() {
    if (leaveStep === 'saved') {
      setLeaveDraft({ type: 'vacation', startDate: '', endDate: '' });
      leaveSubmissionRef.current = null;
    }
    setLeaveStep('policy');
    setLeaveError('');
    setLeavePolicyOpen(true);
  }

  function closeLeavePolicy() {
    if (!leaveBusyRef.current) setLeavePolicyOpen(false);
  }

  async function saveLeaveRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (leaveBusyRef.current) return;
    const validation = validateLeaveDraft(leaveDraft);
    if (validation) { setLeaveError(validation); return; }
    const fingerprint = JSON.stringify(leaveDraft);
    if (leaveSubmissionRef.current?.fingerprint !== fingerprint) {
      leaveSubmissionRef.current = { fingerprint, id: crypto.randomUUID() };
    }
    const requestId = leaveSubmissionRef.current.id;
    leaveBusyRef.current = true;
    setLeaveSaving(true);
    setLeaveError('');
    try {
      await createLeaveRequest(requestId, leaveDraft);
      setLeaveStep('saved');
    } catch (cause) {
      setLeaveError(cause instanceof Error ? cause.message : 'No se pudo guardar la solicitud.');
    } finally {
      leaveBusyRef.current = false;
      setLeaveSaving(false);
    }
  }

  function selectTopic(index: number) {
    if (index === activeIndex || index < 0 || index >= HOME_TOPICS.length) return;
    moveFocus.current = true;
    setActiveIndex(index);
  }

  function closeCareerMotivation() {
    navigate({ pathname: location.pathname, search: location.search, hash: location.hash },
      { replace: true, state: null });
  }

  if (!profile) return null;

  const displayName = toNaturalCase(profile.display_name || username, {
    preserveAcronyms: false,
  });
  const firstName = displayName.split(/\s+/)[0] || displayName;
  const userTitle = getUserTitle(profile.role, members.find(member => member.profile_id === profile.id)?.job_title);
  const canReviewRequests = canReviewLeaveRequests(profile, members);
  const motivation = MOTIVATION_BY_TITLE[userTitle] ?? DEFAULT_MOTIVATION;
  const leadershipCue =
    LEADERSHIP_CUE_BY_TITLE[userTitle] ?? DEFAULT_LEADERSHIP_CUE;
  const hireDate = profile.hire_date?.slice(0, 10) ?? "";
  const tenure = formatEmploymentTenure(hireDate);


  return (
    <main className="home-page container" aria-labelledby="home-page-title">
      <section className="home-page__hero">
        <div className="home-page__identity">
          <span className="home-page__eyebrow" aria-hidden="true">
            {userTitle}
          </span>
          <h1 id="home-page-title" className="home-page__title app-page-title">
            <span className="home-page__title-text">Hola, {firstName}.</span>
            <img className="home-page__robot" src={wave} alt="" aria-hidden="true" />
          </h1>
        </div>
        {hireDate && tenure ? (
          <p className="home-page__employment-meta">
            <span>
              Ingreso{" "}
              <time dateTime={hireDate}>{formatReadableDate(hireDate)}</time>
            </span>
            <span className="home-page__employment-tenure">
              <span
                className="home-page__employment-separator"
                aria-hidden="true"
              >
                ·
              </span>
              {tenure} en el equipo
            </span>
          </p>
        ) : null}
        <div className="home-page__hero-footer">
          <p className="home-page__message">{motivation}</p>
          {!canReviewRequests && (
            <button
              type="button"
              className="btn-secondary home-page__leave-action"
              aria-haspopup="dialog"
              aria-expanded={leavePolicyOpen}
              onClick={openLeavePolicy}
            >
              <CalendarDays aria-hidden="true" />
              {LEAVE_POLICY_NOTICE.buttonLabel}
            </button>
          )}
          {canReviewRequests && (
            <Link className="btn-secondary home-page__leave-action" to={LEAVE_REQUESTS_PATH}>View</Link>
          )}
        </div>
      </section>

      <div id="home-content" className="home-page__learning">
        <section id="home-topic-content" className="home-page__topic-content"
          aria-labelledby="home-topic-title">
          <header className="home-page__section-header">
            <div className="home-page__section-heading">
              <h2 id="home-topic-title" ref={titleRef} tabIndex={-1}
                className="home-page__section-title">
                {activeTopic.title}
              </h2>
              <nav className="home-page__pagination" aria-label="Recorrer temas">
                <button
                  type="button"
                  className="home-page__pagination-button"
                  aria-label="Tema anterior"
                  disabled={activeIndex === 0}
                  onClick={() => selectTopic(activeIndex - 1)}
                >
                  <ChevronLeft aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="home-page__pagination-button"
                  aria-label="Tema siguiente"
                  disabled={activeIndex === HOME_TOPICS.length - 1}
                  onClick={() => selectTopic(activeIndex + 1)}
                >
                  <ChevronRight aria-hidden="true" />
                </button>
              </nav>
            </div>
            <p className="home-page__section-intro">{activeTopic.introduction}</p>
          </header>
          <div className="home-page__lessons">
            <TopicLessons topicId={activeTopic.id} leadershipCue={leadershipCue} />
          </div>
        </section>
      </div>
      <Modal
        isOpen={leavePolicyOpen}
        onClose={closeLeavePolicy}
        onBack={leaveStep === 'form' && !leaveSaving ? () => { setLeaveError(''); setLeaveStep('policy'); } : undefined}
        title={LEAVE_POLICY_NOTICE.title}
        className={`home-page__leave-modal${leaveStep === 'form' ? ' home-page__leave-modal--form' : ''}`}
        size={leaveStep === 'form' ? 'md' : 'sm'}
        footerActions={leaveStep === 'policy' ?
          <button type="button" className="btn-primary" onClick={() => setLeaveStep('form')}>Solicita</button>
        : leaveStep === 'form' ?
          <button type="submit" form={`${leaveFormId}-form`} className="btn-primary" disabled={leaveSaving || !leaveDraft.startDate || !leaveDraft.endDate}>
            {leaveSaving ? 'Guardando…' : 'Hacer solicitud'}
          </button> :
          <button type="button" className="btn-primary" onClick={closeLeavePolicy}>Listo</button>}
      >
        {leaveStep === 'policy' ? <div className="modal-body home-page__leave-policy type-body-md">
          <p>{LEAVE_POLICY_NOTICE.introduction}</p>
          <ul>{LEAVE_POLICY_NOTICE.points.map(point => <li key={point}>{point}</li>)}</ul>
        </div> : leaveStep === 'form' ?
          <form ref={leaveFormRef} id={`${leaveFormId}-form`} className="modal-body home-page__leave-policy home-page__leave-form" onSubmit={saveLeaveRequest} aria-busy={leaveSaving}>
            <fieldset className="home-page__leave-fields" disabled={leaveSaving}>
              <legend className="sr-only">Datos de la solicitud</legend>
              <div className="home-page__leave-aside">
                <div className="form-group home-page__leave-type">
                  <label htmlFor={`${leaveFormId}-type`}>Tipo</label>
                  <CustomSelect
                    id={`${leaveFormId}-type`}
                    value={leaveDraft.type}
                    options={LEAVE_TYPE_OPTIONS}
                    showPlaceholderOption={false}
                    disabled={leaveSaving}
                    aria-required="true"
                    onChange={value => {
                      const option = LEAVE_TYPE_OPTIONS.find(option => option.value === value);
                      if (option) { setLeaveDraft(draft => ({ ...draft, type: option.value })); setLeaveError(''); }
                    }}
                  />
                </div>
                <div className="home-page__leave-art">
                  <div className="home-page__leave-bubble">
                    <p role="status" aria-atomic="true">
                      {!leaveDraft.startDate ? 'Selecciona inicio y fin' : <>
                        <span aria-hidden="true">
                          {!leaveDraft.endDate
                            ? `${formatReadableDate(leaveDraft.startDate).replace(/\s+\d{4}$/, '')} · Elige fin`
                            : formatCompactDateRange(leaveDraft.startDate, leaveDraft.endDate)}
                        </span>
                        <span className="sr-only">
                          {!leaveDraft.endDate
                            ? `Inicio ${formatReadableDate(leaveDraft.startDate)}. Elige la fecha de fin.`
                            : `${formatReadableDate(leaveDraft.startDate)} al ${formatReadableDate(leaveDraft.endDate)}`}
                        </span>
                      </>}
                    </p>
                    {requiresNoticeException(leaveDraft) && <p className="home-page__leave-bubble-note">
                      Requiere autorización
                    </p>}
                    {leaveDraft.startDate && <button type="button" className="btn-icon home-page__leave-clear" aria-label="Limpiar fechas seleccionadas" title="Limpiar fechas" disabled={leaveSaving}
                      onClick={() => { setLeaveDraft(draft => ({ ...draft, startDate: '', endDate: '' })); setLeaveError(''); }}>
                      <RotateCcw aria-hidden="true" />
                    </button>}
                  </div>
                  <div className="home-page__leave-art-icons" aria-hidden="true">
                    <BrandMark className="home-page__leave-brand" />
                    <img className="home-page__leave-robot" src={validation} alt="" />
                  </div>
                </div>
              </div>
              <fieldset className="home-page__leave-dates">
                <legend className="sr-only" id={`${leaveFormId}-dates-label`}>Fechas</legend>
                <p id={`${leaveFormId}-dates-help`} className="sr-only">
                  {leaveDraft.startDate && !leaveDraft.endDate
                    ? 'Ahora elige la fecha de fin. Para un solo día, vuelve a seleccionarlo.'
                    : 'Elige la fecha de inicio y después la de fin.'}
                </p>
                <div className="home-page__leave-calendar-scroll" role="region" aria-label="Calendario de la solicitud" tabIndex={0}>
                  <Calendar
                    mode="range"
                    resetOnSelect
                    selected={leaveDraft.startDate ? {
                      from: leaveCalendarDate(leaveDraft.startDate),
                      to: leaveCalendarDate(leaveDraft.endDate),
                    } : undefined}
                    defaultMonth={leaveCalendarDate(leaveDraft.startDate) ?? leaveCalendarToday}
                    startMonth={leaveCalendarToday}
                    timeZone={TZ_MX}
                    navLayout="after"
                    showOutsideDays={false}
                    disabled={leaveSaving ? true : { before: leaveCalendarToday }}
                    aria-labelledby={`${leaveFormId}-dates-label`}
                    aria-describedby={`${leaveFormId}-dates-help`}
                    onSelect={range => {
                      setLeaveDraft(draft => ({
                        ...draft,
                        startDate: range?.from ? isoToLocalDateString(range.from.toISOString()) : '',
                        endDate: range?.to ? isoToLocalDateString(range.to.toISOString()) : '',
                      }));
                      setLeaveError('');
                    }}
                  />
                </div>
              </fieldset>
            </fieldset>
            {leaveError && <p ref={leaveErrorRef} tabIndex={-1} className="form-error-text type-body-md" role="alert">{leaveError}</p>}
          </form> :
          <div className="modal-body home-page__leave-policy type-body-md">
            <h3 ref={leaveSuccessRef} tabIndex={-1} className="home-page__leave-success">Se validará tu solicitud</h3>
            <p>{leaveTypeLabel(leaveDraft.type)}: {formatReadableDate(leaveDraft.startDate)} al {formatReadableDate(leaveDraft.endDate)}.</p>
            <p>Tu coordinador revisará la solicitud y te entregará los formatos físicos.</p>
            <p>{LEAVE_POLICY_NOTICE.handoverReminder}</p>
          </div>}
      </Modal>
      {CAREER_JOURNEY_ENABLED && <Modal isOpen={showCareerMotivation} title="Tu día, tu enfoque"
      onClose={closeCareerMotivation} size="sm"
      footerActions={<button type="button" className="btn-primary" onClick={closeCareerMotivation}>Hacer que cuente</button>}>
      <div className="modal-body">
        <p className="type-body-md">
      Cada mañana es una nueva oportunidad para avanzar. Tómate un minuto, prioriza y haz que hoy cuente.
    </p>
  </div>
</Modal>}
    </main>
  );
}
import { useId, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, Brain, CalendarDays, ChevronLeft, ChevronRight, Network, RotateCcw, Scale, ShieldCheck, UsersRound } from "lucide-react";
import { validation, wave } from "robot-toast/robots";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { enUS, es } from "date-fns/locale";
import { ORGANIZATION_CHART_PATH } from "@/components/layout/navigation";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Calendar } from "@/components/ui/Calendar";
import { BrandMark } from "@/components/ui/BrandMark";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { homeLesson, homeSection, homeText } from "./homeTranslations";
import { formatCompactDateRange, formatEmploymentTenure, formatReadableDate, localTodayIso, localDateToIso, isoToLocalDateString, TZ_MX } from "@/lib/dates";
import { getUserTitle } from "@/lib/userIdentity";
import { useTeamDirectory } from '@/features/team/TeamProvider';
import { leaveErrorText } from '@/features/leave/translations';
import { CAREER_JOURNEY_ENABLED } from '@/features/career/types';
import { toNaturalCase } from "@/lib/utils";
import { HomeLessonCard } from "./home/HomeLessonCard";
import { HomeLeaveDialog } from "./home/HomeLeaveDialog";
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

function TopicLessons({ topicId, leadershipCue, language }: {
  topicId: string;
  leadershipCue: string;
  language: Language;
}) {
  const lesson = (data: (typeof LEGACY_LESSONS)[number]) => homeLesson(data, language);
  const section = (index: number) => homeSection(DEVELOPMENT_SECTIONS[index], language);
  switch (topicId) {
    case "reclutamiento":
      return (
        <>
          <HomeLessonCard {...homeLesson({ ...RESPONSIBLE_PROCESS_CARD, icon: ShieldCheck }, language)}>
            <ul className="home-page__commitment-list">
              {RESPONSIBLE_PROCESS_COMMITMENTS.map(({ title, description, icon: Icon }) => (
                <li key={title}>
                  <Icon aria-hidden="true" />
                  <div><h4>{homeText(title, language)}</h4><p>{homeText(description, language)}</p></div>
                </li>
              ))}
            </ul>
          </HomeLessonCard>
          <HomeLessonCard {...lesson(LEGACY_LESSONS[0])} />
          <HomeLessonCard {...lesson(LEGACY_LESSONS[1])} />
          <HomeContext section={section(0)} />
          {section(0).topics.map(topic => (
            <HomeLessonCard {...topic} key={topic.title} />
          ))}
        </>
      );
    case "administracion":
      return (
        <>
          <HomeLessonCard {...lesson(LEGACY_LESSONS[2])} />
          <HomeLessonCard
            {...lesson(LEGACY_LESSONS[3])}
            action={
              <a href="https://www.diputados.gob.mx/LeyesBiblio/pdf/LFT.pdf"
                target="_blank" rel="noreferrer">
                {language === 'en' ? 'Official source' : 'Fuente oficial'}
                <span className="sr-only">{language === 'en' ? '(opens in new tab)' : '(abre en nueva pestaña)'}</span>
                <ArrowUpRight aria-hidden="true" />
              </a>
            }
          >
            <ul className="home-page__labor-list">
              {LABOR_GUIDANCE.map(({ article, label }) => (
                <li key={article}><strong>{article}</strong><span>{homeText(label, language)}</span></li>
              ))}
            </ul>
            <footer className="home-page__legal-footer">
              <span>{language === 'en' ? 'General guidance; consult the current law.' : 'Orientación general; consulta el texto vigente.'}</span>
            </footer>
          </HomeLessonCard>
          <HomeLessonCard title={language === 'en' ? 'The complete experience' : 'Una experiencia completa'}
            eyebrow={language === 'en' ? 'Employee lifecycle' : 'Ciclo de la persona'} icon={UsersRound}
            description={language === 'en' ? 'Human Resources responsibilities continue before, during, and after hiring.' : 'La responsabilidad de Recursos Humanos continúa antes, durante y después de la contratación.'}
            steps={EMPLOYEE_LIFECYCLE.map(value => homeText(value, language))} />
          <HomeLessonCard {...section(2).topics[1]} />
          <HomeLessonCard {...lesson(LEGACY_LESSONS[9])} />
        </>
      );
    case "liderazgo":
      return (
        <>
          <HomeLessonCard title={homeText(HOME_TOPICS[2].title, language)} icon={HOME_TOPICS[2].icon}>
            <p>{leadershipCue}</p>
          </HomeLessonCard>
          {[4, 5, 6].map(index => (
            <HomeLessonCard {...lesson(LEGACY_LESSONS[index])} key={LEGACY_LESSONS[index].title} />
          ))}
          <HomeContext section={section(1)} />
          {section(1).topics.map(topic => (
            <HomeLessonCard {...topic} key={topic.title} />
          ))}
          <HomeLessonCard {...section(2).topics[0]} />
        </>
      );
    case "desarrollo":
      return (
        <>
          {[7, 8, 10].map(index => (
            <HomeLessonCard {...lesson(LEGACY_LESSONS[index])} key={LEGACY_LESSONS[index].title} />
          ))}
          <HomeContext section={section(2)} />
          <HomeLessonCard {...section(2).topics[2]} />
          <HomeContext section={section(3)} />
          {section(3).topics.map(topic => (
            <HomeLessonCard {...topic} key={topic.title} />
          ))}
        </>
      );
    case "reflexion":
      return (
        <>
          {PRACTICE_REFLECTIONS.map(({ label, title, description, icon }) => (
            <HomeLessonCard title={homeText(title, language)} eyebrow={homeText(label, language)} icon={icon} key={label}>
              <p>{homeText(description, language)}</p>
            </HomeLessonCard>
          ))}
          <HomeLessonCard title={language === 'en' ? 'When an impression comes before the evidence' : 'Cuando una impresión aparece antes que la evidencia'}
            eyebrow={language === 'en' ? 'A case to consider' : 'Caso para pensar'} icon={Brain}
            description={language === 'en' ? 'A quick conclusion about someone comes up during a conversation, but job-related questions remain unanswered.' : 'Durante una conversación surge una conclusión rápida sobre una persona, pero todavía faltan preguntas relacionadas con el puesto.'}>
            <h4>{language === 'en' ? 'Before deciding' : 'Antes de decidir'}</h4>
            <ul>
              <li>{language === 'en' ? 'What did I observe directly?' : '¿Qué observé directamente?'}</li>
              <li>{language === 'en' ? 'What am I interpreting?' : '¿Qué estoy interpretando?'}</li>
              <li>{language === 'en' ? 'What question would provide relevant evidence?' : '¿Qué pregunta aportaría evidencia relevante?'}</li>
            </ul>
          </HomeLessonCard>
          <HomeLessonCard title={language === 'en' ? 'Practical comparison' : 'Contraste práctico'}
            description={language === 'en' ? 'Helps / Hinders' : 'Ayuda / Dificulta'} icon={Scale}>
            <div className="home-page__contrast-columns">
              <div>
                <h4>{language === 'en' ? 'Helps' : 'Ayuda'}</h4>
                <ul>
                  <li>{language === 'en' ? 'Ask and confirm' : 'Preguntar y confirmar'}</li>
                  <li>{language === 'en' ? 'Explain the criteria' : 'Explicar el criterio'}</li>
                  <li>{language === 'en' ? 'Agree on the next step' : 'Acordar el siguiente paso'}</li>
                </ul>
              </div>
              <div>
                <h4>{language === 'en' ? 'Hinders' : 'Dificulta'}</h4>
                <ul>
                  <li>{language === 'en' ? 'Assume without checking' : 'Suponer sin verificar'}</li>
                  <li>{language === 'en' ? 'Promise without support' : 'Prometer sin respaldo'}</li>
                  <li>{language === 'en' ? 'Leave the outcome unclear' : 'Dejar un cierre ambiguo'}</li>
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
  const { language } = useLanguage();
  const en = language === 'en';
  const dateLocale = en ? 'en-US' : 'es-MX';
  const date = (value: string) => formatReadableDate(value, dateLocale);
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
  const leaveTriggerRef = useRef<HTMLButtonElement>(null);
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
    if (validation) { setLeaveError(leaveErrorText(validation, language)); return; }
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
      setLeaveError(cause instanceof Error ? leaveErrorText(cause.message, language) : (en ? 'Could not save the request.' : 'No se pudo guardar la solicitud.'));
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
  const motivation = homeText(MOTIVATION_BY_TITLE[userTitle] ?? DEFAULT_MOTIVATION, language);
  const leadershipCue =
    homeText(LEADERSHIP_CUE_BY_TITLE[userTitle] ?? DEFAULT_LEADERSHIP_CUE, language);
  const hireDate = profile.hire_date?.slice(0, 10) ?? "";
  const tenure = formatEmploymentTenure(hireDate, undefined, dateLocale);


  return (
    <main className="home-page container" aria-labelledby="home-page-title">
      <section className="home-page__hero">
        <div className="home-page__identity">
          <span className="home-page__eyebrow" aria-hidden="true">
            {homeText(userTitle, language)}
          </span>
          <h1 id="home-page-title" className="home-page__title app-page-title">
            <span className="home-page__title-text">{en ? 'Hello' : 'Hola'}, {firstName}.</span>
            <img className="home-page__robot" src={wave} alt="" aria-hidden="true" />
          </h1>
        </div>
        {hireDate && tenure ? (
          <p className="home-page__employment-meta">
            <span>
              {en ? 'Joined' : 'Ingreso'}{" "}
              <time dateTime={hireDate}>{date(hireDate)}</time>
            </span>
            <span className="home-page__employment-tenure">
              <span
                className="home-page__employment-separator"
                aria-hidden="true"
              >
                ·
              </span>
              {tenure} {en ? 'on the team' : 'en el equipo'}
            </span>
          </p>
        ) : null}
        <div className="home-page__hero-footer">
          <p className="home-page__message">{motivation}</p>
          <div className="home-page__hero-actions">
          {!canReviewRequests && (
            <button
              type="button"
              ref={leaveTriggerRef}
              className="btn-secondary home-page__leave-action"
              aria-haspopup="dialog"
              aria-expanded={leavePolicyOpen}
              onClick={openLeavePolicy}
            >
              <CalendarDays aria-hidden="true" />
              <span>{en ? 'Request leave' : 'Solicitar'}</span>
            </button>
          )}
          {canReviewRequests && (
            <Link className="btn-secondary home-page__leave-action" to={LEAVE_REQUESTS_PATH}>
              <CalendarDays aria-hidden="true" />
              <span>{en ? 'Manage requests' : 'Gestionar'}</span>
            </Link>
          )}
          <Link className="btn-secondary home-page__organization-action" to={ORGANIZATION_CHART_PATH} aria-label={en ? 'Organization chart' : 'Organigrama'} title={en ? 'Organization chart' : 'Organigrama'}>
            <Network aria-hidden="true" />
            <span className="home-page__organization-action-label">{en ? 'Organization chart' : 'Organigrama'}</span>
            <Badge variant="neutral-solid" className="home-page__organization-badge">{en ? 'New' : 'Nuevo'}</Badge>
          </Link>
          </div>
        </div>
      </section>

      <div id="home-content" className="home-page__learning">
        <section id="home-topic-content" className="home-page__topic-content"
          aria-labelledby="home-topic-title">
          <header className="home-page__section-header">
            <div className="home-page__section-heading">
              <h2 id="home-topic-title" ref={titleRef} tabIndex={-1}
                className="home-page__section-title">
                {homeText(activeTopic.title, language)}
              </h2>
              <nav className="home-page__pagination" aria-label={en ? 'Browse topics' : 'Recorrer temas'}>
                <button
                  type="button"
                  className="home-page__pagination-button"
                  aria-label={en ? 'Previous topic' : 'Tema anterior'}
                  disabled={activeIndex === 0}
                  onClick={() => selectTopic(activeIndex - 1)}
                >
                  <ChevronLeft aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="home-page__pagination-button"
                  aria-label={en ? 'Next topic' : 'Tema siguiente'}
                  disabled={activeIndex === HOME_TOPICS.length - 1}
                  onClick={() => selectTopic(activeIndex + 1)}
                >
                  <ChevronRight aria-hidden="true" />
                </button>
              </nav>
            </div>
            <p className="home-page__section-intro">{homeText(activeTopic.introduction, language)}</p>
          </header>
          <div className="home-page__lessons">
            <TopicLessons topicId={activeTopic.id} leadershipCue={leadershipCue} language={language} />
          </div>
        </section>
      </div>
      <HomeLeaveDialog
        triggerRef={leaveTriggerRef}
        isOpen={leavePolicyOpen}
        onClose={closeLeavePolicy}
        onBack={leaveStep === 'form' && !leaveSaving ? () => { setLeaveError(''); setLeaveStep('policy'); } : undefined}
        title={homeText(LEAVE_POLICY_NOTICE.title, language)}
        className={`home-page__leave-modal${leaveStep === 'form' ? ' home-page__leave-modal--form' : ''}`}
        size={leaveStep === 'form' ? 'md' : 'sm'}
        footerActions={leaveStep === 'policy' ?
          <button type="button" className="btn-primary" onClick={() => setLeaveStep('form')}>{en ? 'Continue' : 'Solicita'}</button>
        : leaveStep === 'form' ?
          <button type="submit" form={`${leaveFormId}-form`} className="btn-primary" disabled={leaveSaving || !leaveDraft.startDate || !leaveDraft.endDate}>
            {leaveSaving ? (en ? 'Saving…' : 'Guardando…') : (en ? 'Submit request' : 'Hacer solicitud')}
          </button> :
          <button type="button" className="btn-primary" onClick={closeLeavePolicy}>{en ? 'Done' : 'Listo'}</button>}
      >
        {leaveStep === 'policy' ? <div className="modal-body home-page__leave-policy type-body-md">
          <p>{homeText(LEAVE_POLICY_NOTICE.introduction, language)}</p>
          <ul>{LEAVE_POLICY_NOTICE.points.map(point => <li key={point}>{homeText(point, language)}</li>)}</ul>
        </div> : leaveStep === 'form' ?
          <form ref={leaveFormRef} id={`${leaveFormId}-form`} className="modal-body home-page__leave-policy home-page__leave-form" onSubmit={saveLeaveRequest} aria-busy={leaveSaving}>
            <fieldset className="home-page__leave-fields" disabled={leaveSaving}>
              <legend className="sr-only">{en ? 'Request details' : 'Datos de la solicitud'}</legend>
              <div className="home-page__leave-aside">
                <div className="form-group home-page__leave-type">
                  <label htmlFor={`${leaveFormId}-type`}>{en ? 'Type' : 'Tipo'}</label>
                  <CustomSelect
                    id={`${leaveFormId}-type`}
                    value={leaveDraft.type}
                    options={LEAVE_TYPE_OPTIONS.map(option => ({ ...option, label: en ? (option.value === 'vacation' ? 'Vacation' : 'Leave') : option.label }))}
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
                      {!leaveDraft.startDate ? (en ? 'Select start and end dates' : 'Selecciona inicio y fin') : <>
                        <span aria-hidden="true">
                          {!leaveDraft.endDate
                            ? `${date(leaveDraft.startDate).replace(/,?\s+\d{4}$/, '')} · ${en ? 'Select end' : 'Elige fin'}`
                            : formatCompactDateRange(leaveDraft.startDate, leaveDraft.endDate, dateLocale)}
                        </span>
                        <span className="sr-only">
                          {!leaveDraft.endDate
                            ? (en ? `Start ${date(leaveDraft.startDate)}. Select the end date.` : `Inicio ${date(leaveDraft.startDate)}. Elige la fecha de fin.`)
                            : `${date(leaveDraft.startDate)} ${en ? 'to' : 'al'} ${date(leaveDraft.endDate)}`}
                        </span>
                      </>}
                    </p>
                    {requiresNoticeException(leaveDraft) && <p className="home-page__leave-bubble-note">
                      {en ? 'Approval required' : 'Requiere autorización'}
                    </p>}
                    {leaveDraft.startDate && <button type="button" className="btn-icon home-page__leave-clear" aria-label={en ? 'Clear selected dates' : 'Limpiar fechas seleccionadas'} title={en ? 'Clear dates' : 'Limpiar fechas'} disabled={leaveSaving}
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
                <legend className="sr-only" id={`${leaveFormId}-dates-label`}>{en ? 'Dates' : 'Fechas'}</legend>
                <p id={`${leaveFormId}-dates-help`} className="sr-only">
                  {leaveDraft.startDate && !leaveDraft.endDate
                    ? (en ? 'Now select the end date. For a single day, select it again.' : 'Ahora elige la fecha de fin. Para un solo día, vuelve a seleccionarlo.')
                    : (en ? 'Select the start date, then the end date.' : 'Elige la fecha de inicio y después la de fin.')}
                </p>
                <div className="home-page__leave-calendar-scroll" role="region" aria-label={en ? 'Request calendar' : 'Calendario de la solicitud'} tabIndex={0}>
                  <Calendar
                    locale={en ? enUS : es}
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
            <h3 ref={leaveSuccessRef} tabIndex={-1} className="home-page__leave-success">{en ? 'Your request will be reviewed' : 'Se validará tu solicitud'}</h3>
            <p>{en ? (leaveDraft.type === 'vacation' ? 'Vacation' : 'Leave') : leaveTypeLabel(leaveDraft.type)}: {date(leaveDraft.startDate)} {en ? 'to' : 'al'} {date(leaveDraft.endDate)}.</p>
            <p>{en ? 'Your coordinator will review the request and provide the physical forms.' : 'Tu coordinador revisará la solicitud y te entregará los formatos físicos.'}</p>
            <p>{homeText(LEAVE_POLICY_NOTICE.handoverReminder, language)}</p>
          </div>}
      </HomeLeaveDialog>
      {CAREER_JOURNEY_ENABLED && <Modal isOpen={showCareerMotivation} title={en ? 'Your day, your focus' : 'Tu día, tu enfoque'}
      onClose={closeCareerMotivation} size="sm"
      footerActions={<button type="button" className="btn-primary" onClick={closeCareerMotivation}>{en ? 'Make it count' : 'Hacer que cuente'}</button>}>
      <div className="modal-body">
        <p className="type-body-md">
      {en ? 'Every morning is a new opportunity to move forward. Take a minute, prioritize, and make today count.' : 'Cada mañana es una nueva oportunidad para avanzar. Tómate un minuto, prioriza y haz que hoy cuente.'}
    </p>
  </div>
</Modal>}
    </main>
  );
}

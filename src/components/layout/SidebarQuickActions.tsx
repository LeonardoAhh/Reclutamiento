import { useId, useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, Ban, CalendarDays, CircleAlert, CircleCheckBig, Info, RotateCcw, Sun, TriangleAlert } from "lucide-react";
import { differenceInCalendarDays } from "date-fns";
import { enUS, es } from "date-fns/locale";
import type { Profile } from "@/hooks/useAuth";
import type { TeamMember } from "@/features/team/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calendar } from "@/components/ui/Calendar";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { leaveErrorText } from "@/features/leave/translations";
import {
  canReviewLeaveRequests,
  createLeaveRequest,
  LEAVE_NOTICE_DAYS,
  leaveTypeLabel,
  LEAVE_TYPE_OPTIONS,
  requiresNoticeException,
  validateLeaveDraft,
  type LeaveDraft,
} from "@/features/leave/requests";
import { formatCompactDateRange, formatReadableDate, isoToLocalDateString, localDateToIso, localTodayIso, TZ_MX } from "@/lib/dates";
import { HomeLeaveDialog } from "@/pages/home/HomeLeaveDialog";
import { homeText } from "@/pages/homeTranslations";
import { LEAVE_POLICY_NOTICE } from "@/pages/homeContent";
import { toast } from "@/lib/notify";
import { playSound } from '@/lib/sound';
import "./SidebarQuickActions.css";

type SidebarQuickActionsProps = {
  profile: Profile | null;
  members: readonly TeamMember[];
  children: (actions: { canReviewRequests: boolean; openLeavePolicy: (focusTarget: HTMLElement) => void }) => ReactNode;
};

function LeaveStepProgress({ step, en }: { step: 1 | 2 | 3; en: boolean }) {
  return <div className="home-page__leave-progress">
    <p className="type-caption-up">{en ? `Step ${step} of 3` : `Paso ${step} de 3`}</p>
    <div className="home-page__leave-progress-track" aria-hidden="true">
      {[1, 2, 3].map(index => <span key={index} data-active={index <= step || undefined} />)}
    </div>
  </div>;
}

export function SidebarQuickActions({ profile, members, children }: SidebarQuickActionsProps) {
  const { language } = useLanguage();
  const en = language === "en";
  const dateLocale = en ? "en-US" : "es-MX";
  const date = (value: string) => formatReadableDate(value, dateLocale);
  const [leavePolicyOpen, setLeavePolicyOpen] = useState(false);
  const [leaveStep, setLeaveStep] = useState<"policy" | "form" | "review" | "saved">("policy");
  const [leaveDraft, setLeaveDraft] = useState<LeaveDraft>({ type: "vacation", startDate: "", endDate: "" });
  const [leaveSaving, setLeaveSaving] = useState(false);
  const [leaveError, setLeaveError] = useState("");
  const leaveTriggerRef = useRef<HTMLElement>(null);
  const leaveFormId = useId();
  const leaveFormRef = useRef<HTMLFormElement>(null);
  const leaveSuccessRef = useRef<HTMLHeadingElement>(null);
  const leaveReviewRef = useRef<HTMLHeadingElement>(null);
  const leaveErrorRef = useRef<HTMLParagraphElement>(null);
  const leaveBusyRef = useRef(false);
  const leaveSubmissionRef = useRef<{ fingerprint: string; id: string } | null>(null);

  useLayoutEffect(() => {
    if (!leavePolicyOpen) return;
    if (leaveStep === "form") leaveFormRef.current?.querySelector<HTMLElement>('[role="combobox"]')?.focus();
    else if (leaveStep === "review") leaveReviewRef.current?.focus();
    else if (leaveStep === "saved") leaveSuccessRef.current?.focus();
  }, [leavePolicyOpen, leaveStep]);

  useLayoutEffect(() => {
    if (leavePolicyOpen && leaveError) leaveErrorRef.current?.focus();
  }, [leavePolicyOpen, leaveError]);

  function leaveCalendarDate(value: string) {
    const iso = localDateToIso(value);
    return iso ? new Date(iso) : undefined;
  }

  const leaveCalendarToday = leaveCalendarDate(localTodayIso())!;

  function openLeavePolicy(focusTarget: HTMLElement) {
    leaveTriggerRef.current = focusTarget;
    if (leaveStep === "saved") {
      setLeaveDraft({ type: "vacation", startDate: "", endDate: "" });
      leaveSubmissionRef.current = null;
    }
    setLeaveStep("policy");
    setLeaveError("");
    setLeavePolicyOpen(true);
  }

  function closeLeavePolicy() {
    if (!leaveBusyRef.current && leavePolicyOpen) {
      playSound('close');
      setLeavePolicyOpen(false);
    }
  }

  function reviewLeaveRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (leaveBusyRef.current) return;
    const validation = validateLeaveDraft(leaveDraft);
    if (validation) {
      playSound('warning');
      setLeaveError(leaveErrorText(validation, language));
      return;
    }
    setLeaveError("");
    playSound('navigate');
    setLeaveStep('review');
  }

  function backToLeaveForm() {
    playSound('navigate', { direction: 'back' });
    setLeaveError("");
    setLeaveStep('form');
  }

  async function saveLeaveRequest() {
    if (leaveStep !== 'review' || leaveBusyRef.current) return;
    const validation = validateLeaveDraft(leaveDraft);
    if (validation) {
      playSound('warning');
      setLeaveStep('form');
      setLeaveError(leaveErrorText(validation, language));
      return;
    }
    const fingerprint = JSON.stringify(leaveDraft);
    if (leaveSubmissionRef.current?.fingerprint !== fingerprint) {
      leaveSubmissionRef.current = { fingerprint, id: crypto.randomUUID() };
    }
    const requestId = leaveSubmissionRef.current.id;
    leaveBusyRef.current = true;
    setLeaveSaving(true);
    setLeaveError("");
    try {
      await createLeaveRequest(requestId, leaveDraft);
    } catch (cause) {
      playSound('error');
      setLeaveError(cause instanceof Error
        ? leaveErrorText(cause.message, language)
        : (en ? "Could not save the request." : "No se pudo guardar la solicitud."));
      return;
    } finally {
      leaveBusyRef.current = false;
      setLeaveSaving(false);
    }
    setLeaveStep("saved");
    toast.success({
      title: en ? "Request submitted" : "Solicitud enviada",
      description: en ? "Your coordinator will review it." : "Tu coordinador la revisará.",
    });
    playSound('success');
  }

  const canReviewRequests = canReviewLeaveRequests(profile, members);
  const reviewStartDate = leaveCalendarDate(leaveDraft.startDate);
  const reviewEndDate = leaveCalendarDate(leaveDraft.endDate);
  const reviewDays = reviewStartDate && reviewEndDate
    ? differenceInCalendarDays(reviewEndDate, reviewStartDate) + 1
    : 0;
  const showFirstPeriodNotice = leaveDraft.type === 'vacation' && reviewDays > 0 && reviewDays < LEAVE_POLICY_NOTICE.firstPeriodDays;
  const showShortNotice = requiresNoticeException(leaveDraft);
  const reviewDateLabel = (value: Date | undefined) => value
    ? new Intl.DateTimeFormat(dateLocale, { weekday: 'short', month: 'short', day: 'numeric', timeZone: TZ_MX }).format(value)
    : '';
  const reviewDateYear = (value: Date | undefined) => value
    ? new Intl.DateTimeFormat(dateLocale, { year: 'numeric', timeZone: TZ_MX }).format(value)
    : '';
  const leaveSummary = <div className="home-page__leave-review-frame">
    <div className="home-page__leave-review-type">
      <span className="home-page__leave-review-icon" aria-hidden="true">{leaveDraft.type === "vacation" ? <Sun size="var(--icon-size-md)" /> : <CalendarDays size="var(--icon-size-md)" />}</span>
      <div>
        <span className="type-caption-up">{en ? "Type" : "Tipo"}</span>
        <strong className="type-heading-sm">{en ? (leaveDraft.type === "vacation" ? "Vacation" : "Leave") : leaveTypeLabel(leaveDraft.type)}</strong>
      </div>
    </div>
    <dl className="home-page__leave-review-dates">
      <div><dt className="type-caption-up">{en ? "Start" : "Inicio"}</dt><dd><span className="home-page__leave-review-date-main type-heading-sm">{reviewDateLabel(reviewStartDate)}</span><span className="home-page__leave-review-year">{reviewDateYear(reviewStartDate)}</span></dd></div>
      <ArrowRight className="home-page__leave-review-arrow" aria-hidden="true" size="var(--icon-size-md)" />
      <div><dt className="type-caption-up">{en ? "End" : "Fin"}</dt><dd><span className="home-page__leave-review-date-main type-heading-sm">{reviewDateLabel(reviewEndDate)}</span><span className="home-page__leave-review-year">{reviewDateYear(reviewEndDate)}</span></dd></div>
    </dl>
    <div className="home-page__leave-review-total">
      <span><CalendarDays aria-hidden="true" size="var(--icon-size-sm)" />Total</span>
      <strong className="type-body-strong">{reviewDays} {en ? (reviewDays === 1 ? "day" : "days") : (reviewDays === 1 ? "día" : "días")}</strong>
    </div>
    {showShortNotice && <p className="home-page__leave-review-notice">{en ? "Shorter notice requires approval." : "La menor anticipación requiere autorización."}</p>}
  </div>;
  const leaveErrorNotice = leaveError && <p ref={leaveErrorRef} tabIndex={-1} className="home-page__leave-error type-body-md" role="alert">
    <CircleAlert aria-hidden="true" size="var(--icon-size-md)" />
    <span>{leaveError}</span>
  </p>;
  return (
    <>
      {children({ canReviewRequests, openLeavePolicy })}
      {profile && !canReviewRequests && (
        <HomeLeaveDialog
          triggerRef={leaveTriggerRef}
          isOpen={leavePolicyOpen}
          onClose={closeLeavePolicy}
          onBack={(leaveStep === "form" || leaveStep === "review") && !leaveSaving ? leaveStep === "review" ? backToLeaveForm : () => { playSound('navigate', { direction: 'back' }); setLeaveError(""); setLeaveStep("policy"); } : undefined}
          title={homeText(LEAVE_POLICY_NOTICE.title, language)}
          headerActions={leaveStep === "form" ?
            <button type="button" className="home-page__leave-header-clear" aria-label={en ? "Clear selected dates" : "Limpiar fechas seleccionadas"} disabled={leaveSaving || !leaveDraft.startDate}
              onClick={() => { playSound('tap'); setLeaveDraft(draft => ({ ...draft, startDate: "", endDate: "" })); setLeaveError(""); }}>
              <RotateCcw aria-hidden="true" />
              <span>{en ? "Clear dates" : "Limpiar fechas"}</span>
            </button> : undefined}
          className={`home-page__leave-modal${leaveStep === "form" ? " home-page__leave-modal--form" : ""}`}
          size="sm"
          footerActions={leaveStep === "policy" ?
            <button type="button" className="btn-primary" onClick={() => { playSound('navigate'); setLeaveStep("form"); }}>{en ? "Continue" : "Solicita"}</button>
          : leaveStep === "form" ?
            <button type="submit" form={`${leaveFormId}-form`} className="btn-primary" disabled={leaveSaving || !leaveDraft.startDate || !leaveDraft.endDate}>
              {en ? "Review request" : "Revisar solicitud"}
            </button> :
          leaveStep === "review" ?
            <div className="home-page__leave-review-actions">
              <button type="button" className="btn-secondary" disabled={leaveSaving} onClick={backToLeaveForm}>
                {en ? "Edit dates" : "Editar fechas"}
              </button>
              <button type="button" className="btn-primary" disabled={leaveSaving} onClick={() => void saveLeaveRequest()}>
                {leaveSaving ? (en ? "Saving…" : "Guardando…") : (en ? "Submit request" : "Enviar solicitud")}
              </button>
            </div> :
            <button type="button" className="btn-primary" onClick={closeLeavePolicy}>{en ? "Done" : "Listo"}</button>}
        >
          {leaveStep === "policy" ? <div className="modal-body home-page__leave-policy home-page__leave-policy-step type-body-md">
            <LeaveStepProgress step={1} en={en} />
            <div className="home-page__leave-step-heading">
              <h3 className="type-heading-md">{en ? "Before you request" : "Antes de solicitar"}</h3>
              <p>{homeText(LEAVE_POLICY_NOTICE.introduction, language)}</p>
            </div>
            <ul className="home-page__leave-policy-rules">
              <li><span className="home-page__leave-policy-mark" aria-hidden="true">{LEAVE_NOTICE_DAYS}</span><p><strong>{en ? "Days of notice." : "Días de anticipación."}</strong> {homeText(LEAVE_POLICY_NOTICE.advanceNotice, language)}</p></li>
              <li><span className="home-page__leave-policy-mark" aria-hidden="true">{LEAVE_POLICY_NOTICE.firstPeriodDays}</span><p><strong>{en ? "Consecutive days." : "Días continuos."}</strong> {homeText(LEAVE_POLICY_NOTICE.firstPeriod, language)}</p></li>
              <li><span className="home-page__leave-policy-mark" aria-hidden="true"><Ban size="var(--icon-size-md)" /></span><p><strong>{en ? "Not allowed." : "No permitido."}</strong> {homeText(LEAVE_POLICY_NOTICE.unavailableDates, language)}</p></li>
            </ul>
            <p className="home-page__leave-policy-warning"><TriangleAlert aria-hidden="true" size="var(--icon-size-md)" /><span>{homeText(LEAVE_POLICY_NOTICE.shortNotice, language)}</span></p>
          </div> : leaveStep === "form" ?
            <form ref={leaveFormRef} id={`${leaveFormId}-form`} className="modal-body home-page__leave-policy home-page__leave-form" onSubmit={reviewLeaveRequest} aria-busy={leaveSaving}>
              <LeaveStepProgress step={2} en={en} />
              <div className="home-page__leave-step-heading">
                <h3 className="type-heading-md">{en ? "Choose your dates" : "Elige tus fechas"}</h3>
                <p>{en ? "Pick the type and the days you will be away." : "Elige el tipo de solicitud y los días en que te ausentarás."}</p>
              </div>
              <fieldset className="home-page__leave-fields" disabled={leaveSaving}>
                <legend className="sr-only">{en ? "Request details" : "Datos de la solicitud"}</legend>
                <div className="home-page__leave-aside">
                  <div className="form-group home-page__leave-type">
                    <label htmlFor={`${leaveFormId}-type`}>{en ? "Type" : "Tipo"}</label>
                    <CustomSelect
                      id={`${leaveFormId}-type`}
                      value={leaveDraft.type}
                      options={LEAVE_TYPE_OPTIONS.map(option => ({ ...option, label: en ? (option.value === "vacation" ? "Vacation" : "Leave") : option.label }))}
                      showPlaceholderOption={false}
                      disabled={leaveSaving}
                      aria-required="true"
                      onChange={value => {
                        const option = LEAVE_TYPE_OPTIONS.find(option => option.value === value);
                        if (option) {
                          playSound('select');
                          setLeaveDraft(draft => ({ ...draft, type: option.value }));
                          setLeaveError("");
                        }
                      }}
                    />
                  </div>
                  <div className="home-page__leave-selected">
                    <span className="type-caption-up">{en ? "Selected" : "Selección"}</span>
                    <div className="home-page__leave-bubble">
                      <p role="status" aria-atomic="true">
                      {!leaveDraft.startDate ? (en ? "Select start and end dates" : "Selecciona inicio y fin") : <>
                        <span aria-hidden="true">
                          {!leaveDraft.endDate
                            ? `${date(leaveDraft.startDate).replace(/,?\s+\d{4}$/, "")} · ${en ? "Select end" : "Elige fin"}`
                            : formatCompactDateRange(leaveDraft.startDate, leaveDraft.endDate, dateLocale)}
                        </span>
                        <span className="sr-only">
                          {!leaveDraft.endDate
                            ? (en ? `Start ${date(leaveDraft.startDate)}. Select the end date.` : `Inicio ${date(leaveDraft.startDate)}. Elige la fecha de fin.`)
                            : `${date(leaveDraft.startDate)} ${en ? "to" : "al"} ${date(leaveDraft.endDate)}`}
                        </span>
                      </>}
                      </p>
                    </div>
                  </div>
                </div>
                {(showFirstPeriodNotice || showShortNotice) && <div className="home-page__leave-form-notices">
                  {showFirstPeriodNotice && <p className="home-page__leave-form-warning"><TriangleAlert aria-hidden="true" size="var(--icon-size-md)" /><span>
                    {en ? `First period: at least ${LEAVE_POLICY_NOTICE.firstPeriodDays} days.` : `Primer periodo: mínimo ${LEAVE_POLICY_NOTICE.firstPeriodDays} días.`}
                  </span></p>}
                  {showShortNotice && <p className="home-page__leave-form-warning"><TriangleAlert aria-hidden="true" size="var(--icon-size-md)" /><span>{en ? "Short notice: approval required." : "Menor anticipación: autorización."}</span></p>}
                </div>}
                <fieldset className="home-page__leave-dates">
                  <legend className="sr-only" id={`${leaveFormId}-dates-label`}>{en ? "Dates" : "Fechas"}</legend>
                  <p id={`${leaveFormId}-dates-help`} className="sr-only">
                    {leaveDraft.startDate && !leaveDraft.endDate
                      ? (en ? "Now select the end date. For a single day, select it again." : "Ahora elige la fecha de fin. Para un solo día, vuelve a seleccionarlo.")
                      : (en ? "Select the start date, then the end date." : "Elige la fecha de inicio y después la de fin.")}
                  </p>
                  <div className="home-page__leave-calendar-scroll" role="region" aria-label={en ? "Request calendar" : "Calendario de la solicitud"} tabIndex={0}>
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
                      onMonthChange={() => playSound('navigate')}
                      onSelect={range => {
                        if (range?.from) playSound('select');
                        setLeaveDraft(draft => ({
                          ...draft,
                          startDate: range?.from ? isoToLocalDateString(range.from.toISOString()) : "",
                          endDate: range?.to ? isoToLocalDateString(range.to.toISOString()) : "",
                        }));
                        setLeaveError("");
                      }}
                    />
                  </div>
                </fieldset>
              </fieldset>
              {leaveErrorNotice}
            </form> : leaveStep === "review" ?
            <div className="modal-body home-page__leave-policy home-page__leave-review type-body-md" aria-busy={leaveSaving}>
              <div className="home-page__leave-review-heading">
                <LeaveStepProgress step={3} en={en} />
                <h3 ref={leaveReviewRef} tabIndex={-1} className="type-heading-md">{en ? "Review your request" : "Revisa tu solicitud"}</h3>
                <p>{en ? "Confirm these details before submitting." : "Confirma estos datos antes de enviarla."}</p>
              </div>
              {leaveSummary}
              {leaveErrorNotice}
              <p className="home-page__leave-review-help"><Info aria-hidden="true" size="var(--icon-size-sm)" /><span>{en ? "Your coordinator will validate this request. " : "Tu coordinador validará esta solicitud. "}{homeText(LEAVE_POLICY_NOTICE.handoverReminder, language)}</span></p>
            </div> :
            <div className="modal-body home-page__leave-policy home-page__leave-confirmation type-body-md">
              <div className="home-page__leave-confirmation-heading">
                <span className="home-page__leave-confirmation-icon" aria-hidden="true"><CircleCheckBig size="var(--icon-size-lg)" /></span>
                <div>
                  <h3 ref={leaveSuccessRef} tabIndex={-1} className="home-page__leave-success">{en ? "Your request will be reviewed" : "Se validará tu solicitud"}</h3>
                  <p>{en ? "Your coordinator will review the request and provide the physical forms." : "Tu coordinador revisará la solicitud y te entregará los formatos físicos."}</p>
                </div>
              </div>
              {leaveSummary}
              <p className="home-page__leave-review-help"><Info aria-hidden="true" size="var(--icon-size-sm)" /><span>{homeText(LEAVE_POLICY_NOTICE.handoverReminder, language)}</span></p>
            </div>}
        </HomeLeaveDialog>
      )}
    </>
  );
}

import { useId, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { enUS, es } from "date-fns/locale";
import { validation } from "robot-toast/robots";
import type { Profile } from "@/hooks/useAuth";
import type { TeamMember } from "@/features/team/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calendar } from "@/components/ui/Calendar";
import { BrandMark } from "@/components/ui/BrandMark";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { leaveErrorText } from "@/features/leave/translations";
import {
  canReviewLeaveRequests,
  createLeaveRequest,
  leaveTypeLabel,
  LEAVE_REQUESTS_PATH,
  LEAVE_TYPE_OPTIONS,
  requiresNoticeException,
  validateLeaveDraft,
  type LeaveDraft,
} from "@/features/leave/requests";
import { formatCompactDateRange, formatReadableDate, isoToLocalDateString, localDateToIso, localTodayIso, TZ_MX } from "@/lib/dates";
import { preloadRoute } from "@/lib/routePages";
import { ORGANIZATION_CHART_PATH } from "./navigation";
import { HomeLeaveDialog } from "@/pages/home/HomeLeaveDialog";
import { homeText } from "@/pages/homeTranslations";
import { LEAVE_POLICY_NOTICE } from "@/pages/homeContent";
import "./SidebarQuickActions.css";

type SidebarQuickActionsProps = {
  profile: Profile | null;
  members: readonly TeamMember[];
};

export function SidebarQuickActions({ profile, members }: SidebarQuickActionsProps) {
  const { language } = useLanguage();
  const en = language === "en";
  const dateLocale = en ? "en-US" : "es-MX";
  const date = (value: string) => formatReadableDate(value, dateLocale);
  const [leavePolicyOpen, setLeavePolicyOpen] = useState(false);
  const [leaveStep, setLeaveStep] = useState<"policy" | "form" | "saved">("policy");
  const [leaveDraft, setLeaveDraft] = useState<LeaveDraft>({ type: "vacation", startDate: "", endDate: "" });
  const [leaveSaving, setLeaveSaving] = useState(false);
  const [leaveError, setLeaveError] = useState("");
  const leaveTriggerRef = useRef<HTMLButtonElement>(null);
  const leaveFormId = useId();
  const leaveFormRef = useRef<HTMLFormElement>(null);
  const leaveSuccessRef = useRef<HTMLHeadingElement>(null);
  const leaveErrorRef = useRef<HTMLParagraphElement>(null);
  const leaveBusyRef = useRef(false);
  const leaveSubmissionRef = useRef<{ fingerprint: string; id: string } | null>(null);

  useLayoutEffect(() => {
    if (!leavePolicyOpen) return;
    if (leaveStep === "form") leaveFormRef.current?.querySelector<HTMLElement>('[role="combobox"]')?.focus();
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

  function openLeavePolicy() {
    if (leaveStep === "saved") {
      setLeaveDraft({ type: "vacation", startDate: "", endDate: "" });
      leaveSubmissionRef.current = null;
    }
    setLeaveStep("policy");
    setLeaveError("");
    setLeavePolicyOpen(true);
  }

  function closeLeavePolicy() {
    if (!leaveBusyRef.current) setLeavePolicyOpen(false);
  }

  async function saveLeaveRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (leaveBusyRef.current) return;
    const validation = validateLeaveDraft(leaveDraft);
    if (validation) {
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
      setLeaveStep("saved");
    } catch (cause) {
      setLeaveError(cause instanceof Error
        ? leaveErrorText(cause.message, language)
        : (en ? "Could not save the request." : "No se pudo guardar la solicitud."));
    } finally {
      leaveBusyRef.current = false;
      setLeaveSaving(false);
    }
  }

  const canReviewRequests = canReviewLeaveRequests(profile, members);
  const requestLabel = en ? "Leave" : "Solicitar";
  const manageLabel = en ? "Requests" : "Gestionar";
  const organizationLabel = en ? "Org chart" : "Organigrama";

  return (
    <>
      <div className="sidebar__quick-actions" role="group" aria-label={en ? "Quick actions" : "Accesos rápidos"}>
        {canReviewRequests ? (
          <Link
            className="sidebar__quick-action"
            to={LEAVE_REQUESTS_PATH}
            onPointerEnter={() => preloadRoute(LEAVE_REQUESTS_PATH)}
            onFocus={() => preloadRoute(LEAVE_REQUESTS_PATH)}
          >
            <span className="sidebar__quick-action-label">{manageLabel}</span>
          </Link>
        ) : (
          <button
            ref={leaveTriggerRef}
            type="button"
            className="sidebar__quick-action"
            aria-haspopup="dialog"
            aria-expanded={leavePolicyOpen}
            onClick={openLeavePolicy}
          >
            <span className="sidebar__quick-action-label">{requestLabel}</span>
          </button>
        )}
        <Link
          className="sidebar__quick-action"
          to={ORGANIZATION_CHART_PATH}
          onPointerEnter={() => preloadRoute(ORGANIZATION_CHART_PATH)}
          onFocus={() => preloadRoute(ORGANIZATION_CHART_PATH)}
        >
          <span className="sidebar__quick-action-label">{organizationLabel}</span>
        </Link>
      </div>
      {!canReviewRequests && (
        <HomeLeaveDialog
          triggerRef={leaveTriggerRef}
          isOpen={leavePolicyOpen}
          onClose={closeLeavePolicy}
          onBack={leaveStep === "form" && !leaveSaving ? () => { setLeaveError(""); setLeaveStep("policy"); } : undefined}
          title={homeText(LEAVE_POLICY_NOTICE.title, language)}
          className={`home-page__leave-modal${leaveStep === "form" ? " home-page__leave-modal--form" : ""}`}
          size={leaveStep === "form" ? "md" : "sm"}
          footerActions={leaveStep === "policy" ?
            <button type="button" className="btn-primary" onClick={() => setLeaveStep("form")}>{en ? "Continue" : "Solicita"}</button>
          : leaveStep === "form" ?
            <button type="submit" form={`${leaveFormId}-form`} className="btn-primary" disabled={leaveSaving || !leaveDraft.startDate || !leaveDraft.endDate}>
              {leaveSaving ? (en ? "Saving…" : "Guardando…") : (en ? "Submit request" : "Hacer solicitud")}
            </button> :
            <button type="button" className="btn-primary" onClick={closeLeavePolicy}>{en ? "Done" : "Listo"}</button>}
        >
          {leaveStep === "policy" ? <div className="modal-body home-page__leave-policy type-body-md">
            <p>{homeText(LEAVE_POLICY_NOTICE.introduction, language)}</p>
            <ul>{LEAVE_POLICY_NOTICE.points.map(point => <li key={point}>{homeText(point, language)}</li>)}</ul>
          </div> : leaveStep === "form" ?
            <form ref={leaveFormRef} id={`${leaveFormId}-form`} className="modal-body home-page__leave-policy home-page__leave-form" onSubmit={saveLeaveRequest} aria-busy={leaveSaving}>
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
                          setLeaveDraft(draft => ({ ...draft, type: option.value }));
                          setLeaveError("");
                        }
                      }}
                    />
                  </div>
                  <div className="home-page__leave-art">
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
                      {requiresNoticeException(leaveDraft) && <p className="home-page__leave-bubble-note">
                        {en ? "Approval required" : "Requiere autorización"}
                      </p>}
                      {leaveDraft.startDate && <button type="button" className="btn-icon home-page__leave-clear" aria-label={en ? "Clear selected dates" : "Limpiar fechas seleccionadas"} title={en ? "Clear dates" : "Limpiar fechas"} disabled={leaveSaving}
                        onClick={() => { setLeaveDraft(draft => ({ ...draft, startDate: "", endDate: "" })); setLeaveError(""); }}>
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
                      onSelect={range => {
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
              {leaveError && <p ref={leaveErrorRef} tabIndex={-1} className="form-error-text type-body-md" role="alert">{leaveError}</p>}
            </form> :
            <div className="modal-body home-page__leave-policy type-body-md">
              <h3 ref={leaveSuccessRef} tabIndex={-1} className="home-page__leave-success">{en ? "Your request will be reviewed" : "Se validará tu solicitud"}</h3>
              <p>{en ? (leaveDraft.type === "vacation" ? "Vacation" : "Leave") : leaveTypeLabel(leaveDraft.type)}: {date(leaveDraft.startDate)} {en ? "to" : "al"} {date(leaveDraft.endDate)}.</p>
              <p>{en ? "Your coordinator will review the request and provide the physical forms." : "Tu coordinador revisará la solicitud y te entregará los formatos físicos."}</p>
              <p>{homeText(LEAVE_POLICY_NOTICE.handoverReminder, language)}</p>
            </div>}
        </HomeLeaveDialog>
      )}
    </>
  );
}

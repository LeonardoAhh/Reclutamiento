import { useState, useMemo, useRef } from "react";
import { Bus, CircleAlert } from "lucide-react";
import { Copy as CopyIconData, LoaderCircle as LoaderCircleIconData } from "lucide";
import { toBlob } from "html-to-image";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useRutas } from "@/hooks/useRutas";
import {
  formatIsoWeekRange,
  isInIsoWeek,
  isoWeekOf,
  localDateToIso,
  localTodayIso,
  type IsoWeekRange,
} from "@/lib/dates";
import { WeeklyOnboardingDocuments } from "./components/WeeklyOnboardingDocuments";
import { ButtonUtility } from "@/components/ui/ButtonUtility";
import { MorphingIcon } from "@/components/ui/MorphingIcon";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { BoneyardSkeleton } from "@/components/ui/BoneyardSkeleton";
import { toast } from "@/lib/notify";
import { isRouteAssignmentEligibleShift } from "./formatos-helpers";
import { useLanguage } from "@/contexts/LanguageContext";
import { getConfiguracionCopy } from "./configuracion-translations";
import "./FormatosView.css";

interface AvailableWeek {
  value: string;
  label: string;
  range: IsoWeekRange;
}

function getWeekRange(isoDate: string): IsoWeekRange | null {
  const timestamp = localDateToIso(isoDate);
  return timestamp ? isoWeekOf(timestamp) : null;
}

function getWeekKey(range: IsoWeekRange) {
  return `${range.year}-W${String(range.week).padStart(2, "0")}`;
}

function getWeekLabel(range: IsoWeekRange, language: "es" | "en") {
  if (language === "es") return `Semana ${range.week} · ${formatIsoWeekRange(range)} ${range.year}`;
  const workWeekEnd = new Date(range.end.getTime() - 2 * 24 * 60 * 60 * 1000);
  const start = range.start.toLocaleDateString("en-US", { day: "numeric", month: "short", timeZone: "America/Mexico_City" });
  const end = workWeekEnd.toLocaleDateString("en-US", { day: "numeric", month: "short", timeZone: "America/Mexico_City" });
  return `Week ${range.week} · ${start} - ${end} ${range.year}`;
}

function toAvailableWeek(range: IsoWeekRange, language: "es" | "en"): AvailableWeek {
  return {
    value: getWeekKey(range),
    label: getWeekLabel(range, language),
    range,
  };
}

export function FormatosView() {
  const { language } = useLanguage();
  const copy = getConfiguracionCopy(language).formats;
  const {
    employees,
    loading: employeesLoading,
    error: employeesError,
  } = useSupabaseData();
  const { rutas, loading: rutasLoading } = useRutas();

  const currentWeek = useMemo(
    () => getWeekRange(localTodayIso()) ?? isoWeekOf(new Date()),
    [],
  );
  const [selectedWeekKey, setSelectedWeekKey] = useState(() =>
    getWeekKey(currentWeek),
  );
  const [selectedRouteDate, setSelectedRouteDate] = useState(localTodayIso());
  const tableRef = useRef<HTMLDivElement>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Crear un mapa de búsqueda rápida para las rutas desde el JSON
  const rutaLookup = useMemo(() => {
    const lookup = new Map<string, { nombreRuta: string; parada: string }>();
    if (!rutas) return lookup;

    rutas.forEach((grupoRuta) => {
      grupoRuta.empleados.forEach((empRuta) => {
        // Guardamos por num_empleado normalizado
        const numKey = String(empRuta.numeroEmpleado).trim().replace(/^0+/, "");
        lookup.set(numKey, {
          nombreRuta: empRuta.nombreRuta,
          parada: empRuta.parada,
        });
      });
    });
    return lookup;
  }, [rutas]);

  const availableWeeks = useMemo(() => {
    const weeks = new Map<string, AvailableWeek>();
    const current = toAvailableWeek(currentWeek, language);
    weeks.set(current.value, current);

    for (const employee of employees) {
      const range = getWeekRange(employee.fecha_ingreso);
      if (!range) continue;
      const option = toAvailableWeek(range, language);
      weeks.set(option.value, option);
    }

    return Array.from(weeks.values()).sort((first, second) =>
      second.value.localeCompare(first.value),
    );
  }, [currentWeek, employees, language]);

  const selectedWeek =
    availableWeeks.find((week) => week.value === selectedWeekKey) ??
    toAvailableWeek(currentWeek, language);

  const weeklyEmployees = useMemo(
    () =>
      employees
        .filter((employee) =>
          isInIsoWeek(employee.fecha_ingreso, selectedWeek.range),
        )
        .sort((first, second) =>
          first.nombre.localeCompare(second.nombre, "es"),
        ),
    [employees, selectedWeek.range],
  );

  const filteredEmployees = useMemo(() => {
    return employees
      .filter((employee) => employee.fecha_ingreso === selectedRouteDate)
      .filter((employee) =>
        isRouteAssignmentEligibleShift(employee.turno),
      )
      .map((employee) => {
        const numKey = String(employee.num_empleado).trim().replace(/^0+/, "");
        const routeData = rutaLookup.get(numKey);

        return {
          ...employee,
          ruta_final: employee.ruta || routeData?.nombreRuta || "",
          parada_final: employee.parada || routeData?.parada || "",
        };
      });
  }, [employees, rutaLookup, selectedRouteDate]);

  const handleCopyImage = async () => {
    const sourceNode = tableRef.current;
    if (!sourceNode) return;
    const routeSection = sourceNode.closest(".recordatorios-routes");
    if (!routeSection) {
      toast.error({ title: copy.prepareImageError });
      return;
    }
    let captureHost: HTMLDivElement | null = null;

    try {
      setIsGeneratingImage(true);

      const captureNode = sourceNode.cloneNode(true) as HTMLDivElement;
      captureNode.classList.add("is-exporting");
      captureNode.setAttribute("aria-hidden", "true");
      captureNode.style.width = `${sourceNode.getBoundingClientRect().width}px`;

      captureHost = document.createElement("div");
      captureHost.setAttribute("aria-hidden", "true");
      captureHost.style.position = "fixed";
      captureHost.style.insetBlockStart = "0";
      captureHost.style.insetInlineStart = "-100vw";
      captureHost.style.width = captureNode.style.width;

      let captureTree: HTMLElement = captureNode;
      let ancestor = sourceNode.parentElement;
      while (ancestor) {
        const ancestorClone = ancestor.cloneNode(false) as HTMLElement;
        ancestorClone.append(captureTree);
        captureTree = ancestorClone;
        if (ancestor === routeSection) break;
        ancestor = ancestor.parentElement;
      }
      captureHost.append(captureTree);
      document.body.append(captureHost);

      const documentPaper = getComputedStyle(document.documentElement)
        .getPropertyValue("--color-document-paper")
        .trim();

      const blob = await toBlob(captureNode, {
        backgroundColor: documentPaper || undefined,
        width: captureNode.scrollWidth,
        height: captureNode.scrollHeight,
      });

      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob }),
        ]);
        toast.success({ title: copy.imageCopied });
      } else {
        throw new Error(copy.prepareImageError);
      }
    } catch (err) {
      console.error("Error generating or copying image:", err);
      toast.error({ title: copy.imageCopyError });
    } finally {
      captureHost?.remove();
      setIsGeneratingImage(false);
    }
  };

  const loading = employeesLoading || rutasLoading;

  return (
    <BoneyardSkeleton
      name="configuracion-formatos"
      loading={loading}
      loadingLabel={copy.loading}
    >
      <section
        className="config-page formatos-page"
        aria-labelledby="formatos-page-title"
      >
        <header className="formatos-page__header">
          <h1 id="formatos-page-title" className="config-page__title app-page-title">
            {copy.title}
          </h1>
          <label className="config-filter-field formatos-page__week-filter">
            <CustomSelect
              id="formatos-week"
              value={selectedWeek.value}
              onChange={setSelectedWeekKey}
              aria-label={copy.hireWeek}
              options={availableWeeks.map((week) => ({
                value: week.value,
                label: week.label,
              }))}
            />
          </label>
        </header>

        <div className="config-page__content">
          {employeesError && (
            <p
              className="formatos-page__error type-body-sm text-error"
              role="alert"
            >
              {copy.employeeProblem}
            </p>
          )}

          <div className="config-results-wrapper">
            <WeeklyOnboardingDocuments
              employees={weeklyEmployees}
              weekLabel={getWeekLabel(selectedWeek.range, "es")}
              printDate={localTodayIso()}
            />

            <section
              className="recordatorios-routes"
              aria-labelledby="recordatorios-routes-title"
            >
            <header className="recordatorios-routes__header">
              <div>
                <h2
                  id="recordatorios-routes-title"
                  className="recordatorios-routes__title"
                >
                  {copy.routeAssignment}
                </h2>
              </div>
            </header>

            <section
              className="config-results-controls recordatorios-route-controls"
              aria-label={copy.routeDateAndCopy}
            >
              <div className="config-results-controls__filters recordatorios-route-controls__grid">
                <label className="config-filter-field recordatorios-route-date-field">
                  <span className="config-filter-label type-caption-sm text-muted">
                    {copy.hireDate}
                  </span>
                  <input
                    type="date"
                    className="config-filter-select"
                    value={selectedRouteDate}
                    onChange={(event) =>
                      setSelectedRouteDate(event.target.value)
                    }
                  />
                </label>

                <ButtonUtility
                  type="button"
                  className="config-filter-reset"
                  icon={
                    <MorphingIcon
                      icon={isGeneratingImage ? LoaderCircleIconData : CopyIconData}
                      size="var(--icon-size-sm)"
                      className={isGeneratingImage ? "spin" : undefined}
                      aria-hidden="true"
                    />
                  }
                  onClick={handleCopyImage}
                  disabled={filteredEmployees.length === 0 || isGeneratingImage}
                  aria-label={isGeneratingImage ? copy.copying : copy.copy}
                  aria-busy={isGeneratingImage}
                  aria-describedby={
                    filteredEmployees.length === 0
                      ? "recordatorios-routes-empty"
                      : undefined
                  }
                >
                  {copy.copy}
                </ButtonUtility>
              </div>
            </section>

            {filteredEmployees.length === 0 ? (
              <div
                id="recordatorios-routes-empty"
                className="config-filter-empty"
                role="status"
              >
                <Bus size={32} aria-hidden="true" />
                <p className="type-body-md text-charcoal">
                  {copy.noApplicableHires}
                </p>
              </div>
            ) : (
              <div className="config-card">
                <div
                  className="table-responsive recordatorios-table-region"
                  tabIndex={0}
                  role="region"
                  aria-label={copy.routeAssignment}
                >
                  <div ref={tableRef} className="recordatorios-export-canvas">
                    <table className="config-table recordatorios-table">
                      <caption className="sr-only">
                        {copy.routeAssignment} · {selectedRouteDate}
                      </caption>
                      <thead>
                        <tr>
                          <th
                            scope="col"
                            className="recordatorios-table__cell--left"
                          >
                            {copy.employeeNumber}
                          </th>
                          <th
                            scope="col"
                            className="recordatorios-table__cell--left"
                          >
                            {copy.name}
                          </th>
                          <th
                            scope="col"
                            className="recordatorios-table__cell--center"
                          >
                            {copy.shift}
                          </th>
                          <th
                            scope="col"
                            className="recordatorios-table__cell--left"
                          >
                            {copy.routeName}
                          </th>
                          <th
                            scope="col"
                            className="recordatorios-table__cell--left"
                          >
                            {copy.stop}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEmployees.map((emp) => (
                          <tr key={emp.id || emp.num_empleado}>
                            <td
                              data-label={copy.employeeNumber}
                              className="type-body-sm font-medium text-ink recordatorios-table__cell--left"
                            >
                              {emp.num_empleado}
                            </td>
                            <td
                              data-label={copy.name}
                              className="type-body-sm text-charcoal recordatorios-table__cell--left"
                            >
                              {emp.nombre}
                            </td>
                            <td
                              data-label={copy.shift}
                              className="type-body-sm text-charcoal recordatorios-table__cell--center"
                            >
                              {emp.turno || (
                                <span className="text-error">{copy.missingShift}</span>
                              )}
                            </td>
                            <td
                              data-label={copy.routeName}
                              className="type-body-sm text-charcoal recordatorios-table__cell--left"
                            >
                              {emp.ruta_final ? (
                                emp.ruta_final
                              ) : (
                                <span className="text-error recordatorios-missing-data">
                                  <CircleAlert size={14} aria-hidden="true" />{" "}
                                  {copy.missingData}
                                </span>
                              )}
                            </td>
                            <td
                              data-label={copy.stop}
                              className="type-body-sm text-charcoal recordatorios-table__cell--left"
                            >
                              {emp.parada_final ? (
                                emp.parada_final
                              ) : (
                                <span className="text-error recordatorios-missing-data">
                                  <CircleAlert size={14} aria-hidden="true" />{" "}
                                  {copy.missingData}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            </section>
          </div>
        </div>
      </section>
    </BoneyardSkeleton>
  );
}

import { useState, useMemo, useRef } from "react";
import { Bus, AlertCircle, Copy } from "lucide-react";
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
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Skeleton } from "@/components/ui/Skeleton";
import { sileo } from "@/lib/notify";
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

function getWeekLabel(range: IsoWeekRange) {
  return `Semana ${range.week} · ${formatIsoWeekRange(range)} ${range.year}`;
}

function toAvailableWeek(range: IsoWeekRange): AvailableWeek {
  return {
    value: getWeekKey(range),
    label: getWeekLabel(range),
    range,
  };
}

export function FormatosView() {
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
    const current = toAvailableWeek(currentWeek);
    weeks.set(current.value, current);

    for (const employee of employees) {
      const range = getWeekRange(employee.fecha_ingreso);
      if (!range) continue;
      const option = toAvailableWeek(range);
      weeks.set(option.value, option);
    }

    return Array.from(weeks.values()).sort((first, second) =>
      second.value.localeCompare(first.value),
    );
  }, [currentWeek, employees]);

  const selectedWeek =
    availableWeeks.find((week) => week.value === selectedWeekKey) ??
    toAvailableWeek(currentWeek);

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
      .filter(
        (employee) =>
          String(employee.turno ?? "")
            .trim()
            .toLocaleLowerCase("es") !== "mixto",
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

  const selectedWeekLabel = selectedWeek.label;

  const handleCopyImage = async () => {
    if (!tableRef.current) return;

    try {
      setIsGeneratingImage(true);

      const node = tableRef.current;
      node.classList.add("is-exporting");
      const documentPaper = getComputedStyle(document.documentElement)
        .getPropertyValue("--color-document-paper")
        .trim();

      const blob = await toBlob(node, {
        backgroundColor: documentPaper || undefined,
        width: node.scrollWidth,
        height: node.scrollHeight,
      });

      node.classList.remove("exporting-image");

      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob }),
        ]);
        sileo.success({ title: "Imagen copiada al portapapeles" });
      } else {
        throw new Error("No se pudo generar el Blob de la imagen");
      }
    } catch (err) {
      console.error("Error generating or copying image:", err);
      sileo.error({ title: "Error al copiar la imagen" });
    } finally {
      tableRef.current?.classList.remove("is-exporting");
      setIsGeneratingImage(false);
    }
  };

  const loading = employeesLoading || rutasLoading;

  if (loading) {
    return (
      <section className="config-page" aria-busy="true">
        <div className="config-page__content">
          <Skeleton
            variant="rect"
            width="100%"
            height="var(--touch-target-min)"
            radius="var(--rounded-md)"
          />
          <div className="recordatorios-skeleton">
            <Skeleton
              variant="rect"
              width="100%"
              height="var(--skeleton-card-height)"
              radius="var(--rounded-md)"
            />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="config-page">
      <div className="config-page__content">
        {employeesError && (
          <p className="type-body-sm text-error" role="alert">
            Hubo un problema al cargar los empleados.
          </p>
        )}

        <div className="config-results-wrapper">
          <section
            className="config-results-controls"
            aria-label="Seleccionar semana"
          >
            <div className="config-results-controls__filters recordatorios-week-controls">
              <label className="config-filter-field recordatorios-week-field">
                <span className="config-filter-label type-caption-sm text-muted">
                  Semana de ingreso
                </span>
                <CustomSelect
                  value={selectedWeek.value}
                  onChange={setSelectedWeekKey}
                  options={availableWeeks.map((week) => ({
                    value: week.value,
                    label: week.label,
                  }))}
                />
              </label>
            </div>
          </section>

          <WeeklyOnboardingDocuments
            employees={weeklyEmployees}
            weekLabel={selectedWeekLabel}
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
                  Asignación de rutas
                </h2>
                <p className="recordatorios-routes__subtitle">
                  Selecciona la fecha exacta de ingreso para preparar el
                  listado.
                </p>
              </div>
            </header>

            <section
              className="config-results-controls recordatorios-route-controls"
              aria-label="Fecha y copia de rutas"
            >
              <div className="config-results-controls__filters recordatorios-route-controls__grid">
                <label className="config-filter-field recordatorios-route-date-field">
                  <span className="config-filter-label type-caption-sm text-muted">
                    Fecha de ingreso
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
                  icon={<Copy aria-hidden="true" />}
                  onClick={handleCopyImage}
                  disabled={filteredEmployees.length === 0 || isGeneratingImage}
                >
                  {isGeneratingImage ? "Generando..." : "Copiar"}
                </ButtonUtility>
              </div>
            </section>

            {filteredEmployees.length === 0 ? (
              <div className="config-filter-empty" role="status">
                <Bus size={32} aria-hidden="true" />
                <p className="type-body-md text-charcoal">
                  No hay ingresos aplicables al listado de rutas para la fecha
                  seleccionada.
                </p>
              </div>
            ) : (
              <div className="config-card">
                <div
                  className="table-responsive recordatorios-table-region"
                  tabIndex={0}
                  role="region"
                  aria-label="Asignación de rutas"
                >
                  <div ref={tableRef} className="recordatorios-export-canvas">
                    <table className="config-table recordatorios-table">
                      <caption className="sr-only">
                        Asignación de rutas para {selectedRouteDate}
                      </caption>
                      <thead>
                        <tr>
                          <th
                            scope="col"
                            className="recordatorios-table__cell--left"
                          >
                            No. Emp
                          </th>
                          <th
                            scope="col"
                            className="recordatorios-table__cell--left"
                          >
                            Nombre
                          </th>
                          <th
                            scope="col"
                            className="recordatorios-table__cell--center"
                          >
                            Turno
                          </th>
                          <th
                            scope="col"
                            className="recordatorios-table__cell--left"
                          >
                            Nombre Ruta
                          </th>
                          <th
                            scope="col"
                            className="recordatorios-table__cell--left"
                          >
                            Parada
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEmployees.map((emp) => (
                          <tr key={emp.id || emp.num_empleado}>
                            <td className="type-body-sm font-medium text-ink recordatorios-table__cell--left">
                              {emp.num_empleado}
                            </td>
                            <td className="type-body-sm text-charcoal recordatorios-table__cell--left">
                              {emp.nombre}
                            </td>
                            <td className="type-body-sm text-charcoal recordatorios-table__cell--center">
                              {emp.turno || (
                                <span className="text-error">Falta turno</span>
                              )}
                            </td>
                            <td className="type-body-sm text-charcoal recordatorios-table__cell--left">
                              {emp.ruta_final ? (
                                emp.ruta_final
                              ) : (
                                <span className="text-error recordatorios-missing-data">
                                  <AlertCircle size={14} aria-hidden="true" />{" "}
                                  Faltan datos
                                </span>
                              )}
                            </td>
                            <td className="type-body-sm text-charcoal recordatorios-table__cell--left">
                              {emp.parada_final ? (
                                emp.parada_final
                              ) : (
                                <span className="text-error recordatorios-missing-data">
                                  <AlertCircle size={14} aria-hidden="true" />{" "}
                                  Faltan datos
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
  );
}

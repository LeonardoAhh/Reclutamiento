import { useState, useMemo, useRef } from "react";
import { Bus, AlertCircle, Copy } from "lucide-react";
import { toBlob } from "html-to-image";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useRutas } from "@/hooks/useRutas";
import { localTodayIso } from "@/lib/dates";
import { ButtonUtility } from "@/components/ui/ButtonUtility";
import { Skeleton } from "@/components/ui/Skeleton";
import { sileo } from "@/lib/notify";
import "./RecordatoriosView.css";

export function RecordatoriosView() {
  const {
    employees,
    loading: employeesLoading,
    error: employeesError,
  } = useSupabaseData();
  const { rutas, loading: rutasLoading } = useRutas();

  const [selectedDate, setSelectedDate] = useState(localTodayIso());
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

  const filteredEmployees = useMemo(() => {
    return employees
      .filter((emp) => emp.fecha_ingreso === selectedDate && emp.turno?.toLowerCase() !== "mixto")
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
      .map((emp) => {
        const numKey = String(emp.num_empleado).trim().replace(/^0+/, "");
        const datosRuta = rutaLookup.get(numKey);

        return {
          ...emp,
          ruta_final: emp.ruta || datosRuta?.nombreRuta || "",
          parada_final: emp.parada || datosRuta?.parada || "",
        };
      });
  }, [employees, selectedDate, rutaLookup]);

  const handleCopyImage = async () => {
    if (!tableRef.current) return;

    try {
      setIsGeneratingImage(true);

      const node = tableRef.current;
      node.classList.add("exporting-image");

      const width = node.scrollWidth + 16;
      const height = node.scrollHeight + 16;

      const blob = await toBlob(node, {
        backgroundColor: "#ffffff",
        width: width,
        height: height,
        style: {
          padding: "8px",
          margin: "0",
        },
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
          <div style={{ marginTop: "var(--spacing-lg)" }}>
            <Skeleton
              variant="rect"
              width="100%"
              height="200px"
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

        <div className="config-results-wrapper">          <section
            className="config-results-controls recordatorios-controls"
            aria-label="Filtros y exportación"
          >
            <div className="config-results-controls__filters recordatorios-filters-grid">
              <label className="config-filter-field recordatorios-filter-group">
                <span className="config-filter-label type-caption-sm text-muted">
                  Fecha de ingreso
                </span>
                <input
                  id="fecha-ingreso-filter"
                  type="date"
                  className="config-filter-select"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
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
                No hay ingresos registrados para la fecha seleccionada.
              </p>
            </div>
          ) : (
            <div className="config-card">
              <div
                className="table-responsive recordatorios-table-wrapper"
                tabIndex={0}
                role="region"
              >
                <div
                  ref={tableRef}
                  className="recordatorios-table-container"
                >
                  <table className="indicadores-table config-table whatsapp-export-table">
                    <caption className="sr-only">
                      Asignación de rutas para el {selectedDate}
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col" className="recordatorios-cell-left">
                          No. Emp
                        </th>
                        <th scope="col" className="recordatorios-cell-left">
                          Nombre
                        </th>
                        <th scope="col" className="recordatorios-cell-center">
                          Turno
                        </th>
                        <th scope="col" className="recordatorios-cell-left">
                          Nombre Ruta
                        </th>
                        <th scope="col" className="recordatorios-cell-left">
                          Parada
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.map((emp) => (
                        <tr key={emp.id || emp.num_empleado}>
                          <td className="type-body-sm font-medium text-ink recordatorios-cell-left">
                            {emp.num_empleado}
                          </td>
                          <td className="type-body-sm text-charcoal recordatorios-cell-left">
                            {emp.nombre}
                          </td>
                          <td className="type-body-sm text-charcoal recordatorios-cell-center">
                            {emp.turno || (
                              <span className="text-error">Falta turno</span>
                            )}
                          </td>
                          <td className="type-body-sm text-charcoal recordatorios-cell-left">
                            {emp.ruta_final ? (
                              emp.ruta_final
                            ) : (
                              <span className="recordatorios-error-inline">
                                <AlertCircle size={14} /> Faltan datos
                              </span>
                            )}
                          </td>
                          <td className="type-body-sm text-charcoal recordatorios-cell-left">
                            {emp.parada_final ? (
                              emp.parada_final
                            ) : (
                              <span className="recordatorios-error-inline">
                                <AlertCircle size={14} /> Faltan datos
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
        </div>
      </div>
    </section>
  );
}

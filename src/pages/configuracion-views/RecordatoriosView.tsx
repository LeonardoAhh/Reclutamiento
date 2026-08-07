import { useState, useMemo, useRef } from "react";
import { Bus, AlertCircle, Copy } from "lucide-react";
import { toBlob } from "html-to-image";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useRutas } from "@/hooks/useRutas";
import { localTodayIso } from "@/lib/dates";
import { ButtonUtility } from "@/components/ui/ButtonUtility";
import { Skeleton } from "@/components/ui/Skeleton";
import { sileo } from "@/lib/notify";

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
      .filter((emp) => emp.fecha_ingreso === selectedDate)
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

        <div className="config-results-wrapper">
          <style>{`
            .whatsapp-export-table {
              border-collapse: collapse;
              width: 100%;
            }
            .whatsapp-export-table th, 
            .whatsapp-export-table td {
              border: 1px solid #000000 !important;
              color: #000000 !important;
            }
            .whatsapp-export-table th {
              font-weight: 700 !important;
            }
            .whatsapp-export-table td {
              font-weight: 500 !important;
            }
          `}</style>

          <section
            className="config-results-controls"
            aria-label="Filtros y exportación"
          >
            <div
              className="config-results-controls__filters"
              style={{ gridTemplateColumns: "minmax(0, 1fr) auto" }}
            >
              <label
                className="config-filter-field"
                style={{ maxWidth: "240px" }}
              >
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
                className="table-responsive"
                tabIndex={0}
                role="region"
                style={{
                  border: "1px solid var(--color-hairline-soft)",
                  borderRadius: "var(--rounded-md)",
                  overflowX: "auto",
                }}
              >
                <div
                  ref={tableRef}
                  style={{
                    width: "max-content",
                    minWidth: "100%",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <table className="indicadores-table config-table whatsapp-export-table">
                    <caption className="sr-only">
                      Asignación de rutas para el {selectedDate}
                    </caption>
                    <thead style={{ backgroundColor: "var(--color-surface-hover)" }}>
                      <tr>
                        <th scope="col" style={{ textAlign: "left" }}>
                          No. Emp
                        </th>
                        <th scope="col" style={{ textAlign: "left" }}>
                          Nombre
                        </th>
                        <th scope="col" style={{ textAlign: "center" }}>
                          Turno
                        </th>
                        <th scope="col" style={{ textAlign: "left" }}>
                          Nombre Ruta
                        </th>
                        <th scope="col" style={{ textAlign: "left" }}>
                          Parada
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.map((emp) => (
                        <tr key={emp.id || emp.num_empleado}>
                          <td className="type-body-sm font-medium text-ink" style={{ textAlign: "left" }}>
                            {emp.num_empleado}
                          </td>
                          <td className="type-body-sm text-charcoal" style={{ textAlign: "left" }}>
                            {emp.nombre}
                          </td>
                          <td className="type-body-sm text-charcoal" style={{ textAlign: "center" }}>
                            {emp.turno || (
                              <span className="text-error">Falta turno</span>
                            )}
                          </td>
                          <td className="type-body-sm text-charcoal" style={{ textAlign: "left" }}>
                            {emp.ruta_final ? (
                              emp.ruta_final
                            ) : (
                              <span
                                className="text-error"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "var(--spacing-xs)",
                                }}
                              >
                                <AlertCircle size={14} /> Faltan datos
                              </span>
                            )}
                          </td>
                          <td className="type-body-sm text-charcoal" style={{ textAlign: "left" }}>
                            {emp.parada_final ? (
                              emp.parada_final
                            ) : (
                              <span
                                className="text-error"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "var(--spacing-xs)",
                                }}
                              >
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

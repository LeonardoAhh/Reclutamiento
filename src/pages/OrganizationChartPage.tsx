import { useLayoutEffect, useRef, useState } from "react";
import type { Ref } from "react";
import { PositionAvatar } from "@/features/organization-chart/PositionAvatar";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/ui/Reveal";
import "./OrganizationChartPage.css";

const MANAGER_REPORTS = [
  "Analista de Capacitación",
  "Analista de Seguridad e Higiene",
  "Analista de Reclutamiento y Selección",
] as const;

const COORDINATOR_REPORTS = [
  "Analista de Reclutamiento y Selección A",
  "Analista de Reclutamiento y Selección B",
] as const;

const HEAD_ANALYST_REPORTS = [
  "Analista de Recursos Humanos",
  "Analista de Capacitación",
  "Analista de Seguridad e Higiene",
] as const;

const CLEANING_REPORTS = ["Auxiliar de Limpieza A", "Auxiliar de Limpieza B", "Auxiliar de Limpieza B", "Auxiliar de Limpieza B"] as const;
const CLEANING_EMPLOYEES = ["330", "3520", "4097", "3999"] as const;

type PositionLevel = 5 | 7 | 8 | 10 | 11 | 14;

const QRO_POSITION_EMPLOYEES = {
  "Gerente de Recursos Humanos": null,
  "Jefe de Recursos Humanos QRO": "3160",
  "Coordinador de Reclutamiento y Selección": "3204",
  "Analista de Capacitación": "4023",
  "Analista de Seguridad e Higiene": "3853",
  "Analista de Reclutamiento y Selección": null,
  "Analista de Reclutamiento y Selección A": "3376",
  "Analista de Reclutamiento y Selección B": "3884",
  "Analista de Recursos Humanos": "3818",
  "Auxiliar de Recursos Humanos": "2099",
  "Auxiliar de Limpieza A": "330",
  "Auxiliar de Limpieza B": null,
} as const;

type PositionTitle = keyof typeof QRO_POSITION_EMPLOYEES;

function PositionPhoto({ level, title, location, employeeNumber }: { level: PositionLevel; title: PositionTitle; location?: string; employeeNumber?: string | null }) {
  return (
    <div className="organization-chart-page__portrait">
      <div className="organization-chart-page__frame">
        <PositionAvatar title={title} identity={employeeNumber ?? title} level={level} />
        <span className="organization-chart-page__portrait-fade" aria-hidden="true" />
        {location && <Badge className="organization-chart-page__location-badge">{location}</Badge>}
        <Badge variant="neutral-solid" className="organization-chart-page__photo-badge">Nivel {level}</Badge>
      </div>
    </div>
  );
}

function PositionCard({ level, title, location, headingLevel = 4, onClick, buttonRef, employeeNumber }: {
  level: PositionLevel;
  title: PositionTitle;
  location?: string;
  headingLevel?: 3 | 4;
  onClick?: () => void;
  buttonRef?: Ref<HTMLButtonElement>;
  employeeNumber?: string;
}) {
  const Heading = headingLevel === 3 ? "h3" : "h4";

  return (
    <Reveal as="article" className={`organization-chart-page__report card${onClick ? " organization-chart-page__report--action" : ""}`}>
      <PositionPhoto level={level} title={title} location={location} employeeNumber={employeeNumber ?? QRO_POSITION_EMPLOYEES[title]} />
      <div className="organization-chart-page__details">
        <Heading className="organization-chart-page__position-name">{title}</Heading>
        {employeeNumber && <span className="type-body-sm">No. {employeeNumber}</span>}
      </div>
      {onClick && (
        <button
          ref={buttonRef}
          type="button"
          className="organization-chart-page__root-action"
          aria-label="Volver al organigrama del gerente"
          onClick={onClick}
        />
      )}
    </Reveal>
  );
}

function PositionBranch({ level, titles, employees }: { level: PositionLevel; titles: readonly PositionTitle[]; employees?: readonly string[] }) {
  const columns = titles.length === 1 ? "one" : titles.length === 2 ? "two" : titles.length === 3 ? "three" : "four";

  return (
    <div className={`organization-chart-page__position-branch organization-chart-page__position-branch--${columns}`}>
      <div className="organization-chart-page__position-branch-lines" aria-hidden="true">
        {titles.map((title, index) => <span key={employees?.[index] ?? title} />)}
      </div>
      <div className="organization-chart-page__position-branch-grid">
        {titles.map((title, index) => (
          <div className="organization-chart-page__position-branch-slot" key={employees?.[index] ?? title}>
            <PositionCard level={level} title={title} employeeNumber={employees?.[index]} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function OrganizationChartPage() {
  const [chart, setChart] = useState<"manager" | "head">("head");
  const managerButtonRef = useRef<HTMLButtonElement>(null);
  const headButtonRef = useRef<HTMLButtonElement>(null);
  const focusAfterChange = useRef(false);

  useLayoutEffect(() => {
    if (!focusAfterChange.current) return;
    if (chart === "head") headButtonRef.current?.focus();
    else managerButtonRef.current?.focus();
    focusAfterChange.current = false;
  }, [chart]);

  function changeChart(nextChart: "manager" | "head") {
    focusAfterChange.current = true;
    setChart(nextChart);
  }

  return (
    <main className="organization-chart-page container" aria-labelledby="organization-chart-title">
      <h1 id="organization-chart-title" className="app-page-title">Organigrama</h1>
      {chart === "manager" ? (
        <div className="organization-chart-page__tree">
          <Reveal as="article" className="organization-chart-page__root card">
            <PositionPhoto level={5} title="Gerente de Recursos Humanos" location="CDMX - QRO" />
            <div className="organization-chart-page__details">
              <h2 id="organization-chart-manager-title" className="organization-chart-page__position-name">Gerente de Recursos Humanos</h2>
            </div>
            <button
              ref={managerButtonRef}
              type="button"
              className="organization-chart-page__root-action"
              aria-label="Ver organigrama de Jefe de Recursos Humanos QRO"
              onClick={() => changeChart("head")}
            />
          </Reveal>
          <section className="organization-chart-page__reports" aria-labelledby="organization-chart-reports-title">
            <span className="organization-chart-page__stem" aria-hidden="true" />
            <h2 id="organization-chart-reports-title" className="type-heading-md">Reportan al gerente</h2>
            <div className="organization-chart-page__branch" aria-hidden="true">
              <span /><span /><span />
            </div>
            <div className="organization-chart-page__reports-grid">
              {MANAGER_REPORTS.map(title => (
                <div className="organization-chart-page__report-slot" key={title}>
                  <Reveal as="article" className="organization-chart-page__report card">
                    <PositionPhoto level={10} title={title} />
                    <div className="organization-chart-page__details">
                      <h3 className="organization-chart-page__position-name">{title}</h3>
                    </div>
                  </Reveal>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <section className="organization-chart-page__head" aria-labelledby="organization-chart-head-title">
          <h2 id="organization-chart-head-title" className="sr-only">
            Gerencia y jefatura de Recursos Humanos
          </h2>
          <div className="organization-chart-page__head-chain">
            <PositionCard level={5} title="Gerente de Recursos Humanos" location="CDMX - QRO" headingLevel={3} />
            <span className="organization-chart-page__stem" aria-hidden="true" />
            <PositionCard
              level={7}
              title="Jefe de Recursos Humanos QRO"
              headingLevel={3}
              onClick={() => changeChart("manager")}
              buttonRef={headButtonRef}
            />
            <span className="organization-chart-page__stem" aria-hidden="true" />
          </div>
          <div className="organization-chart-page__direct-reports">
            <h3 className="sr-only">Reportan a jefatura</h3>
            <ul className="organization-chart-page__tree-list">
              <li className="organization-chart-page__tree-item organization-chart-page__tree-item--two">
                <div className="organization-chart-page__coordinator-branch" role="group" aria-label="Coordinación de Reclutamiento y Selección y sus analistas">
                  <PositionBranch level={8} titles={["Coordinador de Reclutamiento y Selección"]} />
                  <span className="organization-chart-page__stem" aria-hidden="true" />
                  <PositionBranch level={10} titles={COORDINATOR_REPORTS} />
                </div>
              </li>
              <li className="organization-chart-page__tree-item">
                <PositionBranch level={10} titles={HEAD_ANALYST_REPORTS} />
              </li>
              <li className="organization-chart-page__tree-item">
                <PositionBranch level={11} titles={["Auxiliar de Recursos Humanos"]} />
              </li>
              <li className="organization-chart-page__tree-item">
                <PositionBranch level={14} titles={CLEANING_REPORTS} employees={CLEANING_EMPLOYEES} />
              </li>
            </ul>
          </div>
        </section>
      )}
    </main>
  );
}

import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/hooks/useAuth";
import { getUserTitle } from "@/lib/userIdentity";
import { toNaturalCase } from "@/lib/utils";
import {
  ArrowUpRight,
  Check,
  ClipboardCheck,
  FolderCheck,
  Scale,
  UserSearch,
} from "lucide-react";
import "./HomePage.css";

const MOTIVATION_BY_TITLE: Readonly<Record<string, string>> = {
  "Analista de Reclutamiento":
    "Cada conversación puede abrir una oportunidad. Tu trabajo conecta al talento con un nuevo comienzo.",
  "Coordinador de Reclutamiento":
    "Tu dirección da claridad al equipo. Hoy es una nueva oportunidad para acompañar, priorizar y avanzar juntos.",
  "Jefe de Recursos Humanos":
    "Tu liderazgo convierte el esfuerzo del equipo en oportunidades reales para las personas y la organización.",
  Administrador:
    "Tu trabajo mantiene al equipo enfocado y al sistema preparado para avanzar.",
};

const DEFAULT_MOTIVATION =
  "Tu trabajo suma. Hoy es una nueva oportunidad para avanzar con propósito.";

const RECRUITMENT_PRINCIPLES = [
  "Perfil claro antes de publicar",
  "Comunicación oportuna con cada persona",
  "Decisiones sustentadas en evidencia",
] as const;

const SELECTION_STAGES = ["Atracción", "Entrevista", "Decisión"] as const;

const PEOPLE_ADMINISTRATION = [
  "Ingreso documentado",
  "Expediente actualizado",
  "Movimientos con trazabilidad",
] as const;

const LABOR_GUIDANCE = [
  { article: "Art. 3", label: "Trabajo digno y libre de discriminación" },
  { article: "Arts. 24–25", label: "Condiciones de trabajo por escrito" },
  { article: "Art. 153-A", label: "Capacitación y adiestramiento" },
] as const;

export function HomePage() {
  const { profile, user, username } = useAuth();

  if (!profile) return null;

  const displayName = toNaturalCase(profile.display_name || username, {
    preserveAcronyms: false,
  });
  const firstName = displayName.split(/\s+/)[0] || displayName;
  const userTitle = getUserTitle(profile.role, user?.email);
  const motivation = MOTIVATION_BY_TITLE[userTitle] ?? DEFAULT_MOTIVATION;

  return (
    <main
      className="home-page container"
      aria-labelledby="home-page-title"
    >
      <section className="home-page__hero">
        <div className="home-page__avatar-frame" aria-hidden="true">
          <div className="home-page__avatar">
            <Avatar name={displayName} src={profile.avatar_url} />
          </div>
        </div>
        <div className="home-page__identity">
          <span className="home-page__eyebrow">{userTitle}</span>
          <h1 id="home-page-title" className="home-page__title">
            Hola, {firstName}.
          </h1>
        </div>
        <p className="home-page__message">{motivation}</p>
      </section>

      <section
        className="home-page__resources"
        aria-labelledby="home-resources-title"
      >
        <header className="home-page__section-header">
          <span className="home-page__section-eyebrow">Enfoque del equipo</span>
          <h2 id="home-resources-title" className="home-page__section-title">
            Personas y trabajo
          </h2>
        </header>

        <div className="home-page__bento">
          <article className="home-page__card home-page__card--recruitment">
            <div className="home-page__card-icon" aria-hidden="true">
              <UserSearch />
            </div>
            <div className="home-page__card-copy">
              <span className="home-page__card-eyebrow">Reclutamiento</span>
              <h3>Personas antes que vacantes</h3>
              <p>
                Un proceso claro y respetuoso fortalece la confianza desde el
                primer contacto.
              </p>
            </div>
            <ul className="home-page__check-list">
              {RECRUITMENT_PRINCIPLES.map((principle) => (
                <li key={principle}>
                  <Check aria-hidden="true" />
                  <span>{principle}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="home-page__card">
            <div className="home-page__card-icon" aria-hidden="true">
              <ClipboardCheck />
            </div>
            <div className="home-page__card-copy">
              <span className="home-page__card-eyebrow">Selección</span>
              <h3>Una experiencia coherente</h3>
              <p>Cada etapa debe dar claridad a la persona y al equipo.</p>
            </div>
            <ol className="home-page__steps">
              {SELECTION_STAGES.map((stage, index) => (
                <li key={stage}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{stage}</strong>
                </li>
              ))}
            </ol>
          </article>

          <article className="home-page__card">
            <div className="home-page__card-icon" aria-hidden="true">
              <FolderCheck />
            </div>
            <div className="home-page__card-copy">
              <span className="home-page__card-eyebrow">
                Administración de personal
              </span>
              <h3>Orden que acompaña</h3>
              <p>
                La experiencia continúa después de contratar: información
                completa, vigente y localizable.
              </p>
            </div>
            <ul className="home-page__check-list">
              {PEOPLE_ADMINISTRATION.map((item) => (
                <li key={item}>
                  <Check aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="home-page__card home-page__card--labor">
            <div className="home-page__card-icon" aria-hidden="true">
              <Scale />
            </div>
            <div className="home-page__card-copy">
              <span className="home-page__card-eyebrow">Marco laboral</span>
              <h3>Ley Federal del Trabajo</h3>
              <p>Puntos de referencia para una gestión responsable.</p>
            </div>
            <ul className="home-page__labor-list">
              {LABOR_GUIDANCE.map(({ article, label }) => (
                <li key={article}>
                  <strong>{article}</strong>
                  <span>{label}</span>
                </li>
              ))}
            </ul>
            <footer className="home-page__legal-footer">
              <span>Orientación general; consulta el texto vigente.</span>
              <a
                href="https://www.diputados.gob.mx/LeyesBiblio/pdf/LFT.pdf"
                target="_blank"
                rel="noreferrer"
              >
                Fuente oficial
                <ArrowUpRight aria-hidden="true" />
              </a>
            </footer>
          </article>
        </div>
      </section>
    </main>
  );
}

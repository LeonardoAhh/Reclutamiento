import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUpRight, Brain, Check, ChevronLeft, ChevronRight, Scale, ShieldCheck, UsersRound } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { useAuth } from "@/hooks/useAuth";
import { formatEmploymentTenure, formatReadableDate } from "@/lib/dates";
import { getUserTitle } from "@/lib/userIdentity";
import { toNaturalCase } from "@/lib/utils";
import {
  MOTIVATION_BY_TITLE, DEFAULT_MOTIVATION, LEADERSHIP_CUE_BY_TITLE,
  DEFAULT_LEADERSHIP_CUE, EMPLOYEE_LIFECYCLE, LABOR_GUIDANCE,
  RESPONSIBLE_PROCESS_COMMITMENTS, DEVELOPMENT_SECTIONS, PRACTICE_REFLECTIONS,
  HOME_TOPICS, LEGACY_LESSONS, type HomeLessonData, type DevelopmentSection,
} from "./homeContent";
import "./HomePage.css";

function HomeLesson({
  title, description, eyebrow, icon: Icon, practices, steps, children,
}: HomeLessonData & { children?: ReactNode }) {
  return (
    <article className="home-page__lesson">
      <header className="home-page__lesson-header">
        <Icon className="home-page__lesson-icon" aria-hidden="true" />
        <div className="home-page__lesson-copy">
          {eyebrow && <span className="home-page__eyebrow">{eyebrow}</span>}
          <h3 className="home-page__lesson-title">{title}</h3>
          {description && (
            <p className="home-page__lesson-description">{description}</p>
          )}
        </div>
      </header>
      <div className="home-page__lesson-content">
        {practices && (
          <ul className="home-page__check-list">
            {practices.map(practice => (
              <li key={practice}><Check aria-hidden="true" /><span>{practice}</span></li>
            ))}
          </ul>
        )}
        {steps && (
          <ol>{steps.map(step => <li key={step}>{step}</li>)}</ol>
        )}
        {children}
      </div>
    </article>
  );
}

function HomeContext({ section }: { section: DevelopmentSection }) {
  return (
    <p className="home-page__context">
      <strong>{section.title}.</strong> {section.introduction}
    </p>
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
          <HomeLesson title="Reclutar con responsabilidad"
            eyebrow="Compromisos del proceso" icon={ShieldCheck}
            description="Principios que orientan cada decisión, desde la vacante hasta el ingreso.">
            <ul className="home-page__commitment-list">
              {RESPONSIBLE_PROCESS_COMMITMENTS.map(({ title, description, icon: Icon }) => (
                <li key={title}>
                  <Icon aria-hidden="true" />
                  <div><h4>{title}</h4><p>{description}</p></div>
                </li>
              ))}
            </ul>
          </HomeLesson>
          <HomeLesson {...LEGACY_LESSONS[0]} />
          <HomeLesson {...LEGACY_LESSONS[1]} />
          <HomeContext section={DEVELOPMENT_SECTIONS[0]} />
          {DEVELOPMENT_SECTIONS[0].topics.map(topic => (
            <HomeLesson {...topic} key={topic.title} />
          ))}
        </>
      );
    case "administracion":
      return (
        <>
          <HomeLesson {...LEGACY_LESSONS[2]} />
          <HomeLesson {...LEGACY_LESSONS[3]}>
            <ul className="home-page__labor-list">
              {LABOR_GUIDANCE.map(({ article, label }) => (
                <li key={article}><strong>{article}</strong><span>{label}</span></li>
              ))}
            </ul>
            <footer className="home-page__legal-footer">
              <span>Orientación general; consulta el texto vigente.</span>
              <a href="https://www.diputados.gob.mx/LeyesBiblio/pdf/LFT.pdf"
                target="_blank" rel="noreferrer">
                Fuente oficial
                <span className="sr-only">(abre en nueva pestaña)</span>
                <ArrowUpRight aria-hidden="true" />
              </a>
            </footer>
          </HomeLesson>
          <HomeLesson title="Una experiencia completa"
            eyebrow="Ciclo de la persona" icon={UsersRound}
            description="La responsabilidad de Recursos Humanos continúa antes, durante y después de la contratación."
            steps={EMPLOYEE_LIFECYCLE} />
          <HomeLesson {...DEVELOPMENT_SECTIONS[2].topics[1]} />
          <HomeLesson {...LEGACY_LESSONS[9]} />
        </>
      );
    case "liderazgo":
      return (
        <>
          <p className="home-page__section-intro">{leadershipCue}</p>
          {[4, 5, 6].map(index => (
            <HomeLesson {...LEGACY_LESSONS[index]} key={LEGACY_LESSONS[index].title} />
          ))}
          <HomeContext section={DEVELOPMENT_SECTIONS[1]} />
          {DEVELOPMENT_SECTIONS[1].topics.map(topic => (
            <HomeLesson {...topic} key={topic.title} />
          ))}
          <HomeLesson {...DEVELOPMENT_SECTIONS[2].topics[0]} />
        </>
      );
    case "desarrollo":
      return (
        <>
          {[7, 8, 10].map(index => (
            <HomeLesson {...LEGACY_LESSONS[index]} key={LEGACY_LESSONS[index].title} />
          ))}
          <HomeContext section={DEVELOPMENT_SECTIONS[2]} />
          <HomeLesson {...DEVELOPMENT_SECTIONS[2].topics[2]} />
          <HomeContext section={DEVELOPMENT_SECTIONS[3]} />
          {DEVELOPMENT_SECTIONS[3].topics.map(topic => (
            <HomeLesson {...topic} key={topic.title} />
          ))}
        </>
      );
    case "reflexion":
      return (
        <>
          {PRACTICE_REFLECTIONS.map(({ label, title, description, icon }) => (
            <HomeLesson title={title} eyebrow={label} icon={icon} key={label}>
              <p>{description}</p>
            </HomeLesson>
          ))}
          <HomeLesson title="Cuando una impresión aparece antes que la evidencia"
            eyebrow="Caso para pensar" icon={Brain}
            description="Durante una conversación surge una conclusión rápida sobre una persona, pero todavía faltan preguntas relacionadas con el puesto.">
            <h4>Antes de decidir</h4>
            <ul>
              <li>¿Qué observé directamente?</li>
              <li>¿Qué estoy interpretando?</li>
              <li>¿Qué pregunta aportaría evidencia relevante?</li>
            </ul>
          </HomeLesson>
          <HomeLesson title="Contraste práctico"
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
          </HomeLesson>
        </>
      );
    default:
      return null;
  }
}

export function HomePage() {
  const { profile, user, username } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const moveFocus = useRef(false);
  const activeTopic = HOME_TOPICS[activeIndex];

  useLayoutEffect(() => {
    if (moveFocus.current) {
      titleRef.current?.focus();
      moveFocus.current = false;
    }
  }, [activeIndex]);

  function selectTopic(index: number) {
    if (index === activeIndex || index < 0 || index >= HOME_TOPICS.length) return;
    moveFocus.current = true;
    setActiveIndex(index);
  }

  if (!profile) return null;

  const displayName = toNaturalCase(profile.display_name || username, {
    preserveAcronyms: false,
  });
  const firstName = displayName.split(/\s+/)[0] || displayName;
  const userTitle = getUserTitle(profile.role, user?.email);
  const motivation = MOTIVATION_BY_TITLE[userTitle] ?? DEFAULT_MOTIVATION;
  const leadershipCue =
    LEADERSHIP_CUE_BY_TITLE[userTitle] ?? DEFAULT_LEADERSHIP_CUE;
  const hireDate = profile.hire_date?.slice(0, 10) ?? "";
  const tenure = formatEmploymentTenure(hireDate);


  return (
    <main className="home-page container" aria-labelledby="home-page-title">
      <section className="home-page__hero">
        <div className="home-page__avatar-frame" aria-hidden="true">
          <div className="home-page__avatar">
            <Avatar name={displayName} src={profile.avatar_url} />
          </div>
        </div>
        <div className="home-page__identity">
          <span className="home-page__eyebrow" aria-hidden="true">
            {userTitle}
          </span>
          <h1 id="home-page-title" className="home-page__title">
            Hola, {firstName}.
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
        </div>
      </section>


      <div id="home-content" className="home-page__learning">
        <div className="form-group home-page__topic-picker">
          <label htmlFor="home-topic-select">Explorar tema</label>
          <CustomSelect
            id="home-topic-select"
            value={activeTopic.id}
            onChange={(value) => {
              const index = HOME_TOPICS.findIndex(
                (topic) => topic.id === value,
              );
              selectTopic(index);
            }}
            options={HOME_TOPICS.map((topic) => ({
              value: topic.id,
              label: topic.title,
            }))}
            showPlaceholderOption={false}
          />
        </div>
        <nav className="home-page__topics" aria-label="Temas de inicio">
          {HOME_TOPICS.map((topic, index) => {
            const Icon = topic.icon;
            return (
              <button type="button" className="home-page__topic-button" key={topic.id}
                aria-current={index === activeIndex ? "true" : undefined}
                aria-controls="home-topic-content" aria-label={topic.title}
                onClick={() => selectTopic(index)}>
                <span className="home-page__topic-label">
                  <Icon aria-hidden="true" />
                  {topic.navLabel}
                </span>
                <Check className="home-page__topic-check" aria-hidden="true" />
              </button>
            );
          })}
        </nav>
        <section id="home-topic-content" className="home-page__topic-content"
          aria-labelledby="home-topic-title">
          <header className="home-page__section-header">
            <p className="home-page__eyebrow">
              Tema {activeIndex + 1} de {HOME_TOPICS.length}
            </p>
            <h2 id="home-topic-title" ref={titleRef} tabIndex={-1}
              className="home-page__section-title">
              {activeTopic.title}
            </h2>
            <p className="home-page__section-intro">{activeTopic.introduction}</p>
          </header>
          <div className="home-page__lessons">
            <TopicLessons topicId={activeTopic.id} leadershipCue={leadershipCue} />
          </div>
          <nav className="home-page__pagination" aria-label="Recorrer temas">
            <button type="button" className="btn-secondary"
              disabled={activeIndex === 0} onClick={() => selectTopic(activeIndex - 1)}>
              <ChevronLeft aria-hidden="true" /> Anterior
            </button>
            <button type="button" className="btn-secondary"
              disabled={activeIndex === HOME_TOPICS.length - 1}
              onClick={() => selectTopic(activeIndex + 1)}>
              Siguiente <ChevronRight aria-hidden="true" />
            </button>
          </nav>
        </section>
      </div>
    </main>
  );
}

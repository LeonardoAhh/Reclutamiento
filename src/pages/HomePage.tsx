import { useLayoutEffect, useRef, useState } from "react";
import { PageHeading } from '@/components/layout/PageHeading';
import { ArrowUpRight, Brain, ChevronLeft, ChevronRight, Scale, ShieldCheck, UsersRound } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { homeLesson, homeSection, homeText } from "./homeTranslations";
import { getUserTitle } from "@/lib/userIdentity";
import { useTeamDirectory } from '@/features/team/TeamProvider';
import { CAREER_JOURNEY_ENABLED } from '@/features/career/types';
import { toNaturalCase } from "@/lib/utils";
import { HomeLessonCard } from "./home/HomeLessonCard";
import {
  LEADERSHIP_CUE_BY_TITLE,
  DEFAULT_LEADERSHIP_CUE, EMPLOYEE_LIFECYCLE, LABOR_GUIDANCE,
  DEVELOPMENT_SECTIONS, PRACTICE_REFLECTIONS, RESPONSIBLE_PROCESS_CARD,
  RESPONSIBLE_PROCESS_COMMITMENTS, HOME_TOPICS, LEGACY_LESSONS,
  type DevelopmentSection,
} from "./homeContent";
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
  const location = useLocation();
  const navigate = useNavigate();
  const navigationState: unknown = location.state;
  const showCareerMotivation = CAREER_JOURNEY_ENABLED && navigationState !== null
    && typeof navigationState === 'object'
    && 'careerMotivation' in navigationState
    && navigationState.careerMotivation === true;
  const { members } = useTeamDirectory();
  const { profile, username } = useAuth();
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
  const leadershipCue =
    homeText(LEADERSHIP_CUE_BY_TITLE[userTitle] ?? DEFAULT_LEADERSHIP_CUE, language);


  return (
    <main className="home-page container" aria-labelledby="home-page-title">
      <PageHeading id="home-page-title" className="app-page-title">
        {en ? 'Hello' : 'Hola'}, {firstName}.
      </PageHeading>

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

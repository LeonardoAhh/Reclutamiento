import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { base2, success, think, typing, wave } from 'robot-toast/robots';
import { CAREER_ROLES } from './types';
import type { CareerRoleId } from './types';
import { CareerJourneySummary } from './CareerJourneySummary';

type JourneyStep = 'intro' | 'positions' | 'destination' | 'goals' | 'focus' | 'first-step' | 'summary';

const DEVELOPMENT_CHOICES = [
  { id: 'decisions', title: 'Tomar mejores decisiones', description: 'Analizar, priorizar y resolver.', robot: think },
  { id: 'people', title: 'Liderar personas', description: 'Acompañar, delegar y desarrollar al equipo.', robot: base2 },
  { id: 'communication', title: 'Comunicar con claridad', description: 'Escuchar, dar feedback y transmitir ideas.', robot: wave },
] as const;

type DevelopmentChoiceId = (typeof DEVELOPMENT_CHOICES)[number]['id'];

const FIRST_ACTION_CHOICES = {
  people: [
    { id: 'feedback', title: 'Pedir feedback', robot: wave },
    { id: 'delegate', title: 'Delegar una tarea', robot: base2 },
    { id: 'support', title: 'Acompañar a alguien del equipo', robot: success },
  ],
  decisions: [
    { id: 'prioritize', title: 'Priorizar pendientes', robot: typing },
    { id: 'review-data', title: 'Revisar datos', robot: think },
    { id: 'propose', title: 'Proponer una solución', robot: success },
  ],
  communication: [
    { id: 'listen', title: 'Escuchar antes de responder', robot: think },
    { id: 'give-feedback', title: 'Dar feedback', robot: wave },
    { id: 'explain', title: 'Explicar mejor un objetivo', robot: base2 },
  ],
} as const;

type FirstActionId = (typeof FIRST_ACTION_CHOICES)[DevelopmentChoiceId][number]['id'];

const ACTION_MESSAGES = [
  'Una acción pequeña cuenta.',
  'Empieza con algo posible.',
  'Cada paso cuenta.',
  'Empieza pequeño.',
];

const DEVELOPMENT_MESSAGES = [
  'Empieza pequeño.',
  'Escucha y aprende.',
  'Practica cada día.',
  'Lidera con el ejemplo.',
];

interface CareerJourneyProps {
  onClose: () => Promise<boolean>;
  children?: ReactNode;
}

const ROLE_ROBOTS: Record<CareerRoleId, string> = {
  'analyst-b': wave,
  'analyst-a': typing,
  coordinator: think,
  head: base2,
  manager: success,
};

const DISPLAY_ROLES = [
  CAREER_ROLES[2],
  CAREER_ROLES[0],
  CAREER_ROLES[4],
  CAREER_ROLES[1],
  CAREER_ROLES[3],
] as const;

const POSITION_CHOICES = DISPLAY_ROLES.map(role => ({ ...role, robot: ROLE_ROBOTS[role.id] }));
const DESTINATION_CHOICES = POSITION_CHOICES.filter(role => role.id === 'head' || role.id === 'manager');

const MOTIVATION_MESSAGES = [
  'Lo estás haciendo bien.',
  'Casi lo logras.',
  'Un paso más.',
  'Cada paso cuenta.',
  'Confía en tu camino.',
  'Sigue aprendiendo.',
  'Vas por buen camino.',
  'Tu esfuerzo suma.',
  'Hoy puedes avanzar.',
  'Date tiempo para crecer.',
  'Tú puedes lograrlo.',
  'El siguiente paso es tuyo.',
];

const LEADERSHIP_MESSAGES = [
  'Aprende.',
  'Cambia.',
  'Mejora.',
  'Sé un líder.',
  'Escucha a tu equipo.',
  'Inspira con el ejemplo.',
  'Comparte lo que sabes.',
  'Atrévete a crecer.',
  'Construye confianza.',
  'Aprende de cada reto.',
  'Haz crecer a otros.',
  'Lidera con propósito.',
];

function CareerMessages({ messages, theme }: { messages: string[]; theme?: 'development' }) {
  return (
    <div className="career-page__messages" data-theme={theme} aria-hidden="true">
      {messages.map(message => (
        <span key={message} className="career-page__message type-body-md">{message}</span>
      ))}
    </div>
  );
}

export function CareerJourney({ onClose, children }: CareerJourneyProps) {
  const [step, setStep] = useState<JourneyStep>('intro');
  const [isLeaving, setIsLeaving] = useState(false);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  const [selectedId, setSelectedId] = useState<CareerRoleId | null>(null);
  const [destinationId, setDestinationId] = useState<CareerRoleId | null>(null);
  const [focusId, setFocusId] = useState<DevelopmentChoiceId | null>(null);
  const [firstActionId, setFirstActionId] = useState<FirstActionId | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRoleRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const isGoalSelection = step === 'goals';
  const isDevelopmentSelection = step === 'focus';
  const isFirstActionSelection = step === 'first-step';
  const isSummary = step === 'summary';
  const isDevelopmentStage = isDevelopmentSelection || isFirstActionSelection || isSummary;
  const isDestination = step === 'destination' || isGoalSelection;
  const showMessages = isDestination || isDevelopmentStage;
  const showChoices = step === 'positions' || isGoalSelection || isDevelopmentSelection || isFirstActionSelection;
  const firstActionChoices = focusId ? FIRST_ACTION_CHOICES[focusId] : [];
  const availableChoices = isFirstActionSelection ? firstActionChoices
    : isDevelopmentSelection ? DEVELOPMENT_CHOICES : isGoalSelection ? DESTINATION_CHOICES : POSITION_CHOICES;
  const activeId = isFirstActionSelection ? firstActionId
    : isDevelopmentSelection ? focusId : isGoalSelection ? destinationId : selectedId;
  const messages = isFirstActionSelection || isSummary ? ACTION_MESSAGES
    : isDevelopmentSelection ? DEVELOPMENT_MESSAGES : isGoalSelection ? LEADERSHIP_MESSAGES : MOTIVATION_MESSAGES;
  const messageSplit = Math.ceil(messages.length / 2);
  const messageTheme = isDevelopmentStage ? 'development' : undefined;
  const destinationPosition = DESTINATION_CHOICES.find(role => role.id === destinationId);
  const firstAction = firstActionChoices.find(choice => choice.id === firstActionId);
  const activeChoice = availableChoices.find(choice => choice.id === activeId);
  const visibleChoices = activeChoice ? [activeChoice] : availableChoices;
  const automaticNextStep = step === 'positions' && selectedId ? 'destination'
    : isGoalSelection && destinationId ? 'focus'
    : isDevelopmentSelection && focusId ? 'first-step'
    : isFirstActionSelection && firstActionId ? 'summary' : null;
  const question = isSummary ? 'Este es tu camino' : isDevelopmentSelection ? '¿Por dónde quieres empezar?'
    : step === 'first-step' ? '¿Cuál será tu primer paso?'
    : isDestination ? '¿A dónde quieres llegar?' : '¿Dónde estás hoy?';

  function selectChoice(id: string) {
    if (isFirstActionSelection) {
      const choice = firstActionChoices.find(option => option.id === id);
      if (choice) setFirstActionId(choice.id);
      return;
    }
    if (isDevelopmentSelection) {
      const choice = DEVELOPMENT_CHOICES.find(option => option.id === id);
      if (choice) setFocusId(choice.id);
      return;
    }
    const role = CAREER_ROLES.find(option => option.id === id);
    if (!role) return;
    if (isGoalSelection) setDestinationId(role.id);
    else setSelectedId(role.id);
  }

  useEffect(() => {
    document.title = 'Tu camino profesional';
    if (step === 'positions' || step === 'goals') firstRoleRef.current?.focus({ preventScroll: true });
    else headingRef.current?.focus({ preventScroll: true });
  }, [step, isLeaving]);

  useEffect(() => {
    if (!automaticNextStep) return;
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 0
      : Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--duration-brand-reveal'));
    const timeout = window.setTimeout(() => setStep(automaticNextStep), duration);
    return () => window.clearTimeout(timeout);
  }, [automaticNextStep]);

  useEffect(() => {
    if (!isLeaving) return;
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 0
      : Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--duration-brand-reveal'));
    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      const completed = await onCloseRef.current();
      if (!cancelled && !completed) setIsLeaving(false);
    }, duration);
    return () => { cancelled = true; window.clearTimeout(timeout); };
  }, [isLeaving]);

  return (
    <main className="career-page container" data-leaving={isLeaving} aria-labelledby={titleId}>
      {showMessages && <CareerMessages messages={messages.slice(0, messageSplit)} theme={messageTheme} />}
      <div className={isSummary ? 'career-page__destination career-page__summary-content'
        : isDevelopmentSelection || isFirstActionSelection ? 'career-page__destination career-page__development'
        : showMessages ? 'career-page__destination' : 'career-page__content'}>
        <h2 ref={headingRef} tabIndex={-1} id={titleId}
          className={step === 'positions' || isGoalSelection || isLeaving ? 'sr-only' : 'career-page__question type-display-1'}>
          {question}
        </h2>
        {showChoices ? (
          <div className="career-page__selection">
            <ul className="career-page__roles" data-selected={activeChoice !== undefined}
              data-purpose={isFirstActionSelection ? 'first-action' : isDevelopmentSelection ? 'development' : isGoalSelection ? 'destination' : 'current'}
              aria-label={isFirstActionSelection ? 'Selecciona tu primer paso' : isDevelopmentSelection ? 'Selecciona por dónde quieres empezar'
                : isGoalSelection ? 'Selecciona a dónde quieres llegar' : 'Selecciona dónde estás hoy'}>
              {visibleChoices.map(choice => (
                <li key={choice.id}>
                  <button ref={choice.id === availableChoices[0].id ? firstRoleRef : undefined}
                    type="button" className="career-page__role"
                    aria-pressed={activeId === choice.id}
                    onClick={() => selectChoice(choice.id)}>
                    <span className="career-page__robot-frame" aria-hidden="true">
                      <img className="career-page__robot" src={choice.robot} alt="" />
                    </span>
                    <span className="career-page__choice-copy">
                      <span className="type-heading-md">{choice.title}</span>
                      {'description' in choice && (
                        <span className="career-page__choice-description type-body-md">{choice.description}</span>
                      )}
                    </span>
                    {activeId === choice.id && <Check className="career-page__check" aria-hidden="true" />}
                  </button>
                </li>
              ))}
            </ul>
            <p className="sr-only" role="status">
              {activeChoice ? `${isFirstActionSelection ? 'Primer paso seleccionado' : isDevelopmentSelection ? 'Enfoque seleccionado' : isGoalSelection ? 'Meta seleccionada' : 'Puesto seleccionado'}: ${activeChoice.title}.` : ''}
            </p>
            {children}
          </div>
        ) : isSummary ? (
          <>
            <CareerJourneySummary destinationRobot={destinationPosition?.robot ?? success}
              destinationPosition={destinationPosition?.title}
              firstAction={firstAction?.title} isLeaving={isLeaving} onClose={() => setIsLeaving(true)} />
            {children}
          </>
        ) : (
          <button type="button" className="btn-primary career-page__next"
            aria-label={isDestination ? 'Ver puestos de destino' : 'Ver puestos'}
            onClick={() => setStep(isDestination ? 'goals' : 'positions')}>
            <ArrowRight aria-hidden="true" />
          </button>
        )}
      </div>
      {showMessages && <CareerMessages messages={messages.slice(messageSplit)} theme={messageTheme} />}
    </main>
  );
}

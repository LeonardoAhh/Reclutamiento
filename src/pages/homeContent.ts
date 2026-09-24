import {
  Accessibility,
  BadgeCheck,
  BatteryCharging,
  Brain,
  Building2,
  ClipboardCheck,
  Compass,
  DoorOpen,
  Ear,
  FileCheck2,
  FolderCheck,
  GitBranch,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Lightbulb,
  ListChecks,
  Megaphone,
  MessageCircle,
  MessagesSquare,
  Network,
  NotebookPen,
  RefreshCw,
  Scale,
  ShieldCheck,
  Target,
  UserSearch,
  type LucideIcon,
} from "lucide-react";

export const MOTIVATION_BY_TITLE: Readonly<Record<string, string>> = {
  "Analista de Reclutamiento":
    "Cada conversación puede abrir una oportunidad. Tu trabajo conecta al talento con un nuevo comienzo.",
  "Coordinador de Reclutamiento":
    "Tu dirección da claridad al equipo. Hoy es una nueva oportunidad para acompañar, priorizar y avanzar juntos.",
  "Jefe de Recursos Humanos":
    "Tu liderazgo convierte el esfuerzo del equipo en oportunidades reales para las personas y la organización.",
  Administrador:
    "Tu trabajo mantiene al equipo enfocado y al sistema preparado para avanzar.",
};

export const DEFAULT_MOTIVATION =
  "Tu trabajo suma. Hoy es una nueva oportunidad para avanzar con propósito.";

const RECRUITMENT_PRINCIPLES = [
  "Perfil claro antes de publicar",
  "Comunicación oportuna con cada persona",
  "Decisiones sustentadas en evidencia",
] as const;

const SELECTION_STAGES = ["Perfil", "Evaluación", "Cierre"] as const;

const PEOPLE_ADMINISTRATION = [
  "Ingreso e integración con contexto",
  "Desarrollo y capacitación con seguimiento",
  "Movimientos y salida con trazabilidad",
] as const;

export const EMPLOYEE_LIFECYCLE = [
  "Atracción",
  "Selección",
  "Ingreso",
  "Desarrollo",
  "Permanencia",
  "Salida",
] as const;

export const LABOR_GUIDANCE = [
  { article: "Art. 3", label: "Trabajo digno y libre de discriminación" },
  { article: "Arts. 24–25", label: "Condiciones de trabajo por escrito" },
  { article: "Art. 153-A", label: "Capacitación y adiestramiento" },
] as const;

const OBJECTIVES_PRACTICES = [
  "Mide lo que importa, no todo lo que puedes medir",
  "Ajusta el rumbo antes de atascarte",
  "El ritmo sostenido vence al sprint",
] as const;

const INNOVATION_PRACTICES = [
  "Explora fuentes nuevas de talento",
  "Itera sin destruir lo que ya funciona",
  "Comparte con el equipo lo que descubres",
] as const;

const DOCUMENTATION_PRACTICES = [
  "Un registro claro es un acto de respeto",
  "El contexto escrito ahorra tiempo al equipo",
  "Lo que no está documentado no ocurrió",
] as const;

const CULTURE_PRACTICES = [
  "Confidencialidad como base de confianza",
  "Equidad en cada etapa y decisión",
  "Escucha y entorno laboral favorable",
] as const;

export const LEADERSHIP_CUE_BY_TITLE: Readonly<Record<string, string>> = {
  "Analista de Reclutamiento":
    "Tu seguimiento da claridad a cada persona y fortalece la confianza en el proceso.",
  "Coordinador de Reclutamiento":
    "Tu claridad ayuda a priorizar, acompañar al equipo y remover bloqueos a tiempo.",
  "Jefe de Recursos Humanos":
    "Tu liderazgo convierte los principios de Recursos Humanos en decisiones y cultura.",
  Administrador:
    "Tu organización permite que el equipo trabaje con claridad, continuidad y confianza.",
};

export const DEFAULT_LEADERSHIP_CUE =
  "Liderar también es dar claridad, escuchar y facilitar el siguiente paso.";

const PRIORITY_PRACTICES = [
  "Una prioridad clara",
  "Responsable definido",
  "Bloqueos visibles",
] as const;

const CONVERSATION_PRACTICES = [
  "Reconoce la contribución",
  "Corrige con contexto",
  "Acuerda el siguiente paso",
] as const;

const FAIR_DECISION_PRACTICES = [
  "Compara con el mismo criterio",
  "Evita criterios discriminatorios",
  "Comunica el cierre",
] as const;

export const RESPONSIBLE_PROCESS_COMMITMENTS = [
  {
    title: "Igualdad",
    description:
      "Evalúa con criterios relacionados con el puesto y sin discriminación.",
    icon: ShieldCheck,
  },
  {
    title: "Contratación libre",
    description:
      "Asegura una decisión voluntaria, sin cobros ni retención de documentos.",
    icon: Handshake,
  },
  {
    title: "Inclusión",
    description:
      "Considera las adaptaciones razonables para cada persona y puesto.",
    icon: Accessibility,
  },
  {
    title: "Cierre responsable",
    description:
      "Comunica oportunamente y conserva la trazabilidad de la decisión.",
    icon: FileCheck2,
  },
] as const;

type DevelopmentTopic = {
  eyebrow: string;
  title: string;
  description: string;
  practices: readonly string[];
  icon: LucideIcon;
};

export type DevelopmentSection = {
  id: string;
  eyebrow: string;
  title: string;
  introduction: string;
  topics: readonly DevelopmentTopic[];
};

export const DEVELOPMENT_SECTIONS: readonly DevelopmentSection[] = [
  {
    id: "home-professional-presence-title",
    eyebrow: "Experiencia y criterio",
    title: "La forma también comunica",
    introduction:
      "Cada interacción puede fortalecer la confianza cuando existe escucha, coherencia y revisión consciente del propio criterio.",
    topics: [
      {
        eyebrow: "Marca empleadora",
        title: "Haz visible la cultura real",
        description:
          "La experiencia de una persona comienza antes de ingresar y también permanece cuando el proceso termina.",
        practices: [
          "Comunica el puesto y el entorno con honestidad",
          "Mantén coherencia entre publicación, entrevista e ingreso",
          "Cuida el trato aunque la persona no continúe",
        ],
        icon: Megaphone,
      },
      {
        eyebrow: "Escucha profesional",
        title: "Comprende antes de concluir",
        description:
          "Escuchar con intención permite obtener contexto y evita llenar los silencios con suposiciones.",
        practices: [
          "Pregunta antes de interpretar",
          "Separa hechos, opiniones y supuestos",
          "Confirma lo comprendido y abre espacio a dudas",
        ],
        icon: Ear,
      },
      {
        eyebrow: "Autoconocimiento",
        title: "Revisa tu primera impresión",
        description:
          "El criterio profesional mejora cuando reconoce sus límites y vuelve a la evidencia disponible.",
        practices: [
          "Detecta decisiones tomadas con demasiada rapidez",
          "Distingue afinidad personal de capacidad profesional",
          "Busca otra perspectiva cuando exista duda",
        ],
        icon: Brain,
      },
    ],
  },
  {
    id: "home-leadership-growth-title",
    eyebrow: "Liderazgo con intención",
    title: "Acompañar también es desarrollar",
    introduction:
      "Liderar desde Recursos Humanos implica construir acuerdos, distribuir responsabilidad y adaptar el acompañamiento al contexto.",
    topics: [
      {
        eyebrow: "Influencia",
        title: "Construye acuerdos sin imponer",
        description:
          "Una propuesta gana claridad cuando conecta el contexto con su impacto y un siguiente paso posible.",
        practices: [
          "Expón contexto, impacto y propuesta",
          "Escucha necesidades de las áreas involucradas",
          "Escala riesgos cuando excedan tu alcance",
        ],
        icon: Network,
      },
      {
        eyebrow: "Delegación",
        title: "Entrega responsabilidad con claridad",
        description:
          "Delegar no es abandonar una tarea: es acordar resultado, autonomía y seguimiento.",
        practices: [
          "Define el resultado esperado",
          "Aclara límites y margen de decisión",
          "Acompaña sin retirar la responsabilidad",
        ],
        icon: GitBranch,
      },
      {
        eyebrow: "Liderazgo situacional",
        title: "Ajusta el acompañamiento",
        description:
          "Personas y momentos distintos requieren niveles diferentes de orientación y autonomía.",
        practices: [
          "Orienta cuando falte claridad",
          "Acompaña mientras se desarrolla experiencia",
          "Da autonomía cuando exista capacidad demostrada",
        ],
        icon: Compass,
      },
    ],
  },
  {
    id: "home-people-development-title",
    eyebrow: "Desarrollo de personas",
    title: "Convertir experiencia en crecimiento",
    introduction:
      "El desarrollo ocurre cuando las conversaciones, la integración y el aprendizaje se convierten en acciones comprensibles.",
    topics: [
      {
        eyebrow: "Conversaciones difíciles",
        title: "Habla con hechos y respeto",
        description:
          "Preparar una conversación reduce ambigüedad y permite atender el problema sin etiquetar a la persona.",
        practices: [
          "Reúne hechos antes de conversar",
          "Describe conducta e impacto sin etiquetas",
          "Cierra con acuerdos comprensibles",
        ],
        icon: MessageCircle,
      },
      {
        eyebrow: "Integración",
        title: "Facilita pertenencia desde el inicio",
        description:
          "Integrarse también implica conocer las relaciones, los canales y las formas de pedir apoyo.",
        practices: [
          "Presenta la red de colaboración",
          "Aclara cómo y dónde solicitar apoyo",
          "Comprueba que el contexto esencial sea localizable",
        ],
        icon: DoorOpen,
      },
      {
        eyebrow: "Talento",
        title: "Haz del aprendizaje una práctica",
        description:
          "Desarrollar talento requiere observar fortalezas, concretar mejoras y reconocer avances.",
        practices: [
          "Identifica fortalezas observables",
          "Convierte áreas de mejora en acciones",
          "Reconoce progreso además del resultado",
        ],
        icon: GraduationCap,
      },
    ],
  },
  {
    id: "home-sustainable-culture-title",
    eyebrow: "Cultura sostenible",
    title: "Cuidar el proceso y a quienes lo hacen posible",
    introduction:
      "La calidad se sostiene cuando el equipo administra su energía, acompaña los cambios y reconoce los límites de su responsabilidad.",
    topics: [
      {
        eyebrow: "Trabajo sostenible",
        title: "Avanza sin convertir todo en urgente",
        description:
          "Cuidar el ritmo ayuda a mantener criterio, empatía y calidad incluso bajo presión.",
        practices: [
          "Distingue prioridad de urgencia",
          "Solicita apoyo antes de llegar a la saturación",
          "Respeta límites que sostienen el trabajo",
        ],
        icon: BatteryCharging,
      },
      {
        eyebrow: "Gestión del cambio",
        title: "Da sentido a la transición",
        description:
          "Las personas pueden participar mejor cuando comprenden el propósito y aquello que permanece estable.",
        practices: [
          "Explica por qué cambia el proceso",
          "Escucha la resistencia como información",
          "Comunica qué cambia y qué permanece",
        ],
        icon: RefreshCw,
      },
      {
        eyebrow: "Criterio profesional",
        title: "Reconoce cuándo debes consultar",
        description:
          "La responsabilidad incluye explicar límites, evitar promesas sin respaldo y pedir orientación competente.",
        practices: [
          "Distingue orientación general de decisión especializada",
          "Explica los límites de tu participación",
          "Consulta cuando una decisión exceda tu alcance",
        ],
        icon: ShieldCheck,
      },
    ],
  },
];

export const PRACTICE_REFLECTIONS = [
  {
    label: "Principio para practicar",
    title: "La claridad también es una forma de cuidado",
    description:
      "Explicar contexto, límites y siguientes pasos reduce incertidumbre para las personas y para el equipo.",
    icon: Building2,
  },
  {
    label: "Pregunta para reflexionar",
    title: "¿Qué evidencia sostiene mi siguiente decisión?",
    description:
      "Distingue lo que observaste, lo que interpretaste y aquello que todavía necesitas confirmar.",
    icon: Brain,
  },
] as const;

export type HomeLessonData = {
  title: string;
  description?: string;
  eyebrow?: string;
  icon: LucideIcon;
  practices?: readonly string[];
  steps?: readonly string[];
};

export const LEGACY_LESSONS: readonly HomeLessonData[] = [
  {
    title: "Personas antes que vacantes",
    description:
      "Un proceso claro y respetuoso fortalece la confianza desde el primer contacto.",
    eyebrow: "Reclutamiento",
    icon: UserSearch,
    practices: RECRUITMENT_PRINCIPLES,
  },
  {
    title: "Decisiones consistentes",
    description:
      "Un perfil común, una entrevista estructurada y un cierre oportuno permiten evaluar con mayor claridad.",
    eyebrow: "Selección",
    icon: ClipboardCheck,
    steps: SELECTION_STAGES,
  },
  {
    title: "Orden que acompaña",
    description:
      "La experiencia continúa después de contratar: información completa, vigente y localizable.",
    eyebrow: "Administración de personal",
    icon: FolderCheck,
    practices: PEOPLE_ADMINISTRATION,
  },
  {
    title: "Ley Federal del Trabajo",
    description:
      "Puntos de referencia para una gestión responsable.",
    eyebrow: "Marco laboral",
    icon: Scale,
  },
  {
    title: "Enfoca y desbloquea",
    description:
      "Define qué importa ahora, quién lo acompaña y qué puede frenar el avance.",
    eyebrow: "Prioridad visible",
    icon: ListChecks,
    practices: PRIORITY_PRACTICES,
  },
  {
    title: "Desarrolla con oportunidad",
    description:
      "Una conversación breve, específica y respetuosa orienta sin perder de vista a la persona.",
    eyebrow: "Conversaciones",
    icon: MessagesSquare,
    practices: CONVERSATION_PRACTICES,
  },
  {
    title: "Evalúa con criterios comunes",
    description:
      "La evidencia y la trazabilidad ayudan a decidir con equidad y comunicar con transparencia.",
    eyebrow: "Decisiones justas",
    icon: BadgeCheck,
    practices: FAIR_DECISION_PRACTICES,
  },
  {
    title: "Metas con propósito",
    description:
      "Tener claridad sobre lo que se quiere lograr es el primer paso para lograrlo.",
    eyebrow: "Objetivos",
    icon: Target,
    practices: OBJECTIVES_PRACTICES,
  },
  {
    title: "El proceso siempre puede mejorar",
    description:
      "Experimentar con intención, aprender rápido y compartir lo aprendido fortalece al equipo completo.",
    eyebrow: "Innovación",
    icon: Lightbulb,
    practices: INNOVATION_PRACTICES,
  },
  {
    title: "Escribe para quien viene después",
    description:
      "Documentar bien es una forma de cuidar al equipo y mantener la continuidad del trabajo.",
    eyebrow: "Documentación",
    icon: NotebookPen,
    practices: DOCUMENTATION_PRACTICES,
  },
  {
    title: "RH es un socio, no un trámite",
    description:
      "Recursos Humanos existe para acompañar a las personas con criterio, empatía y responsabilidad.",
    eyebrow: "Cultura RH",
    icon: HeartHandshake,
    practices: CULTURE_PRACTICES,
  },
];
export const HOME_TOPICS = [
  {
    id: "reclutamiento",
    title: "Reclutamiento y selección",
    navLabel: "Reclutamiento",
    icon: UserSearch,
    introduction:
      "Personas y trabajo · Enfoque del equipo",
  },
  {
    id: "administracion",
    title: "Administración y experiencia",
    navLabel: "Administración",
    icon: FolderCheck,
    introduction:
      "Orden que acompaña a lo largo del ciclo de la persona.",
  },
  {
    id: "liderazgo",
    title: "Liderazgo",
    navLabel: "Liderazgo",
    icon: Compass,
    introduction:
      "Liderazgo cotidiano · Claridad para avanzar",
  },
  {
    id: "desarrollo",
    title: "Desarrollo y cultura",
    navLabel: "Desarrollo",
    icon: GraduationCap,
    introduction:
      "Mentalidad de Recursos Humanos · Prácticas que construyen equipo",
  },
  {
    id: "reflexion",
    title: "Reflexión",
    navLabel: "Reflexión",
    icon: Brain,
    introduction:
      "Una pausa antes del siguiente paso. Breves recordatorios para llevar los principios a una decisión concreta.",
  },
] as const;

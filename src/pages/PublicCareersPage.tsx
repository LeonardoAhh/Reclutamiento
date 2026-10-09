import { useMemo, useState } from 'react';
import { ArrowRight, BriefcaseBusiness, Building2, CheckCircle2, Globe, MapPin, Search, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import { ONBOARDING_DOCUMENT_CONFIG } from '@/lib/constants';
import './PublicCareersPage.css';

const companyName = ONBOARDING_DOCUMENT_CONFIG.companyName;
const companyLocation = ONBOARDING_DOCUMENT_CONFIG.location;

type PublicCopy = {
  navHome: string;
  navJobs: string;
  navWhyUs: string;
  toggleLabel: string;
  ctaPrimary: string;
  ctaSecondary: string;
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  navigationLabel: string;
  statsLabel: string;
  highlightsLabel: string;
  filtersLabel: string;
  departmentFiltersLabel: string;
  locationLabel: string;
  plantLabel: string;
  improvementLabel: string;
  metrics: { label: string; value: string }[];
  valuesTitle: string;
  values: { title: string; description: string }[];
  cultureTitle: string;
  cultureDescription: string;
  cultureItems: string[];
  jobsTitle: string;
  jobsDescription: string;
  searchPlaceholder: string;
  allDepartments: string;
  noResults: string;
  viewDetail: string;
  location: string;
  type: string;
  mode: string;
  apply: string;
  candidateCount: string;
};

type Job = {
  id: string;
  title: Record<Language, string>;
  department: Record<Language, string>;
  location: Record<Language, string>;
  modality: Record<Language, string>;
  type: Record<Language, string>;
  summary: Record<Language, string>;
  tags: string[];
};

const jobs: Job[] = [
  {
    id: 'operador-maquina',
    title: { en: 'Machine Operator', es: 'Operador de máquina' },
    department: { en: 'Production', es: 'Producción' },
    location: { en: 'Santa Rosa Jáuregui, Qro.', es: 'Santa Rosa Jáuregui, Qro.' },
    modality: { en: 'On-site', es: 'Presencial' },
    type: { en: 'Full-time', es: 'Tiempo completo' },
    summary: {
      en: 'Operate injection equipment with accuracy, safety, and a continuous improvement mindset.',
      es: 'Opera maquinaria de inyección con precisión, seguridad y una mentalidad de mejora continua.',
    },
    tags: ['Injection', 'Quality', 'Safety'],
  },
  {
    id: 'auxiliar-almacen',
    title: { en: 'Warehouse Assistant', es: 'Auxiliar de almacén' },
    department: { en: 'Warehouse', es: 'Almacén' },
    location: { en: 'Santa Rosa Jáuregui, Qro.', es: 'Santa Rosa Jáuregui, Qro.' },
    modality: { en: 'On-site', es: 'Presencial' },
    type: { en: 'Full-time', es: 'Tiempo completo' },
    summary: {
      en: 'Support inventory movement, internal logistics, and material organization with accuracy and discipline.',
      es: 'Apoya la movilización de inventario, logística interna y organización de materiales con precisión y disciplina.',
    },
    tags: ['Inventory', 'Logistics', 'Order'],
  },
  {
    id: 'tecnico-mantenimiento',
    title: { en: 'Maintenance Technician', es: 'Técnico de mantenimiento' },
    department: { en: 'Maintenance', es: 'Mantenimiento' },
    location: { en: 'Santa Rosa Jáuregui, Qro.', es: 'Santa Rosa Jáuregui, Qro.' },
    modality: { en: 'On-site', es: 'Presencial' },
    type: { en: 'Full-time', es: 'Tiempo completo' },
    summary: {
      en: 'Keep production equipment reliable by troubleshooting issues, preventive maintenance, and improving uptime.',
      es: 'Mantiene la maquinaria productiva operando con confiabilidad mediante mantenimiento preventivo y correcciones rápidas.',
    },
    tags: ['Maintenance', 'Troubleshooting', 'Plant'],
  },
  {
    id: 'analista-calidad',
    title: { en: 'Quality Analyst', es: 'Analista de calidad' },
    department: { en: 'Quality', es: 'Calidad' },
    location: { en: 'Santa Rosa Jáuregui, Qro.', es: 'Santa Rosa Jáuregui, Qro.' },
    modality: { en: 'On-site', es: 'Presencial' },
    type: { en: 'Full-time', es: 'Tiempo completo' },
    summary: {
      en: 'Monitor process quality, validate production standards, and support compliance with customer requirements.',
      es: 'Monitorea la calidad del proceso, valida estándares de producción y apoya el cumplimiento con requisitos del cliente.',
    },
    tags: ['ISO', 'Process', 'Inspection'],
  },
];

const copy: Record<Language, PublicCopy> = {
  es: {
    navHome: 'Inicio',
    navJobs: 'Vacantes',
    navWhyUs: 'Nosotros',
    toggleLabel: 'Cambiar idioma a inglés',
    ctaPrimary: 'Ver vacantes',
    ctaSecondary: 'Conócenos',
    heroEyebrow: 'Vacantes en Viñoplastic',
    heroTitle: 'Oportunidades de trabajo en la planta de Viñoplastic.',
    heroDescription:
      'Viñoplastic Inyección SA de CV opera en Santa Rosa Jáuregui, Qro., con foco en producción, calidad, logística y mantenimiento.',
    navigationLabel: 'Navegación principal',
    statsLabel: 'Indicadores clave',
    highlightsLabel: 'Resumen de la empresa',
    filtersLabel: 'Filtros de vacantes',
    departmentFiltersLabel: 'Filtros por departamento',
    locationLabel: 'Ubicación',
    plantLabel: 'Planta industrial',
    improvementLabel: 'Mejora continua',
    metrics: [
      { label: 'vacantes abiertas', value: '04' },
      { label: 'ubicación', value: 'Qro.' },
      { label: 'áreas activas', value: '04' },
    ],
    valuesTitle: 'Áreas de operación',
    values: [
      { title: 'Producción y calidad', description: 'Procesos de inyección, control de calidad y cumplimiento con estándares operativos.' },
      { title: 'Almacén y logística', description: 'Movimientos de material, inventario y flujo interno para sostener la operación.' },
      { title: 'Mantenimiento y seguridad', description: 'Mantenimiento preventivo, continuidad de equipos y condiciones seguras en la planta.' },
    ],
    cultureTitle: 'Operación industrial',
    cultureDescription:
      'La operación de Viñoplastic en Santa Rosa Jáuregui está enfocada en producción, control de calidad, orden y continuidad de procesos.',
    cultureItems: [
      'Producción y control de procesos',
      'Calidad en cada etapa',
      'Seguridad y mejora continua',
    ],
    jobsTitle: 'Vacantes abiertas',
    jobsDescription: 'Consulta las posiciones disponibles en la planta de Santa Rosa Jáuregui y encuentra la oportunidad que mejor se ajuste a tu perfil.',
    searchPlaceholder: 'Buscar por puesto, área o palabra clave',
    allDepartments: 'Todas',
    noResults: 'No encontramos vacantes con ese criterio. Intenta otra búsqueda o cambia el filtro.',
    viewDetail: 'Ver puesto',
    location: 'Ubicación',
    type: 'Tipo',
    mode: 'Modalidad',
    apply: 'Aplicar',
    candidateCount: 'candidatos',
  },
  en: {
    navHome: 'Home',
    navJobs: 'Jobs',
    navWhyUs: 'About us',
    toggleLabel: 'Switch language to Spanish',
    ctaPrimary: 'View openings',
    ctaSecondary: 'About us',
    heroEyebrow: 'Vacancies at Viñoplastic',
    heroTitle: 'Career opportunities at the Viñoplastic plant.',
    heroDescription:
      'Viñoplastic Inyección SA de CV operates in Santa Rosa Jáuregui, Qro., with focus on production, quality, logistics, and maintenance.',
    navigationLabel: 'Main navigation',
    statsLabel: 'Key metrics',
    highlightsLabel: 'Company highlights',
    filtersLabel: 'Job filters',
    departmentFiltersLabel: 'Department filters',
    locationLabel: 'Location',
    plantLabel: 'Industrial plant',
    improvementLabel: 'Continuous improvement',
    metrics: [
      { label: 'open positions', value: '04' },
      { label: 'location', value: 'Qro.' },
      { label: 'active areas', value: '04' },
    ],
    valuesTitle: 'Operating areas',
    values: [
      { title: 'Production and quality', description: 'Injection processes, quality control, and compliance with operational standards.' },
      { title: 'Warehouse and logistics', description: 'Material movement, inventory, and internal flow to support operations.' },
      { title: 'Maintenance and safety', description: 'Preventive maintenance, equipment continuity, and safe plant conditions.' },
    ],
    cultureTitle: 'Industrial operation',
    cultureDescription:
      'The Viñoplastic operation in Santa Rosa Jáuregui is focused on production, quality control, order, and process continuity.',
    cultureItems: [
      'Production and process control',
      'Quality at every stage',
      'Safety and continuous improvement',
    ],
    jobsTitle: 'Open positions',
    jobsDescription: 'Review current openings at the Santa Rosa Jáuregui plant and find the role that best matches your profile.',
    searchPlaceholder: 'Search by role, area, or keyword',
    allDepartments: 'All',
    noResults: 'We did not find any roles matching that criteria. Try another search or change the filters.',
    viewDetail: 'View opening',
    location: 'Location',
    type: 'Type',
    mode: 'Mode',
    apply: 'Apply',
    candidateCount: 'candidates',
  },
};

const departmentOptions = ['All', 'Production', 'Quality', 'Warehouse', 'Maintenance'];

const departmentLabels = {
  All: { en: 'All', es: 'Todas' },
  Production: { en: 'Production', es: 'Producción' },
  Quality: { en: 'Quality', es: 'Calidad' },
  Warehouse: { en: 'Warehouse', es: 'Almacén' },
  Maintenance: { en: 'Maintenance', es: 'Mantenimiento' },
} as const;

function PublicHeader({ language, setLanguage }: { language: Language; setLanguage: (lang: Language) => void }) {
  const t = copy[language];

  return (
    <header className="public-careers__header">
      <div className="public-careers__brand" aria-label={`${companyName} home`}>
        <span className="public-careers__brand-mark">V</span>
        <span>{companyName}</span>
      </div>
      <nav className="public-careers__nav" aria-label="Main navigation">
        <Link to="/">{t.navHome}</Link>
        <Link to="/vacantes">{t.navJobs}</Link>
      </nav>
      <div className="public-careers__actions">
        <button
          type="button"
          className="public-careers__language-toggle"
          onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
          aria-label={t.toggleLabel}
        >
          {language === 'es' ? 'EN' : 'ES'}
        </button>
        <Link className="button button--primary" to="/vacantes">
          {t.ctaPrimary}
        </Link>
      </div>
    </header>
  );
}

export function PublicLandingPage() {
  const { language, setLanguage } = useLanguage();
  const t = copy[language];

  return (
    <div className="public-careers">
      <div className="public-careers__page-shell">
        <PublicHeader language={language} setLanguage={setLanguage} />
        <main>
          <section className="public-careers__hero" aria-labelledby="public-hero-title">
            <div className="public-careers__hero-copy">
              <p className="public-careers__eyebrow">{t.heroEyebrow}</p>
              <h1 id="public-hero-title">{t.heroTitle}</h1>
              <p className="public-careers__description">{t.heroDescription}</p>
              <div className="public-careers__cta-row">
                <Link className="button button--primary" to="/vacantes">
                  {t.ctaPrimary}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </div>
            </div>
            <div className="public-careers__hero-panel" aria-label={t.highlightsLabel}>
              <div className="public-careers__panel-card public-careers__panel-card--accent">
                <Building2 aria-hidden="true" />
                <div>
                  <span>{t.locationLabel}</span>
                  <strong>{companyLocation}</strong>
                </div>
              </div>
              <div className="public-careers__panel-grid">
                <div className="public-careers__panel-card">
                  <Globe aria-hidden="true" />
                  <span>{t.plantLabel}</span>
                </div>
                <div className="public-careers__panel-card">
                  <Sparkles aria-hidden="true" />
                  <span>{t.improvementLabel}</span>
                </div>
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}

export function PublicJobsPage() {
  const { language, setLanguage } = useLanguage();
  const [query, setQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const t = copy[language];

  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesDepartment = selectedDepartment === 'All'
        || job.department.en === selectedDepartment
        || job.department.es === selectedDepartment;
      const haystack = [
        job.title[language],
        job.department[language],
        job.location[language],
        job.modality[language],
        ...job.tags,
      ].join(' ').toLowerCase();
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
      return matchesDepartment && matchesQuery;
    });
  }, [language, query, selectedDepartment]);

  const departmentFilterValues = departmentOptions.map((option) => ({
    key: option,
    label: departmentLabels[option as keyof typeof departmentLabels][language],
  }));

  return (
    <div className="public-careers">
      <div className="public-careers__page-shell public-careers__page-shell--tight">
        <PublicHeader language={language} setLanguage={setLanguage} />
        <main className="public-careers__jobs-page">
          <section className="public-careers__jobs-hero">
            <div>
              <p className="public-careers__eyebrow">{t.heroEyebrow}</p>
              <h1>{t.jobsTitle}</h1>
            </div>
            <p>{t.jobsDescription}</p>
          </section>

          <section className="public-careers__filters" aria-label={t.filtersLabel}>
            <label className="public-careers__search" htmlFor="job-search">
              <Search aria-hidden="true" />
              <input
                id="job-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.searchPlaceholder}
                aria-label={t.searchPlaceholder}
              />
            </label>
            <div className="public-careers__chip-row" role="tablist" aria-label="Departments filters">
              {departmentFilterValues.map((option) => {
                const isActive = selectedDepartment === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={isActive ? 'public-careers__chip is-active' : 'public-careers__chip'}
                    onClick={() => setSelectedDepartment(option.key)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="public-careers__job-list" aria-live="polite">
            {filteredJobs.length === 0 ? (
              <div className="public-careers__empty-state">
                <BriefcaseBusiness aria-hidden="true" />
                <p>{t.noResults}</p>
              </div>
            ) : (
              filteredJobs.map((job) => (
                <article key={job.id} className="public-careers__job-card" aria-label={job.title[language]}>
                  <div className="public-careers__job-header">
                    <div>
                      <p className="public-careers__job-department">{job.department[language]}</p>
                      <h2>{job.title[language]}</h2>
                    </div>
                    <span className="public-careers__job-type">{job.type[language]}</span>
                  </div>
                  <p className="public-careers__job-summary">{job.summary[language]}</p>
                  <div className="public-careers__job-meta">
                    <span>
                      <MapPin aria-hidden="true" />
                      {job.location[language]}
                    </span>
                    <span>
                      <Building2 aria-hidden="true" />
                      {job.modality[language]}
                    </span>
                  </div>
                  <ul className="public-careers__tag-list" aria-label={`Tags for ${job.title[language]}`}>
                    {job.tags.map((tag) => (
                      <li key={tag}>{tag}</li>
                    ))}
                  </ul>
                  <div className="public-careers__job-actions">
                    <a
                      href={`mailto:?subject=${encodeURIComponent(`${job.title[language]} - ${companyName}`)}`}
                      className="button button--primary"
                      aria-label={`${t.apply} ${job.title[language]}`}
                    >
                      {t.apply}
                      <ArrowRight aria-hidden="true" />
                    </a>
                    <span className="public-careers__job-count">
                      {job.tags.length + 2} {t.candidateCount}
                    </span>
                  </div>
                </article>
              ))
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

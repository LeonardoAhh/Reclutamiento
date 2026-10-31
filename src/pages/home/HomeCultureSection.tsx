import { useLanguage } from '@/contexts/LanguageContext';
import { HOME_CULTURE } from '../homeContent';
import { homeText } from '../homeTranslations';
import './HomeCultureSection.css';

export function HomeCultureSection() {
  const { language } = useLanguage();

  return (
    <section className="home-culture" aria-labelledby="home-culture-title">
      <header className="home-culture__header">
        <p className="home-culture__eyebrow">{homeText(HOME_CULTURE.eyebrow, language)}</p>
        <h2 id="home-culture-title" className="home-culture__title">
          {homeText(HOME_CULTURE.title, language)}
        </h2>
        <p className="home-culture__introduction">{homeText(HOME_CULTURE.introduction, language)}</p>
      </header>
      <div className="home-culture__pillars">
        {HOME_CULTURE.pillars.map((pillar) => (
          <article className="home-culture__pillar" key={pillar.title}>
            <h3>{homeText(pillar.title, language)}</h3>
            <p>{homeText(pillar.description, language)}</p>
          </article>
        ))}
      </div>
      <footer className="home-culture__closing">
        <blockquote>{homeText(HOME_CULTURE.closing, language)}</blockquote>
        <p>{homeText(HOME_CULTURE.ending, language)}</p>
      </footer>
    </section>
  );
}

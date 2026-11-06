import { BadgeDollarSign, ChartNoAxesCombined } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { getConfiguracionHref } from '@/lib/configuracionNavigation';
import { toNaturalCase } from '@/lib/utils';
import { HomeCultureSection } from './home/HomeCultureSection';
import './HomePage.css';

export function HomePage() {
  const { language } = useLanguage();
  const en = language === 'en';
  const { profile, username } = useAuth();

  if (!profile) return null;

  const displayName = toNaturalCase(profile.display_name || username, {
    preserveAcronyms: false,
  });
  const firstName = displayName.split(/\s+/)[0] || '';
  const greeting = firstName
    ? `${en ? 'Hello' : 'Hola'}, ${firstName}.`
    : en ? 'Hello.' : 'Hola.';

  return (
    <main className="home-page container" aria-labelledby="home-page-title">
      <header className="home-page__top-row">
        <h1 id="home-page-title" className="home-page__greeting">
          {greeting}
        </h1>
        <nav className="home-page__quick-links" aria-label={en ? 'Quick links' : 'Accesos directos'}>
          <Link
            className="home-page__quick-link"
            to={getConfiguracionHref('tabulador')}
            aria-label={en ? 'Pay Scale' : 'Tabulador'}
            data-cuelume-navigate=""
          >
            <BadgeDollarSign aria-hidden="true" />
            <span aria-hidden="true">{en ? 'Pay Scale' : 'Tabulador'}</span>
          </Link>
          {profile.role === 'admin' && (
            <Link
              className="home-page__quick-link"
              to={getConfiguracionHref('indicadores')}
              aria-label={en ? 'Metrics' : 'Indicadores'}
              data-cuelume-navigate=""
            >
              <ChartNoAxesCombined aria-hidden="true" />
              <span aria-hidden="true">{en ? 'Metrics' : 'Indicadores'}</span>
            </Link>
          )}
        </nav>
      </header>

      <HomeCultureSection />
    </main>
  );
}

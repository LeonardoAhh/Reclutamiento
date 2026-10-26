import { Link } from 'react-router-dom';
import type { Language } from '@/contexts/LanguageContext';
import { getLocalizedNavigation } from './navigation';

type BreadcrumbsProps = {
  pathname: string;
  language: Language;
};

export function Breadcrumbs({ pathname, language }: BreadcrumbsProps) {
  const match = getLocalizedNavigation(language)
    .flatMap((section) => section.items.map((item) => ({ section, item })))
    .filter(({ item }) => pathname === item.to || (!item.end && pathname.startsWith(`${item.to}/`)))
    .sort((a, b) => b.item.to.length - a.item.to.length)[0];
  if (!match?.section.label) return null;

  return (
    <nav className="app-breadcrumbs" aria-label={language === 'en' ? 'Breadcrumbs' : 'Ruta de navegación'}>
      <span>{match.section.label}</span>
      {pathname !== match.item.to && <>
        <span aria-hidden="true">/</span>
        <Link to={match.item.to}>{match.item.label}</Link>
      </>}
    </nav>
  );
}

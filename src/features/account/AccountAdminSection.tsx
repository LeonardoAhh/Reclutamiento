import { Fragment, useId } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { TEAM_PATH } from '@/components/layout/navigation';
import { UserActivityPanel } from '@/features/system/UserActivityPanel';
import type { AccountCopy } from '@/pages/account-translations';
import { AccountSection } from './AccountSection';
import { MaintenanceControl } from './MaintenanceControl';

interface AccountAdminSectionProps {
  copy: AccountCopy;
  english: boolean;
  sessionLoading: boolean;
}

/** Herramientas de administración: equipo, mantenimiento y actividad de usuarios. */
export function AccountAdminSection({ copy, english, sessionLoading }: AccountAdminSectionProps) {
  const id = useId();
  return (
    <Fragment>
      <AccountSection id={id} title={copy.administration} className="account-admin">
        <div className="account-rows">
          <Link to={TEAM_PATH} className="account-row account-row--link">
            <span className="account-row__copy">
              <span className="account-row__title">{copy.team}</span>
              <span className="account-row__description">{copy.teamDescription}</span>
            </span>
            <ChevronRight className="account-row__chevron" size="var(--icon-size-md)" aria-hidden="true" />
          </Link>
          <MaintenanceControl copy={copy} english={english} sessionLoading={sessionLoading} />
        </div>
      </AccountSection>
      <div className="account-activity"><UserActivityPanel variant="avatars" /></div>
    </Fragment>
  );
}

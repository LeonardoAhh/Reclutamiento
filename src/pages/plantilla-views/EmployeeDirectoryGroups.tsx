import { ChevronDown, ChevronUp } from 'lucide';

import { MorphingIcon } from '@/components/ui/MorphingIcon';
import type { Employee } from '@/lib/types';
import { EmployeeDirectoryList } from './EmployeeDirectoryList';
import type { DepartmentGroup } from './employeeDirectory';

interface DirectoryActions {
  onEdit: (employee: Employee) => void;
  onIncapacidad: (employee: Employee) => void;
}

interface DesktopEmployeeDirectoryProps extends DirectoryActions {
  groups: DepartmentGroup[];
  activeGroup: DepartmentGroup | null;
  selectedArea: string | null;
  onSelectArea: (area: string) => void;
}

export function DesktopEmployeeDirectory({
  groups,
  activeGroup,
  selectedArea,
  onSelectArea,
  onEdit,
  onIncapacidad,
}: DesktopEmployeeDirectoryProps) {
  return (
    <div className="empleados__layout">
      <nav className="empleados__rail" aria-label="Departamentos">
        <ul className="empleados__rail-list" role="list">
          {groups.map((group) => (
            <li key={group.area}>
              <button
                type="button"
                className={`empleados__rail-item${
                  group.area === selectedArea
                    ? ' empleados__rail-item--active'
                    : ''
                }`}
                onClick={() => onSelectArea(group.area)}
                aria-current={group.area === selectedArea}
              >
                <span className="empleados__rail-name">{group.area}</span>
                <span className="empleados__rail-count">
                  {group.empleados.length}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <section
        className="empleados__detail"
        aria-labelledby="empleados-department-heading"
      >
        {activeGroup && (
          <>
            <header className="empleados__detail-head">
              <h2
                id="empleados-department-heading"
                className="empleados__detail-name"
              >
                {activeGroup.area}
              </h2>
              <span className="empleados__detail-count">
                {activeGroup.empleados.length}{' '}
                {activeGroup.empleados.length === 1 ? 'empleado' : 'empleados'}
              </span>
            </header>
            <div className="empleados__detail-body">
              <EmployeeDirectoryList
                employees={activeGroup.empleados}
                onEdit={onEdit}
                onIncapacidad={onIncapacidad}
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}

interface MobileEmployeeDirectoryProps extends DirectoryActions {
  groups: DepartmentGroup[];
  expandedAreas: Set<string>;
  onToggleArea: (area: string) => void;
}

export function MobileEmployeeDirectory({
  groups,
  expandedAreas,
  onToggleArea,
  onEdit,
  onIncapacidad,
}: MobileEmployeeDirectoryProps) {
  return (
    <div className="empleados__accordion">
      {groups.map((group) => {
        const isExpanded = expandedAreas.has(group.area);
        const panelId = `empleados-panel-${encodeURIComponent(group.area)}`;

        return (
          <section key={group.area} className="empleados__acc-item">
            <h2 className="empleados__acc-heading">
              <button
                type="button"
                className="empleados__acc-trigger"
                onClick={() => onToggleArea(group.area)}
                aria-expanded={isExpanded}
                aria-controls={panelId}
              >
                <span className="empleados__acc-name">{group.area}</span>
                <span className="empleados__acc-count">
                  {group.empleados.length}
                </span>
                <MorphingIcon
                  icon={isExpanded ? ChevronUp : ChevronDown}
                  size="var(--icon-size-sm)"
                  aria-hidden="true"
                  className="empleados__acc-chevron"
                />
              </button>
            </h2>
            {isExpanded && (
              <div id={panelId} className="empleados__acc-panel">
                <EmployeeDirectoryList
                  employees={group.empleados}
                  onEdit={onEdit}
                  onIncapacidad={onIncapacidad}
                />
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

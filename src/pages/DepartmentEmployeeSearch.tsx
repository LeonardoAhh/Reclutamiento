import { useMemo, useRef, useState } from 'react';
import { PageHeaderAccessory } from '@/components/layout/PageHeading';
import { useReportLocale } from '@/components/reporte-diario/useReportLocale';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/Popover';
import { SearchField } from '@/components/ui/SearchField';
import { useIsMobile } from '@/hooks/useIsMobile';
import { getFirstGivenName } from '@/lib/names';
import {
  DEPARTMENT_EMPLOYEE_SEARCH_MIN_LENGTH,
  findDepartmentEmployeeMatches,
  normalizeDepartmentEmployeeSearch,
  type DepartmentEmployee,
} from './department-incidences';
import './DepartmentEmployeeSearch.css';

interface DepartmentEmployeeSearchProps {
  employees: DepartmentEmployee[];
  disabled?: boolean;
  onSelect: (employee: DepartmentEmployee) => void;
}

export function DepartmentEmployeeSearch({ employees, disabled = false, onSelect }: DepartmentEmployeeSearchProps) {
  const { copy } = useReportLocale();
  const isMobile = useIsMobile();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const firstResultRef = useRef<HTMLButtonElement>(null);
  const matches = useMemo(() => findDepartmentEmployeeMatches(employees, query), [employees, query]);

  const updateQuery = (value: string) => {
    const nextQuery = normalizeDepartmentEmployeeSearch(value);
    setQuery(nextQuery);
    setOpen(nextQuery.length >= DEPARTMENT_EMPLOYEE_SEARCH_MIN_LENGTH);
  };

  const selectEmployee = (employee: DepartmentEmployee) => {
    setQuery('');
    setOpen(false);
    onSelect(employee);
  };

  if (isMobile) return null;

  return (
    <PageHeaderAccessory>
      <Popover open={open && !disabled} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="department-employee-search">
            <SearchField
              aria-describedby="department-employee-search-hint"
              autoComplete="off"
              className="search-field--intrinsic search-field--department-header"
              disabled={disabled}
              inputMode="numeric"
              label={copy('Buscar empleado por número, de 3 a 5 dígitos', 'Search employee by number, 3 to 5 digits')}
              maxLength={5}
              onChange={(event) => updateQuery(event.currentTarget.value)}
              onClear={() => updateQuery('')}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setOpen(false);
                  return;
                }
                if (event.key === 'ArrowDown' && matches.length > 0) {
                  event.preventDefault();
                  firstResultRef.current?.focus();
                  return;
                }
                const exactMatch =
                  query.length >= DEPARTMENT_EMPLOYEE_SEARCH_MIN_LENGTH
                    ? employees.find((employee) => employee.number === query)
                    : undefined;
                if (event.key === 'Enter' && exactMatch) {
                  event.preventDefault();
                  selectEmployee(exactMatch);
                }
              }}
              pattern="[0-9]{1,5}"
              placeholder={copy('Núm. empleado', 'Employee no.')}
              value={query}
            />
            <span id="department-employee-search-hint" className="sr-only">
              {copy(
                'Escribe al menos 3 dígitos para buscar. Se muestran hasta 5 resultados.',
                'Enter at least 3 digits to search. Up to 5 results are shown.',
              )}
            </span>
          </div>
        </PopoverAnchor>
        <PopoverContent
          align="end"
          aria-label={copy('Resultados de búsqueda', 'Search results')}
          className="department-employee-search__results"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          {matches.length > 0 ? (
            <ul className="department-employee-search__list">
              {matches.map((employee) => {
                const firstName = getFirstGivenName(employee.name);

                return (
                  <li key={employee.number}>
                    <button
                      ref={employee === matches[0] ? firstResultRef : undefined}
                      type="button"
                      className="department-employee-search__result btn-ghost"
                      onClick={() => selectEmployee(employee)}
                    >
                      <span className="department-employee-search__number">{employee.number}</span>
                      {firstName && <span className="department-employee-search__details">{firstName}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <output className="department-employee-search__empty">
              {copy('No hay colaboradores con ese número.', 'No employees match that number.')}
            </output>
          )}
        </PopoverContent>
      </Popover>
    </PageHeaderAccessory>
  );
}

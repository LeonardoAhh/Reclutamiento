import { useState, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { CustomSelect, type Option } from "@/components/ui/CustomSelect";
import { Popover, PopoverContent, PopoverTrigger, PopoverTitle } from "@/components/ui/Popover";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useDataUpdateText } from "./translations";

interface DataUpdateWorkFiltersProps {
  children: ReactNode;
  area: string;
  areaOptions: readonly Option[];
  pending: boolean;
  onAreaChange: (value: string) => void;
  onPendingChange: (value: boolean) => void;
  onClear: () => void;
}

export function DataUpdateWorkFilters({ children, area, areaOptions, pending, onAreaChange, onPendingChange, onClear }: DataUpdateWorkFiltersProps) {
  const t = useDataUpdateText();
  const mobile = useMediaQuery("(max-width: 767px)");
  const [open, setOpen] = useState(false);
  const count = Number(Boolean(area)) + Number(pending);
  const controls = (
    <>
      <div className="form-group data-update-work-group-navigation">
        <label className="sr-only" htmlFor="data-update-work-group-navigation">{t("Filtrar por área")}</label>
        <CustomSelect
          id="data-update-work-group-navigation"
          value={area}
          options={areaOptions}
          placeholder={t("Todas las áreas", "All departments")}
          showPlaceholderOption
          onChange={onAreaChange}
        />
      </div>
      <CustomSelect
        id="data-update-work-status"
        className="data-update-work-status"
        aria-label={t("Estado del registro", "Record status")}
        value={pending ? "pending" : "all"}
        options={[
          { value: "all", label: t("Todos") },
          { value: "pending", label: t("Pendientes") },
        ]}
        showPlaceholderOption={false}
        onChange={(value) => onPendingChange(value === "pending")}
      />
    </>
  );

  return (
    <div className="data-update-work-toolbar">
      {children}
      {mobile ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button type="button" className="btn-secondary data-update-work-filters-trigger">
              <SlidersHorizontal size="var(--icon-size-sm)" aria-hidden="true" />
              <span>{t("Filtros", "Filters")}</span>
              {count > 0 && <span className="data-update-work-filters-count">{count}</span>}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="data-update-work-filters-panel" aria-label={t("Filtros", "Filters")}>
            <PopoverTitle>{t("Filtros", "Filters")}</PopoverTitle>
            {controls}
            <div className="data-update-work-filters-actions">
              <button type="button" className="btn-secondary" disabled={count === 0} onClick={onClear}>{t("Limpiar filtros")}</button>
              <button type="button" className="btn-primary" onClick={() => setOpen(false)}>{t("Listo", "Done")}</button>
            </div>
          </PopoverContent>
        </Popover>
      ) : controls}
    </div>
  );
}

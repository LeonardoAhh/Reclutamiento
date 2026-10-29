import type { CoverageKey } from "@/lib/workforceProjection";

interface CoverageCategoryDescriptor {
  key: CoverageKey;
  label: string;
}

export const COVERAGE_CATEGORIES: readonly CoverageCategoryDescriptor[] = [
  { key: "plantilla", label: "Plantilla" },
  { key: "backup", label: "Backup" },
  { key: "starlite", label: "Starlite" },
];

export function coverageCategoryLabel(key: CoverageKey): string {
  return COVERAGE_CATEGORIES.find((category) => category.key === key)?.label ?? key;
}

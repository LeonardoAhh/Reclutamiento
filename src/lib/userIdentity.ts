export type UserRole = "admin" | "reclutador";

const ROLE_TITLES: Readonly<Record<UserRole, string>> = {
  admin: "Administrador",
  reclutador: "Analista de Reclutamiento",
};

export function getUserTitle(
  role: UserRole | null | undefined,
  configuredTitle: string | null | undefined,
) {
  if (configuredTitle?.trim()) return configuredTitle.trim();

  return role ? ROLE_TITLES[role] : "Usuario";
}

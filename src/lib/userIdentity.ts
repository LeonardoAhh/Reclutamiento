export type UserRole = "admin" | "reclutador";

const ROLE_TITLES: Readonly<Record<UserRole, string>> = {
  admin: "Administrador",
  reclutador: "Analista de Reclutamiento",
};

const USER_TITLE_BY_EMAIL: Readonly<Record<string, string>> = {
  "leonardo@reclutamiento.local": "Coordinador de Reclutamiento",
  "noemi@reclutamiento.local": "Jefe de Recursos Humanos",
};

export function getUserTitle(
  role: UserRole | null | undefined,
  email: string | null | undefined,
) {
  const normalizedEmail = email?.trim().toLowerCase();
  if (normalizedEmail && USER_TITLE_BY_EMAIL[normalizedEmail]) {
    return USER_TITLE_BY_EMAIL[normalizedEmail];
  }

  return role ? ROLE_TITLES[role] : "Usuario";
}

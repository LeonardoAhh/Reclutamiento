import type { Language } from "@/contexts/LanguageContext";

const translations = {
  es: {
    title: "Mi cuenta",
    changeAvatar: (name: string) => `Cambiar foto de perfil de ${name}`,
    changePassword: "Cambiar contraseña",
    password: "Contraseña",
    passwordDescription: "Actualiza la contraseña de acceso a tu cuenta.",
    recognition: "Reconocimientos",
    recognitionDescription: "Configura cuándo quieres ver tus avances y logros.",
    administration: "Administración",
    team: "Equipo",
    teamDescription: "Administra integrantes, nombres y bajas de acceso.",
    maintenance: "Modo mantenimiento",
    maintenanceDescription: "Controla el acceso general al sistema.",
    userActivity: "Actividad de usuarios",
    checking: "Consultando…",
    unavailable: "No disponible",
    active: "Activo",
    inactive: "Inactivo",
  },
  en: {
    title: "My account",
    changeAvatar: (name: string) => `Change ${name}'s profile picture`,
    changePassword: "Change password",
    password: "Password",
    passwordDescription: "Update the password used to access your account.",
    recognition: "Recognition",
    recognitionDescription: "Choose when you want to see your progress and achievements.",
    administration: "Administration",
    team: "Team",
    teamDescription: "Manage members, names, and access deactivation.",
    maintenance: "Maintenance mode",
    maintenanceDescription: "Control general access to the system.",
    userActivity: "User activity",
    checking: "Checking…",
    unavailable: "Unavailable",
    active: "Active",
    inactive: "Inactive",
  },
} as const;

export function accountCopy(language: Language) {
  return translations[language];
}

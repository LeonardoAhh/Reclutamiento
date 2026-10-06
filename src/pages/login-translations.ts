import type { Language } from "@/contexts/LanguageContext";

export type LoginLanguage = Language;

export const loginTranslations = {
  es: {
    pageTitle: "Iniciar sesión",
    formLabel: "Formulario de inicio de sesión",
    username: "Usuario",
    usernamePlaceholder: "Tu usuario",
    password: "Contraseña",
    rememberUsername: "Recordar usuario",
    showPassword: "Mostrar contraseña",
    hidePassword: "Ocultar contraseña",
    capsLock: "Bloq Mayús activado",
    submit: "Ingresar",
    loading: "Verificando…",
    success: "¡Bienvenido!",
    usernameRequired: "Ingresa tu usuario.",
    passwordRequired: "Ingresa tu contraseña.",
    invalidCredentials: "Usuario o contraseña incorrectos.",
    unconfirmedAccount: "Cuenta sin confirmar. Pide ayuda a tu administrador.",
    genericError: "No se pudo iniciar sesión. Inténtalo de nuevo.",
    legalNotice: "© 2026 LAHH. Todos los derechos reservados.",
    legalNoticeLabel: "Aviso legal",
    languageStorageError: "El idioma se aplica aquí, pero este navegador no permite guardarlo.",
    storyTitle: "Tu espacio de trabajo.",
    storyDescription: "Retoma los pendientes de reclutamiento y personal.",
    greeting: "Hola",
    storyGreeting: "Hola, soy Wave.",
    storyWelcome: "Qué gusto verte de nuevo por aquí.",
  },
  en: {
    pageTitle: "Sign in",
    formLabel: "Sign-in form",
    username: "Username",
    usernamePlaceholder: "Your username",
    password: "Password",
    rememberUsername: "Remember username",
    showPassword: "Show password",
    hidePassword: "Hide password",
    capsLock: "Caps Lock is on",
    submit: "Sign in",
    loading: "Verifying…",
    success: "Welcome!",
    usernameRequired: "Enter your username.",
    passwordRequired: "Enter your password.",
    invalidCredentials: "Incorrect username or password.",
    unconfirmedAccount: "Account not confirmed. Ask your administrator for help.",
    genericError: "Could not sign in. Please try again.",
    legalNotice: "© 2026 LAHH. All rights reserved.",
    legalNoticeLabel: "Legal notice",
    languageStorageError: "The language applies here, but this browser does not allow saving it.",
    storyTitle: "Your workspace.",
    storyDescription: "Pick up where you left off with recruiting and personnel tasks.",
    greeting: "Hello",
    storyGreeting: "Hello, I'm Wave.",
    storyWelcome: "It's great to see you again.",
  },
} as const;

export type LoginMessageKey =
  | "usernameRequired"
  | "passwordRequired"
  | "invalidCredentials"
  | "unconfirmedAccount"
  | "genericError";

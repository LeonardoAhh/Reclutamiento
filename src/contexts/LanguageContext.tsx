import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Language = "es" | "en";

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  storageError: boolean;
}

const LANGUAGE_STORAGE_KEY = "reclutamiento_login_language";
const DEFAULT_LANGUAGE: Language = "en";
const LanguageContext = createContext<LanguageContextValue | null>(null);

function readPreference(): { language: Language; storageError: boolean } {
  try {
    const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return {
      language: storedLanguage === "es" || storedLanguage === "en"
        ? storedLanguage
        : DEFAULT_LANGUAGE,
      storageError: false,
    };
  } catch {
    return { language: DEFAULT_LANGUAGE, storageError: true };
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState(readPreference);

  useEffect(() => {
    document.documentElement.lang = preference.language === "en" ? "en" : "es-MX";
  }, [preference.language]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== LANGUAGE_STORAGE_KEY) return;
      setPreference({
        language: event.newValue === "es" || event.newValue === "en"
          ? event.newValue
          : DEFAULT_LANGUAGE,
        storageError: false,
      });
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const setLanguage = useCallback((language: Language) => {
    setPreference({ language, storageError: false });
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      setPreference({ language, storageError: true });
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ ...preference, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage debe usarse dentro de LanguageProvider.");
  }
  return context;
}

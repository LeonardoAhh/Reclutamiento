import { useLanguage } from "@/contexts/LanguageContext";

export function useLoginLanguage() {
  const { language, setLanguage, storageError } = useLanguage();
  return { language, changeLanguage: setLanguage, storageError };
}

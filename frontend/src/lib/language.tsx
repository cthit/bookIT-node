import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

type Language = "en" | "sv";

const LanguageContext = createContext<{
  language: Language;
  setLanguage: (language: Language) => void;
}>({ language: "en", setLanguage: () => undefined });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, update] = useState<Language>(() =>
    localStorage.getItem("bookit-language") === "sv" ? "sv" : "en",
  );

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((value: Language) => {
    localStorage.setItem("bookit-language", value);
    update(value);
  }, []);

  return <LanguageContext value={{ language, setLanguage }}>{children}</LanguageContext>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  return { ...context, t: (en: string, sv: string) => (context.language === "sv" ? sv : en) };
}

import { createContext, useContext } from "react";
import { Language, Translations, translations } from "./i18n";

interface I18nContextType {
  language: Language;
  t: Translations;
}

export const I18nContext = createContext<I18nContextType>({
  language: "en",
  t: translations.en,
});

export const useI18n = () => useContext(I18nContext);

import React, { useEffect, useState, useContext, useReducer } from "react";

const Translations = React.createContext(["en", e => {}]);
const LANGUAGES = ["en", "sv"];

const createTranslationDict = (translations, activeLanguage) => {
  const languageIndex = LANGUAGES.indexOf(activeLanguage);
  return Object.keys(translations).reduce((texts, key) => {
    texts[key] = translations[key][languageIndex];
    return texts;
  }, {});
};

export const useTranslations = (translations = {}) => {
  const [activeLanguage, setActiveLanguage] = useContext(Translations);
  const [text, setText] = useReducer(
    (state, action) => ({ ...state, ...action }),
    createTranslationDict({}, activeLanguage),
  );

  useEffect(() => {
    console.log("language", activeLanguage);
    setText(createTranslationDict(translations, activeLanguage));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLanguage, setText]);

  return [text, activeLanguage, setActiveLanguage, setText];
};

const TranslationsProvider = ({ defaultLanguage = "en", children }) => {
  const [activeLanguage, setActiveLanguage] = useState(defaultLanguage);

  return (
    <Translations.Provider value={[activeLanguage, setActiveLanguage]}>
      {children}
    </Translations.Provider>
  );
};

export default TranslationsProvider;

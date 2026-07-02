"use client";

import i18next from "i18next";
import {
  initReactI18next,
  useTranslation as useTranslationOrg,
} from "react-i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import { getOptions, languages, preloadedNamespaces } from "./settings";

const runsOnServerSide = typeof window === "undefined";

i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(
    resourcesToBackend(
      (language: string, namespace: string) =>
        import(`./locales/${language}/${namespace}.json`),
    ),
  )
  .init({
    ...getOptions(),
    lng: undefined, // let detect the language on client side
    detection: {
      order: ["cookie", "htmlTag", "navigator"], // Removed 'path' from the detection order
    },
    preload: runsOnServerSide ? languages : [],
    interpolation: {
      escapeValue: false,
    },
  });

export const setI18nLanguage = async (locale: string | undefined) => {
  if (runsOnServerSide) return;

  const preferredLanguage = locale ?? i18next.language;

  try {
    await i18next.loadNamespaces(preloadedNamespaces);

    if (i18next.language !== preferredLanguage) {
      await i18next.changeLanguage(preferredLanguage); // i18next auto-updates cookie
    }
  } catch (error) {
    console.error("I18n - Failed to load i18n namespaces:", error);
  }
};

export function useTranslation(ns?: string | readonly string[], options = {}) {
  const ret = useTranslationOrg(ns, options);
  return ret;
}

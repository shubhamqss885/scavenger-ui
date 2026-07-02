"use client";

import { useEffect } from "react";
import { useTranslation } from "@/lib/i18n/client";

// Keeps <html lang> in sync with the language i18next actually resolved on the
// client. The server renders a static default lang (the app fallback), so this
// corrects it for screen readers / SEO once detection settles — without forcing
// the root layout to read cookies (which would deopt static rendering).
const HtmlLangSync = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    const apply = (lng: string) => {
      if (lng && document.documentElement.lang !== lng) {
        document.documentElement.lang = lng;
      }
    };

    apply(i18n.language);
    i18n.on("languageChanged", apply);
    return () => {
      i18n.off("languageChanged", apply);
    };
  }, [i18n]);

  return null;
};

export default HtmlLangSync;

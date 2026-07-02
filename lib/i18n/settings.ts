const fallbackLng = "de";

export const languages = [fallbackLng, "en"];

const defaultNS = "common";

export const preloadedNamespaces = [
  "common",
  "home",
  "project",
  "database",
  "dashboard",
  "settings",
  "auth",
  "onboarding",
  "agentic-chat",
  "connectors",
  "limits",
];

export function getOptions(
  lng = fallbackLng,
  ns: string | string[] = defaultNS,
) {
  return {
    // debug: true,
    supportedLngs: languages,
    fallbackLng,
    lng,
    fallbackNS: defaultNS,
    defaultNS,
    preload: languages,
    ns: preloadedNamespaces,
  };
}

// SINGLE SOURCE OF TRUTH for the demo's widget config (shared by both demo pages).
//
// The web component is PROPS-ONLY: it reads everything from element attributes and
// never touches the host page's environment. This file holds the demo's values plus
// applyScavDemoConfig(), which each HTML's mount script calls to copy these camelCase
// keys → kebab attributes on <scavenger-chat>. To embed for real, set the same
// attributes on your own tag:
//   <scavenger-chat api-base-url="…" ws-base-url="…" auth0-domain="…" …>
//
// Change connection / auth / branding values HERE and nowhere else.
//   - demo/demo.html — built bundle (dist-web-component/)
//   - demo/dev.html  — source + Vite HMR (npm run web-component:dev)
window.SCAV_DEMO_CONFIG = {
  apiBaseUrl: "https://api-dev.scavenger-ai.com",
  wsBaseUrl: "wss://api-dev.scavenger-ai.com",
  auth0Domain: "auth.scavenger-ai.com",
  auth0ClientId: "1dCw1d4QgPfQ2CLYoYK6QEc1o2YbdTbH",
  auth0Audience: "https://api-dev.scavenger-ai.com",
  externalClientId: "92",
  tenant: "OPTIWISER",
  widgetTitle: "Scavenger Chat (React web component)",

  // --- Branding (optional) → CSS variables on the widget's shadow :host ---
  // Omit any to fall back to the app's default.
  //   accentColor : shadcn's --primary token = HSL CHANNELS "H S% L%" (NOT hex/rgb).
  //                 e.g. #12B6AA → "176 82% 39%" (the app's own default).
  //   borderRadius: any CSS length (app default 0.5rem).
  //   fontFamily  : any CSS font stack.
  //   fontScale   : whole-widget zoom factor (1 = default, 1.1 = 10% larger).
  accentColor: "262 83% 28%",
  borderRadius: "0px",
  fontFamily: "Poppins, Arial, sans-serif",
  fontScale: "1",
};

// Copy SCAV_DEMO_CONFIG onto the element as kebab-case attributes (camelCase →
// kebab). Both demo pages call this, so the mapping lives in one place.
window.applyScavDemoConfig = (el) => {
  for (const [k, v] of Object.entries(window.SCAV_DEMO_CONFIG || {})) {
    if (v == null) continue;
    el.setAttribute(
      k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase()),
      String(v),
    );
  }
};

// PostCSS plugin — WIDGET BUILD ONLY (wired in vite.web-component.config.ts, never
// in the shared postcss.config.mjs the Next build uses).
//
// The web component adopts the app's compiled Tailwind into its shadow root. A few
// of the app's global selectors don't mean anything inside a shadow tree, so rewrite
// them to target the shadow host instead:
//   :root            → :host         (the 57 design tokens land on the host, inherit down)
//   leading `body`   → :host         (there is no <body> in a shadow tree)
//   leading `scavenger-chat` → :host (web-component/styles.css host-element rules)
//
// Left untouched on purpose:
//   - Preflight already emits `html,:host{…}` (Tailwind 3.4) so the base html rules
//     reach the host for free.
//   - `*`, `::before/::after`, `::-webkit-scrollbar` are naturally scoped to the
//     shadow tree — that scoping is the whole point of the flip.
//   - `.dark` / `:is(.dark *)` dark-mode rules: a `.dark` ancestor on the host does
//     NOT cross the shadow boundary, so dark mode needs more than a selector swap.
//     It is intentionally deferred (light-only); these rules stay inert.
//
// Runs in OnceExit so the whole sheet (incl. Tailwind-expanded `@apply`/preflight)
// exists before we walk it.
import type { Plugin, Root } from "postcss";

const toHost = (selector: string): string =>
  selector
    .replace(/^scavenger-chat\b/, ":host")
    .replace(/:root\b/g, ":host")
    .replace(/^body\b/, ":host");

export const shadowHostTransform = (): Plugin => ({
  postcssPlugin: "scav-shadow-host-transform",
  OnceExit(root: Root) {
    // Only rewrite the widget's OWN adopted CSS (app globals.css + web-component/
    // styles.css). In dev, Vite pipes the demo pages' inline <style> through this same
    // PostCSS chain; rewriting THEIR selectors would break the host page's layout —
    // e.g. dev.html's `body { display:flex }` → `:host {…}`, which matches nothing in
    // the light DOM and collapses the <scavenger-chat> element. HTML-sourced CSS is
    // host-page chrome, never adopted into the shadow root, so leave it untouched.
    // `input.from` is the file path or, for Vite's inline-<style> html-proxy modules
    // (e.g. `…/dev.html?html-proxy&inline-css&index=0.css`), the virtual id — both
    // carry `.html` for host-page CSS; the widget's .css files never do.
    const from = root.source?.input?.from ?? "";

    if (from.includes(".html")) return;

    root.walkRules((rule) => {
      rule.selectors = rule.selectors.map(toHost);
    });
  },
});

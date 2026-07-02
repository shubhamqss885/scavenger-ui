// Shadow-root stylesheet adoption.
//
// The compiled, shadow-host-transformed CSS (see css-transform.ts) is imported as a
// STRING via Vite's `?inline` — so no `scavenger-chat.css` is emitted; the styles
// ride inside the JS and are adopted directly into each element's shadow root.
//
// One module-level constructable stylesheet is shared across every <scavenger-chat>
// on the page (constructable sheets can be adopted by many roots → no per-instance
// duplication). adoptStyles() is called in index.tsx's connectedCallback BEFORE
// r2wc mounts React, so the first paint is already styled (no FOUC).
//
// `sonner/dist/styles.css` is bundled in too: sonner self-injects its base CSS into
// document.head (light DOM), which never reaches the shadow tree, so its toaster
// (mounted inside the shadow root) would otherwise be unstyled.
import globalsCss from "@/app/globals.css?inline";
import overridesCss from "./styles.css?inline";
import sonnerCss from "sonner/dist/styles.css?inline";

const cssText = `${globalsCss}\n${sonnerCss}\n${overridesCss}`;

const supportsConstructable =
  typeof CSSStyleSheet !== "undefined" &&
  "replaceSync" in CSSStyleSheet.prototype &&
  typeof Document !== "undefined" &&
  "adoptedStyleSheets" in Document.prototype;

let sharedSheet: CSSStyleSheet | null = null;

const getSheet = (): CSSStyleSheet => {
  if (!sharedSheet) {
    sharedSheet = new CSSStyleSheet();
    sharedSheet.replaceSync(cssText);
  }
  return sharedSheet;
};

export const adoptStyles = (root: ShadowRoot): void => {
  if (supportsConstructable) {
    const sheet = getSheet();

    if (!root.adoptedStyleSheets.includes(sheet)) {
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
    }
    return;
  }
  // Fallback (pre-Safari 16.4): inject a <style> into the shadow root. Idempotent.
  if (!root.querySelector("style[data-scav-styles]")) {
    const style = document.createElement("style");
    style.setAttribute("data-scav-styles", "");
    style.textContent = cssText;
    root.appendChild(style);
  }
};

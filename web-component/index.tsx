// Web-component entry: registers <scavenger-chat> as a custom element (the
// main.tsx role). r2wc wraps the React root (WidgetRoot) into a custom element;
// `props` maps the element's attributes/properties → React props. The DOM is
// stringly-typed, so every value is "string"; these names mirror WidgetProps in
// ./config.
//
// Shadow DOM (`shadow: "open"`) so the app's compiled Tailwind (preflight + base
// layer + tokens) is isolated to the widget's own tree and never restyles the
// host page. r2wc creates the shadow root in its constructor and passes it to
// React as the `container` prop; we subclass to adopt the stylesheet into that
// root BEFORE r2wc mounts React, so the first paint is already styled (no FOUC).

// MUST be first: creates the widget's own process.env before any module that
// reads it evaluates (ES imports hoist, so this side-effect import runs first).
import "./env-shim";
import r2wc from "@r2wc/react-to-web-component";
import WidgetRoot from "./WidgetRoot";
import { adoptStyles } from "./shadow-styles";

// r2wc returns an HTMLElement subclass whose connectedCallback mounts React.
type R2wcElementCtor = {
  new (): HTMLElement & { connectedCallback(): void };
};

const BaseElement = r2wc(WidgetRoot, {
  shadow: "open",
  props: {
    apiBaseUrl: "string",
    wsBaseUrl: "string",
    auth0Domain: "string",
    auth0ClientId: "string",
    auth0Audience: "string",
    tenant: "string",
    externalClientId: "string",
    widgetTitle: "string",
    // Branding → CSS vars on :host (applied in WidgetRoot). Kebab attributes:
    // font-family, accent-color (HSL channels "H S% L%"), border-radius, font-scale.
    fontFamily: "string",
    accentColor: "string",
    borderRadius: "string",
    fontScale: "string",
  },
}) as unknown as R2wcElementCtor;

class ScavengerChatElement extends BaseElement {
  connectedCallback() {
    // Adopt styles into the shadow root before super mounts React → no FOUC.
    if (this.shadowRoot) adoptStyles(this.shadowRoot);
    super.connectedCallback();
  }
}

if (
  typeof customElements !== "undefined" &&
  !customElements.get("scavenger-chat")
) {
  customElements.define(
    "scavenger-chat",
    ScavengerChatElement as unknown as CustomElementConstructor,
  );
}

export default ScavengerChatElement;

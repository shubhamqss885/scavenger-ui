"use client";

// WEB-COMPONENT ADAPTER — permanent policy: shim for `next-view-transitions`.
// The real package needs Next's AppRouterContext (provided by the Next app root),
// which doesn't exist inside a standalone custom element. Imported sidebar rows
// render `<Link href="/project/{id}/agent">`; here Link is a plain <a> whose click
// is intercepted and routed through WidgetRouterContext.navigate — switching the
// active project IN-element instead of navigating the host page's URL.
//
// Typed against the real package (type-only import) so the shim can't drift from
// its public API (`npm run web-component:typecheck`). Only `Link` is used by the
// imported presentational components today; `useTransitionRouter`/`ViewTransitions`
// are shimmed too so the alias is a faithful drop-in.

import React from "react";
import { useWidgetRouter } from "../router";

type Real = typeof import("next-view-transitions");

const hrefToString = (href: unknown): string =>
  typeof href === "string" ? href : "#";

export const Link: Real["Link"] = ({
  href,
  children,
  onClick,
  // Strip Next-Link-only props so they don't leak onto the <a>.
  prefetch: _prefetch,
  replace: _replace,
  scroll: _scroll,
  shallow: _shallow,
  locale: _locale,
  ...rest
}: any) => {
  const router = useWidgetRouter();
  const target = hrefToString(href);
  return (
    <a
      href={target}
      onClick={(e) => {
        // Preserve native new-tab / modifier behaviour; otherwise intercept.
        if (
          e.defaultPrevented ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey
        ) {
          return;
        }
        e.preventDefault();
        onClick?.(e);
        router.navigate(target);
      }}
      {...rest}
    >
      {children}
    </a>
  );
};

export const useTransitionRouter: Real["useTransitionRouter"] = () => {
  const router = useWidgetRouter();
  return {
    push: router.navigate,
    replace: router.navigate,
    back: () => {},
    forward: () => {},
    refresh: () => {},
    prefetch: () => {},
  } as ReturnType<Real["useTransitionRouter"]>;
};

export const ViewTransitions: Real["ViewTransitions"] = ({ children }) => (
  <>{children}</>
);

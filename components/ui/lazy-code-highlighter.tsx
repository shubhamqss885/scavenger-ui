"use client";

import { lazy, Suspense } from "react";
import type { CSSProperties } from "react";
import type { CodeHighlighterStyle } from "./lazy-code-highlighter.impl";

// Lazily loads react-syntax-highlighter (+ prism styles) so it stays out of the
// route's First Load JS. While the chunk loads, the raw code renders in a <pre>
// so there's no layout shift and the content is always readable. Consumers keep
// their exact styling — they pass a style *name* instead of the style object,
// which keeps the (large) style objects in the lazy chunk too.
const Impl = lazy(() => import("./lazy-code-highlighter.impl"));

export type LazyCodeHighlighterProps = Readonly<{
  children: string;
  styleName: CodeHighlighterStyle;
  language?: string;
  customStyle?: CSSProperties;
  codeTagProps?: { style?: CSSProperties };
  wrapLines?: boolean;
  wrapLongLines?: boolean;
  /** className applied to the plain-<pre> fallback shown while the chunk loads. */
  fallbackClassName?: string;
}>;

const LazyCodeHighlighter = ({
  fallbackClassName,
  ...props
}: LazyCodeHighlighterProps) => (
  <Suspense
    fallback={
      <pre
        className={fallbackClassName}
        style={{
          margin: 0,
          whiteSpace: "pre-wrap",
          fontFamily: "monospace",
          fontSize: "12px",
        }}
      >
        {props.children}
      </pre>
    }
  >
    <Impl {...props} />
  </Suspense>
);

export default LazyCodeHighlighter;

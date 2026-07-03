"use client";

// The heavy part: react-syntax-highlighter core + the prism style objects.
// This module is only ever reached via React.lazy in ./lazy-code-highlighter,
// so it lands in its own async chunk instead of the consuming route bundle.
import type { CSSProperties } from "react";
import { PrismAsync as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  coy,
  vscDarkPlus,
} from "react-syntax-highlighter/dist/esm/styles/prism";

const STYLES = { coy, vscDarkPlus } as const;

export type CodeHighlighterStyle = keyof typeof STYLES;

type ImplProps = Readonly<{
  children: string;
  styleName: CodeHighlighterStyle;
  language?: string;
  customStyle?: CSSProperties;
  codeTagProps?: { style?: CSSProperties };
  wrapLines?: boolean;
  wrapLongLines?: boolean;
}>;

const LazyCodeHighlighterImpl = ({
  children,
  styleName,
  ...rest
}: ImplProps) => (
  <SyntaxHighlighter style={STYLES[styleName]} {...rest}>
    {children}
  </SyntaxHighlighter>
);

export default LazyCodeHighlighterImpl;

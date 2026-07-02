// Vite `?inline` CSS imports return the compiled stylesheet as a string. The
// web-component typecheck (tsc) doesn't load `vite/client`, so declare it here so
// shadow-styles.ts's `import css from "...css?inline"` resolves to `string`.
declare module "*.css?inline" {
  const css: string;
  export default css;
}

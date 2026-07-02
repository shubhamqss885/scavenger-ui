const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export const resolveColor = (
  colors: readonly string[] | undefined,
  i: number,
  fallback: string,
): string => {
  const candidate = colors?.[i];
  return candidate && HEX_RE.test(candidate) ? candidate : fallback;
};

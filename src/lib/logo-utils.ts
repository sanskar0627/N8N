const BLACK_LOGOS = [
  "/logos/openai.svg",
  "/logos/anthropic.svg",
  "/logos/github.svg",
];

export function isBlackLogo(src: string): boolean {
  return BLACK_LOGOS.some((logo) => src.includes(logo));
}

export function getLogoClassName(src: string): string {
  return isBlackLogo(src) ? "dark:invert" : "";
}

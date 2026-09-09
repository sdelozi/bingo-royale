const THEME_KEYS = ["arcade-neon", "lake-bachelorette"] as const;

type ThemeKey = (typeof THEME_KEYS)[number];

type ThemeConfig = {
  key: ThemeKey;
  bannerText?: string;
  bannerImageUrl?: string;
  footerNote?: string;
};

function resolveThemeKey(rawValue: string | undefined): ThemeKey {
  if (!rawValue) {
    return "arcade-neon";
  }

  return THEME_KEYS.includes(rawValue as ThemeKey) ? (rawValue as ThemeKey) : "arcade-neon";
}

function getOptionalTrimmed(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : undefined;
}

export const themeConfig: ThemeConfig = {
  key: resolveThemeKey(process.env.NEXT_PUBLIC_THEME_KEY),
  bannerText: getOptionalTrimmed(process.env.NEXT_PUBLIC_THEME_BANNER_TEXT),
  bannerImageUrl: getOptionalTrimmed(process.env.NEXT_PUBLIC_THEME_BANNER_IMAGE_URL),
  footerNote: getOptionalTrimmed(process.env.NEXT_PUBLIC_THEME_FOOTER_NOTE)
};

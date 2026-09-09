import { env } from "@/server/config/env";

const THEME_KEYS = ["arcade-neon", "lake-blue"] as const;

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
  key: resolveThemeKey(env.themeKey),
  bannerText: getOptionalTrimmed(env.themeBannerText),
  bannerImageUrl: getOptionalTrimmed(env.themeBannerImageUrl),
  footerNote: getOptionalTrimmed(env.themeFooterNote)
};

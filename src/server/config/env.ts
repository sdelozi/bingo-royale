import { getOptionalBooleanEnv, getOptionalEnv, getRequiredEnv } from "@/server/config/env-helpers";

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  appUrl: getRequiredEnv("NEXT_PUBLIC_APP_URL"),
  databaseUrl: getRequiredEnv("DATABASE_URL"),
  authSecret: getRequiredEnv("AUTH_SECRET"),
  googleClientId: getOptionalEnv("GOOGLE_CLIENT_ID"),
  googleClientSecret: getOptionalEnv("GOOGLE_CLIENT_SECRET"),
  googleAllowDangerousEmailAccountLinking: getOptionalBooleanEnv("GOOGLE_ALLOW_DANGEROUS_EMAIL_ACCOUNT_LINKING"),
  credentialsPasswordPepper: getOptionalEnv("CREDENTIALS_PASSWORD_PEPPER"),
  enableFourCornersScoring: getOptionalBooleanEnv("NEXT_PUBLIC_ENABLE_FOUR_CORNERS_SCORING"),
  shareBaseUrl: getOptionalEnv("NEXT_PUBLIC_SHARE_BASE_URL"),
  themeKey: getOptionalEnv("NEXT_PUBLIC_THEME_KEY"),
  themeBannerText: getOptionalEnv("NEXT_PUBLIC_THEME_BANNER_TEXT"),
  themeBannerImageUrl: getOptionalEnv("NEXT_PUBLIC_THEME_BANNER_IMAGE_URL"),
  themeFooterNote: getOptionalEnv("NEXT_PUBLIC_THEME_FOOTER_NOTE")
};

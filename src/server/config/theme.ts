import { env } from "@/server/config/env";
import type { ResolvedThemeConfig, ThemeRouteMap } from "@/lib/theme-shell";

const THEME_KEYS = ["arcade-neon", "lake-blue", "kimberly"] as const;

type ThemeKey = (typeof THEME_KEYS)[number];

type ThemeDefinition = {
  fonts: ResolvedThemeConfig["fonts"];
  routes: ThemeRouteMap;
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

function normalizeAssetPath(value: string | undefined): string | undefined {
  const normalized = getOptionalTrimmed(value);

  if (!normalized) {
    return undefined;
  }

  if (normalized.startsWith("http://") || normalized.startsWith("https://") || normalized.startsWith("/")) {
    return normalized;
  }

  return `/${normalized.replace(/^\/+/, "")}`;
}

const themeDefinitions: Record<ThemeKey, ThemeDefinition> = {
  "arcade-neon": {
    fonts: {
      display: '"Impact", "Haettenschweiler", "Arial Narrow Bold", "Trebuchet MS", sans-serif',
      body: '"Trebuchet MS", "Segoe UI", "Avenir Next", sans-serif',
      accent: '"Bahnschrift", "Trebuchet MS", sans-serif'
    },
    routes: {
      public: {
        routeLabel: "Launch Lobby",
        headline: "Live Multiplayer Bingo",
        tagline: "Spin up a room, hand out cards, and keep every score in sync.",
        bannerText: "Phone-first by design so the round stays playable from anywhere.",
        bannerImageUrl: "/themes/arcade-neon/banner.svg",
        backgroundImageUrl: "/themes/arcade-neon/background.svg",
        footerImageUrl: "/themes/arcade-neon/footer.svg",
        footerNote: "Built for flexible multiplayer sessions.",
        primaryCtaVariant: "accent"
      },
      auth: {
        routeLabel: "Player Check-In",
        headline: "Join The Next Round",
        tagline: "Sign in fast, create an account, and jump back into active games.",
        bannerText: "Auth screens stay lightweight so phone sign-in does not feel like setup work.",
        bannerImageUrl: "/themes/arcade-neon/banner.svg",
        backgroundImageUrl: "/themes/arcade-neon/background.svg",
        footerImageUrl: "/themes/arcade-neon/footer.svg",
        footerNote: "Quick entry, persistent boards, and shared scoring.",
        primaryCtaVariant: "primary"
      },
      app: {
        routeLabel: "Player Hub",
        headline: "Live Multiplayer Bingo",
        tagline: "Real-time board updates and shared score tracking.",
        bannerText: "Keep the round moving with fast board updates and clear mobile controls.",
        bannerImageUrl: "/themes/arcade-neon/banner.svg",
        backgroundImageUrl: "/themes/arcade-neon/background.svg",
        footerImageUrl: "/themes/arcade-neon/footer.svg",
        footerNote: "Built for flexible multiplayer sessions.",
        primaryCtaVariant: "primary"
      }
    }
  },
  "lake-blue": {
    fonts: {
      display: '"Georgia", "Palatino Linotype", "Book Antiqua", serif',
      body: '"Avenir Next", "Segoe UI", "Trebuchet MS", sans-serif',
      accent: '"Verdana", "Trebuchet MS", sans-serif'
    },
    routes: {
      public: {
        routeLabel: "Welcome Aboard",
        headline: "Live Multiplayer Bingo",
        tagline: "A lighter shared shell ready for event-specific imagery and copy.",
        bannerText: "Use this preset as the calm base for event releases built off develop.",
        bannerImageUrl: "/themes/lake-blue/banner.svg",
        backgroundImageUrl: "/themes/lake-blue/background.svg",
        footerImageUrl: "/themes/lake-blue/footer.svg",
        footerNote: "Ready for polished event-themed releases.",
        primaryCtaVariant: "accent"
      },
      auth: {
        routeLabel: "Guest List",
        headline: "Join The Next Round",
        tagline: "Check in quickly, then head straight to your groups and board.",
        bannerText: "Event-specific auth copy can layer here later without touching component logic.",
        bannerImageUrl: "/themes/lake-blue/banner.svg",
        backgroundImageUrl: "/themes/lake-blue/background.svg",
        footerImageUrl: "/themes/lake-blue/footer.svg",
        footerNote: "Phone-first sign-in keeps event traffic moving.",
        primaryCtaVariant: "primary"
      },
      app: {
        routeLabel: "Round Tracker",
        headline: "Live Multiplayer Bingo",
        tagline: "Shared standings, board progress, and clean mobile pacing.",
        bannerText: "Swap themed assets here on the Kimberly branch without changing the game flow.",
        bannerImageUrl: "/themes/lake-blue/banner.svg",
        backgroundImageUrl: "/themes/lake-blue/background.svg",
        footerImageUrl: "/themes/lake-blue/footer.svg",
        footerNote: "Stable shared UX underneath event-only branding.",
        primaryCtaVariant: "primary"
      }
    }
  },
  kimberly: {
    fonts: {
      display: '"Georgia", "Palatino Linotype", "Book Antiqua", serif',
      body: '"Avenir Next", "Segoe UI", "Trebuchet MS", sans-serif',
      accent: '"Verdana", "Trebuchet MS", sans-serif'
    },
    routes: {
      public: {
        routeLabel: "Lake Weekend",
        headline: "Kimberly's Bachelorette Bingo",
        tagline: "A weekend on the water with some friendly competition!",
        bannerText: "Play along all weekend and become the Kimberly Bachelorette Bingo Champion.",
        bannerImageUrl: "/themes/kimberly/love-on-the-lake.jpg",
        backgroundImageUrl: "/themes/kimberly/love-on-the-lake.jpg",
        footerNote: "Lake of the Ozarks, 2026.",
        primaryCtaVariant: "accent"
      },
      auth: {
        routeLabel: "Weekend Check-In",
        headline: "Join Kimberly's Weekend",
        tagline: "Sign in, grab your card, and get some bingos!",
        bannerText: "Your board is waiting :D",
        bannerImageUrl: "/themes/kimberly/love-on-the-lake.jpg",
        backgroundImageUrl: "/themes/kimberly/love-on-the-lake.jpg",
        footerNote: "Lake of the Ozarks, 2026.",
        primaryCtaVariant: "accent"
      },
      app: {
        routeLabel: "Bachelorette Bingo",
        headline: "Kimberly's Lake Weekend",
        tagline: "Get any bingos lately? Keep it moving!",
        bannerText: "Don't forget to check the leaderboard :O",
        bannerImageUrl: "/themes/kimberly/love-on-the-lake.jpg",
        backgroundImageUrl: "/themes/kimberly/love-on-the-lake.jpg",
        footerNote: "Lake of the Ozarks, 2026.",
        primaryCtaVariant: "accent"
      }
    }
  }
};

const themeKey = resolveThemeKey(env.themeKey);
const selectedTheme = themeDefinitions[themeKey];

export const themeConfig: ResolvedThemeConfig = {
  key: themeKey,
  fonts: selectedTheme.fonts,
  bannerText: getOptionalTrimmed(env.themeBannerText),
  bannerImageUrl: normalizeAssetPath(env.themeBannerImageUrl),
  footerNote: getOptionalTrimmed(env.themeFooterNote),
  routes: selectedTheme.routes
};

export type ThemeRouteGroup = "public" | "auth" | "app";

export type ThemeCtaVariant = "primary" | "secondary" | "accent";

export type ThemeRoutePresentation = {
  routeLabel: string;
  headline: string;
  tagline: string;
  bannerText?: string;
  bannerImageUrl?: string;
  backgroundImageUrl?: string;
  footerImageUrl?: string;
  footerNote?: string;
  primaryCtaVariant?: ThemeCtaVariant;
};

export type ThemeRouteMap = Record<ThemeRouteGroup, ThemeRoutePresentation>;

export type ThemeFontTokens = {
  display: string;
  body: string;
  accent: string;
};

export type ResolvedThemeConfig = {
  key: string;
  fonts: ThemeFontTokens;
  bannerText?: string;
  bannerImageUrl?: string;
  footerNote?: string;
  routes: ThemeRouteMap;
};

export function resolveThemeRouteGroup(pathname: string): ThemeRouteGroup {
  if (pathname.startsWith("/auth")) {
    return "auth";
  }

  if (pathname === "/" || pathname.startsWith("/join")) {
    return "public";
  }

  return "app";
}

export function resolveThemeRoutePresentation(pathname: string, routes: ThemeRouteMap) {
  const routeGroup = resolveThemeRouteGroup(pathname);

  return {
    routeGroup,
    ...routes[routeGroup]
  };
}

export function getThemeCtaClassName(variant: ThemeCtaVariant = "primary") {
  if (variant === "secondary") {
    return "ui-link-button ui-link-button-secondary";
  }

  if (variant === "accent") {
    return "ui-link-button ui-link-button-accent";
  }

  return "ui-link-button";
}

import { describe, expect, it } from "vitest";
import {
  getThemeCtaClassName,
  resolveThemeRouteGroup,
  resolveThemeRoutePresentation,
  type ThemeRouteMap
} from "@/lib/theme-shell";

const routes: ThemeRouteMap = {
  public: {
    routeLabel: "Public",
    headline: "Public Headline",
    tagline: "Public tagline"
  },
  auth: {
    routeLabel: "Auth",
    headline: "Auth Headline",
    tagline: "Auth tagline",
    primaryCtaVariant: "accent"
  },
  app: {
    routeLabel: "App",
    headline: "App Headline",
    tagline: "App tagline"
  }
};

describe("theme shell helpers", () => {
  it("maps public and join routes to the public route group", () => {
    expect(resolveThemeRouteGroup("/")).toBe("public");
    expect(resolveThemeRouteGroup("/join/demo")).toBe("public");
  });

  it("maps auth routes to the auth route group", () => {
    expect(resolveThemeRouteGroup("/auth/signin")).toBe("auth");
  });

  it("maps remaining routes to the app route group", () => {
    expect(resolveThemeRouteGroup("/groups/123")).toBe("app");
  });

  it("returns the route presentation for the current pathname", () => {
    expect(resolveThemeRoutePresentation("/auth/register", routes)).toMatchObject({
      routeGroup: "auth",
      routeLabel: "Auth",
      headline: "Auth Headline"
    });
  });

  it("returns the expected CTA class names", () => {
    expect(getThemeCtaClassName()).toBe("ui-link-button");
    expect(getThemeCtaClassName("secondary")).toBe("ui-link-button ui-link-button-secondary");
    expect(getThemeCtaClassName("accent")).toBe("ui-link-button ui-link-button-accent");
  });
});

import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";
import { getToken } from "next-auth/jwt";

vi.mock("next-auth/jwt", () => ({
  getToken: vi.fn()
}));

describe("middleware", () => {
  it("redirects unauthenticated users from protected routes", async () => {
    vi.mocked(getToken).mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost/dashboard?tab=recent");
    const response = await middleware(request);
    const location = response.headers.get("location");

    expect(response.status).toBe(307);
    expect(location).toContain("/auth/signin");
    expect(location).toContain("error=auth_required");
    expect(location).toContain("callbackUrl=%2Fdashboard%3Ftab%3Drecent");
  });

  it("redirects authenticated users away from auth pages", async () => {
    vi.mocked(getToken).mockResolvedValueOnce({ sub: "user-1" } as never);

    const request = new NextRequest("http://localhost/auth/signin");
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("allows authenticated users to access protected routes", async () => {
    vi.mocked(getToken).mockResolvedValueOnce({ sub: "user-1" } as never);

    const request = new NextRequest("http://localhost/groups");
    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});

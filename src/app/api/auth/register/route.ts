import { NextResponse } from "next/server";
import { z } from "zod";
import { logError } from "@/server/observability/logger";
import { RateLimitExceededError, enforceRateLimit, rateLimitPolicies } from "@/server/rate-limit/request-rate-limit";
import { db } from "@/server/db/client";
import { hashPassword } from "@/server/auth/password";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().trim().min(1).max(80)
});

export async function POST(request: Request) {
  try {
    enforceRateLimit({
      scope: "auth-register",
      request,
      policy: rateLimitPolicies.authRegister
    });

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid registration details." }, { status: 400 });
    }

    const existingUser = await db.user.findUnique({
      where: { email: parsed.data.email }
    });

    if (existingUser) {
      return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
    }

    const passwordHash = await hashPassword(parsed.data.password);

    await db.user.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name,
        passwordHash
      }
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again shortly." },
        {
          status: 429,
          headers: {
            "Retry-After": String(error.retryAfterSeconds)
          }
        }
      );
    }

    logError("api.auth.register.unexpected_error", error, {
      route: "/api/auth/register",
      method: "POST"
    });

    return NextResponse.json({ error: "Registration is temporarily unavailable. Please try again shortly." }, { status: 503 });
  }
}
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db/client";
import { hashPassword } from "@/server/auth/password";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().trim().min(1).max(80)
});

export async function POST(request: Request) {
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
}
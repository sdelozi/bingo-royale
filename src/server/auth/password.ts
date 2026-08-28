import { compare, hash } from "bcryptjs";
import { env } from "@/server/config/env";

const PASSWORD_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return hash(withPepper(password), PASSWORD_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return compare(withPepper(password), passwordHash);
}

function withPepper(password: string): string {
  return `${password}${env.credentialsPasswordPepper ?? ""}`;
}
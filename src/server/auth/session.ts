import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth/config";

export function getAuthSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getAuthSession();

  return session?.user ?? null;
}
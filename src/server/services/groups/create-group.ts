import { randomBytes, randomInt } from "crypto";
import { MembershipRole, Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/server/db/client";

const createGroupSchema = z.object({
  name: z.string().trim().min(1).max(80)
});

const INVITE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const INVITE_CODE_LENGTH = 8;
const MAX_RETRY_ATTEMPTS = 8;

export type CreateGroupInput = z.infer<typeof createGroupSchema>;

export async function createGroupForUser(userId: string, rawInput: unknown) {
  const input = createGroupSchema.parse(rawInput);

  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt += 1) {
    const inviteCode = generateInviteCode();
    const shareToken = generateShareToken();

    try {
      const group = await db.group.create({
        data: {
          name: input.name,
          inviteCode,
          shareToken,
          creatorId: userId,
          memberships: {
            create: {
              userId,
              role: MembershipRole.ADMIN
            }
          }
        },
        select: {
          id: true,
          name: true,
          inviteCode: true,
          shareToken: true,
          createdAt: true
        }
      });

      return {
        ...group,
        role: MembershipRole.ADMIN
      };
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Unable to generate a unique invite code. Please try again.");
}

function generateInviteCode(): string {
  let code = "";

  for (let index = 0; index < INVITE_CODE_LENGTH; index += 1) {
    const randomIndex = randomInt(0, INVITE_CHARSET.length);
    code += INVITE_CHARSET[randomIndex];
  }

  return code;
}

function generateShareToken(): string {
  return randomBytes(16).toString("hex");
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

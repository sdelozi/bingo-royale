import { PrismaClient, MembershipRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // Seed is intentionally minimal and safe for repeated local runs.
  const adminEmail = "admin@example.com";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      displayName: "Trip Admin"
    }
  });

  const group = await prisma.group.upsert({
    where: { inviteCode: "DEMO25" },
    update: {},
    create: {
      name: "Demo Trip Group",
      inviteCode: "DEMO25",
      creatorId: admin.id
    }
  });

  await prisma.membership.upsert({
    where: {
      groupId_userId: {
        groupId: group.id,
        userId: admin.id
      }
    },
    update: {},
    create: {
      groupId: group.id,
      userId: admin.id,
      role: MembershipRole.ADMIN
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

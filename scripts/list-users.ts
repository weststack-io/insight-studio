import { prisma } from "../lib/db/client";

async function listUsers() {
  try {
    console.log("\n📋 Listing all users...\n");

    const users = await prisma.user.findMany({
      include: {
        tenant: {
          select: {
            name: true,
            domain: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (users.length === 0) {
      console.log("No users found in the database.\n");
      console.log("💡 Sign in to the application to create a user account.\n");
      return;
    }

    console.log(`Found ${users.length} user(s):\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Name: ${user.name || "N/A"}`);
      console.log(`   Role: ${user.role || "None"}`);
      console.log(
        `   Tenant: ${user.tenant?.name || "None"} (${
          user.tenant?.domain || "N/A"
        })`
      );
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
      console.log("");
    });

    console.log("💡 To set a user as advisor, run:");
    console.log("   npx tsx scripts/set-user-role.ts <email> advisor\n");
  } catch (error) {
    console.error("❌ Error listing users:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();

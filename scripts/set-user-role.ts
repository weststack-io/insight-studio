import { prisma } from "../lib/db/client";

async function setUserRole() {
  try {
    // Get command line arguments
    const userEmail = process.argv[2];
    const role = process.argv[3];

    if (!userEmail || !role) {
      console.error(
        "\n❌ Usage: npx tsx scripts/set-user-role.ts <user-email> <role>\n"
      );
      console.log("Valid roles: family_member, trustee, advisor");
      console.log("\nExample:");
      console.log(
        "  npx tsx scripts/set-user-role.ts user@example.com advisor\n"
      );
      process.exit(1);
    }

    // Validate role
    const validRoles = ["family_member", "trustee", "advisor"];
    if (!validRoles.includes(role)) {
      console.error(`\n❌ Invalid role: '${role}'\n`);
      console.log("Valid roles are:");
      validRoles.forEach((r) => console.log(`  - ${r}`));
      console.log("");
      process.exit(1);
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { tenant: true },
    });

    if (!user) {
      console.error(`\n❌ User with email '${userEmail}' not found.\n`);
      console.log(
        "💡 Make sure you've signed in at least once so the user account exists.\n"
      );
      process.exit(1);
    }

    console.log("\n📝 Updating user role...\n");
    console.log(`User: ${user.email}`);
    console.log(`Name: ${user.name || "N/A"}`);
    console.log(`Current Role: ${user.role || "None"}`);
    console.log(`New Role: ${role}`);
    console.log(`Tenant: ${user.tenant?.name || "None"}`);
    console.log("");

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { email: userEmail },
      data: { role },
      include: { tenant: true },
    });

    console.log("✅ Successfully updated user role!\n");
    console.log("Updated user details:");
    console.log(`  Email: ${updatedUser.email}`);
    console.log(`  Name: ${updatedUser.name || "N/A"}`);
    console.log(`  Role: ${updatedUser.role}`);
    console.log(`  Tenant: ${updatedUser.tenant?.name || "None"}`);
    console.log("");

    if (role === "advisor") {
      console.log("🎉 You are now an advisor!");
      console.log(
        "💡 Sign out and back in to see advisor features (like the Reviews page).\n"
      );
    } else {
      console.log("💡 Sign out and back in to see the updated role.\n");
    }
  } catch (error) {
    console.error("❌ Error updating user role:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setUserRole();

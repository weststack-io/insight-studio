import { prisma } from "../lib/db/client";

const E2E_USERS = [
  {
    email: "e2e-advisor@test.local",
    name: "E2E Advisor",
    role: "advisor",
    language: "en",
    generation: "GenX",
    sophisticationLevel: "advanced",
  },
  {
    email: "e2e-client@test.local",
    name: "E2E Client",
    role: "family_member",
    language: "en",
    generation: "Millennial",
    sophisticationLevel: "intermediate",
  },
];

async function seedE2EUsers() {
  console.log("Seeding E2E test users...\n");

  // Find or create a test tenant
  let tenant = await prisma.tenant.findFirst({
    where: { domain: "test.local" },
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: "E2E Test Tenant",
        applicationName: "Insight Studio",
        domain: "test.local",
      },
    });
    console.log(`Created tenant: ${tenant.name} (${tenant.id})`);
  } else {
    console.log(`Using existing tenant: ${tenant.name} (${tenant.id})`);
  }

  for (const userData of E2E_USERS) {
    // Use findFirst (case-insensitive on MSSQL) then update-or-create
    const existing = await prisma.user.findFirst({
      where: { email: { equals: userData.email } },
    });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { name: userData.name, role: userData.role, tenantId: tenant.id },
      });
      console.log(`  Updated: ${userData.email} (${existing.id}) role=${userData.role}`);
    } else {
      // MSSQL only allows one NULL in a unique column (azureAdId),
      // so we set a synthetic value to avoid the constraint.
      const user = await prisma.user.create({
        data: {
          ...userData,
          azureAdId: `e2e-${userData.email}`,
          tenantId: tenant.id,
          preferences: "{}",
        },
      });
      console.log(`  Created: ${userData.email} (${user.id}) role=${userData.role}`);
    }
  }

  console.log("\nDone. E2E users are ready.");
  await prisma.$disconnect();
}

seedE2EUsers().catch((err) => {
  console.error("Failed to seed E2E users:", err);
  process.exit(1);
});

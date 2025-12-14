import { PrismaClient } from "@prisma/client";
import { createMssqlAdapter } from "../lib/db/adapter";

const prisma = new PrismaClient({
  adapter: createMssqlAdapter(),
});

/**
 * Migration script to add applicationName field to Tenant model
 * Sets default value to 'Insight Studio' for all existing tenants
 */
async function migrateAddApplicationName() {
  try {
    console.log(
      "\n🔄 Starting migration: Add applicationName field to tenants...\n"
    );

    // Get all tenants
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        applicationName: true,
      },
    });

    console.log(`Found ${tenants.length} tenant(s) to update.\n`);

    // Update each tenant to set applicationName if not already set
    for (const tenant of tenants) {
      if (!tenant.applicationName) {
        console.log(`Updating tenant: ${tenant.name} (ID: ${tenant.id})`);
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            applicationName: "Insight Studio",
          },
        });
        console.log(`  ✅ Set applicationName to 'Insight Studio'\n`);
      } else {
        console.log(
          `Skipping tenant: ${tenant.name} (already has applicationName: ${tenant.applicationName})\n`
        );
      }
    }

    console.log("✅ Migration completed successfully!\n");
  } catch (error) {
    console.error("❌ Error during migration:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateAddApplicationName();

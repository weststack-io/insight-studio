import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateTenantName() {
  try {
    // Get command line arguments
    const tenantId = process.argv[2];
    const newName = process.argv[3] || 'Insight Studio';

    if (!tenantId) {
      // If no tenant ID provided, list all tenants and update the first one (or all if only one exists)
      const tenants = await prisma.tenant.findMany({
        select: {
          id: true,
          name: true,
          domain: true,
        },
      });

      if (tenants.length === 0) {
        console.error('\n❌ No tenants found in the database.\n');
        process.exit(1);
      }

      if (tenants.length === 1) {
        // Only one tenant, update it
        const tenant = tenants[0];
        console.log('\n📝 Updating tenant name...\n');
        console.log(`Current Name: ${tenant.name}`);
        console.log(`New Name: ${newName}`);
        console.log('');

        const updatedTenant = await prisma.tenant.update({
          where: { id: tenant.id },
          data: { name: newName },
        });

        console.log('✅ Successfully updated tenant name!\n');
        console.log('Updated tenant details:');
        console.log(`  ID: ${updatedTenant.id}`);
        console.log(`  Name: ${updatedTenant.name}`);
        console.log(`  Domain: ${updatedTenant.domain || 'N/A'}\n`);
      } else {
        // Multiple tenants, show them and require ID
        console.log('\n📋 Multiple tenants found. Please specify which tenant to update:\n');
        tenants.forEach((tenant, index) => {
          console.log(`${index + 1}. ${tenant.name} (ID: ${tenant.id})`);
        });
        console.log('\nUsage: npx tsx scripts/update-tenant-name.ts <tenant-id> [new-name]');
        console.log('Example: npx tsx scripts/update-tenant-name.ts abc-123-def "Insight Studio"\n');
      }
    } else {
      // Tenant ID provided, update that specific tenant
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        console.error(`\n❌ Tenant with ID '${tenantId}' not found.\n`);
        console.log('Run this command to see available tenants:');
        console.log('  npx tsx scripts/list-tenants.ts\n');
        process.exit(1);
      }

      console.log('\n📝 Updating tenant name...\n');
      console.log(`Current Name: ${tenant.name}`);
      console.log(`New Name: ${newName}`);
      console.log('');

      const updatedTenant = await prisma.tenant.update({
        where: { id: tenantId },
        data: { name: newName },
      });

      console.log('✅ Successfully updated tenant name!\n');
      console.log('Updated tenant details:');
      console.log(`  ID: ${updatedTenant.id}`);
      console.log(`  Name: ${updatedTenant.name}`);
      console.log(`  Domain: ${updatedTenant.domain || 'N/A'}\n`);
    }
  } catch (error) {
    console.error('❌ Error updating tenant name:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateTenantName();






import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateUserTenant() {
  try {
    // Get command line arguments
    const userEmail = process.argv[2];
    const tenantId = process.argv[3];

    if (!userEmail || !tenantId) {
      console.error('\n❌ Usage: npx tsx scripts/update-user-tenant.ts <user-email> <tenant-id>\n');
      console.log('Example:');
      console.log('  npx tsx scripts/update-user-tenant.ts user@example.com abc-123-def\n');
      process.exit(1);
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { tenant: true },
    });

    if (!user) {
      console.error(`\n❌ User with email '${userEmail}' not found.\n`);
      process.exit(1);
    }

    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      console.error(`\n❌ Tenant with ID '${tenantId}' not found.\n`);
      console.log('Run this command to see available tenants:');
      console.log('  npx tsx scripts/list-tenants.ts\n');
      process.exit(1);
    }

    console.log('\n📝 Updating user tenant...\n');
    console.log(`User: ${user.email}`);
    console.log(`Current Tenant: ${user.tenant?.name || 'None'} (${user.tenantId || 'N/A'})`);
    console.log(`New Tenant: ${tenant.name} (${tenant.id})`);
    console.log('');

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { email: userEmail },
      data: { tenantId: tenantId },
      include: { tenant: true },
    });

    console.log('✅ Successfully updated user tenant!\n');
    console.log('Updated user details:');
    console.log(`  Email: ${updatedUser.email}`);
    console.log(`  Tenant: ${updatedUser.tenant?.name}`);
    console.log(`  Theme Colors: ${updatedUser.tenant?.primaryColor} / ${updatedUser.tenant?.secondaryColor}`);
    console.log('\n💡 Sign out and back in to see the new theme!\n');
  } catch (error) {
    console.error('❌ Error updating user tenant:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateUserTenant();


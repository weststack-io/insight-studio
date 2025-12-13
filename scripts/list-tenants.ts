import { PrismaClient } from '@prisma/client';
import { createMssqlAdapter } from '../lib/db/adapter';

const prisma = new PrismaClient({
  adapter: createMssqlAdapter(),
});

async function listTenants() {
  try {
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        domain: true,
        primaryColor: true,
        secondaryColor: true,
        fontFamily: true,
        logoUrl: true,
      },
    });

    console.log('\n📋 Available Tenants:\n');
    
    if (tenants.length === 0) {
      console.log('No tenants found in the database.');
      console.log('\nTo create the West Stack Advisors theme, run:');
      console.log('  npm run theme:add-weststack\n');
      return;
    }

    tenants.forEach((tenant, index) => {
      console.log(`${index + 1}. ${tenant.name}`);
      console.log(`   ID: ${tenant.id}`);
      console.log(`   Domain: ${tenant.domain || 'N/A'}`);
      console.log(`   Primary Color: ${tenant.primaryColor}`);
      console.log(`   Secondary Color: ${tenant.secondaryColor}`);
      console.log(`   Font: ${tenant.fontFamily || 'Default'}`);
      console.log(`   Logo: ${tenant.logoUrl || 'None'}`);
      console.log('');
    });

    console.log(`\nTotal: ${tenants.length} tenant(s)\n`);
  } catch (error) {
    console.error('❌ Error listing tenants:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

listTenants();


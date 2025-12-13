import { PrismaClient } from '@prisma/client';
import { createMssqlAdapter } from '../lib/db/adapter';

const prisma = new PrismaClient({
  adapter: createMssqlAdapter(),
});

async function addWestStackTheme() {
  try {
    // Check if tenant already exists
    const existingTenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { name: 'West Stack Advisors' },
          { domain: 'weststackadvisors.com' },
        ],
      },
    });

    if (existingTenant) {
      console.log('West Stack Advisors theme already exists!');
      console.log('Existing tenant:', existingTenant);
      return;
    }

    // Create the West Stack Advisors tenant with modern, strong, reliable branding
    const tenant = await prisma.tenant.create({
      data: {
        name: 'West Stack Advisors',
        domain: 'weststackadvisors.com',
        primaryColor: '#1E3A5F', // Deep navy blue - conveys strength and reliability
        secondaryColor: '#4A90E2', // Modern slate blue - professional and modern
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif', // Modern, professional font
        // logoUrl can be added later when logo is available
      },
    });

    console.log('✅ Successfully created West Stack Advisors theme!');
    console.log('Tenant details:', {
      id: tenant.id,
      name: tenant.name,
      domain: tenant.domain,
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      fontFamily: tenant.fontFamily,
    });
  } catch (error) {
    console.error('❌ Error creating theme:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addWestStackTheme();


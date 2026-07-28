import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed for test roles...');

  const defaultPassword = await bcrypt.hash('password123', 10);

  const usersToSeed = [
    {
      name: 'System Admin',
      email: 'admin@company.com',
      password: defaultPassword,
      role: Role.ADMIN,
    },
    {
      name: 'Sales Executive',
      email: 'sales@company.com',
      password: defaultPassword,
      role: Role.SALES,
    },
    {
      name: 'Warehouse Manager',
      email: 'warehouse@company.com',
      password: defaultPassword,
      role: Role.WAREHOUSE,
    },
    {
      name: 'Accounts Specialist',
      email: 'accounts@company.com',
      password: defaultPassword,
      role: Role.ACCOUNTS,
    },
  ];

  for (const u of usersToSeed) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { password: u.password, role: u.role, name: u.name },
      create: u,
    });
    console.log(`✅ Seeded user: ${user.name} (${user.email}) - Role: ${user.role}`);
  }

  console.log('✨ Database seeding complete successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

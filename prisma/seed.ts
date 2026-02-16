import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Hash password
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'System Admin',
      phone: '+1234567890',
      role: UserRole.ADMIN,
      is_active: true,
    },
  });

  console.log('✅ Admin user created:', admin.email);
  console.log('📧 Email: admin@example.com');
  console.log('🔑 Password: Admin@123');
}

main()
  .then(async () => {
    console.log('✨ Seeding completed successfully');
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

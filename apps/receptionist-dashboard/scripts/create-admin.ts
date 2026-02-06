import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating admin user...');

  const hashedPassword = await bcrypt.hash('admin123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@globalfit.com.mx' },
    update: {
      hashedPassword,
      fullName: 'Admin',
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      email: 'admin@globalfit.com.mx',
      hashedPassword,
      fullName: 'Admin',
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('Admin user created/updated:', admin.email);
  console.log('Password: admin123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

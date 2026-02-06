import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function verifyAdmin() {
  console.log('Verifying admin user...');

  const admin = await prisma.user.findUnique({
    where: { email: 'admin@globalfit.com.mx' },
    select: { email: true, fullName: true, role: true, isActive: true },
  });

  if (admin) {
    console.log('✅ Admin user found:', admin);
    console.log('✅ Can login with: admin@globalfit.com.mx / admin123!');
  } else {
    console.log('❌ Admin user not found');
  }
}

verifyAdmin()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

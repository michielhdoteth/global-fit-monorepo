import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Checking/creating super user...');

  const hashedPassword = await bcrypt.hash('password', 10);

  const superUser = await prisma.user.upsert({
    where: { email: 'admin@globalfit.com.mx' },
    update: { 
      hashedPassword,
      fullName: 'Super Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
    create: {
      email: 'admin@globalfit.com.mx',
      hashedPassword,
      fullName: 'Super Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Super user:', superUser.email);
  console.log('🔑 Password: password (hashed)');
  
  // Verify the password
  const user = await prisma.user.findUnique({ where: { email: 'admin@globalfit.com.mx' }});
  if (user) {
    const valid = await bcrypt.compare('password', user.hashedPassword);
    console.log('✅ Password valid:', valid);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

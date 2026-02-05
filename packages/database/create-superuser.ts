import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Creating super user in correct database...');

  const email = 'admin@globalfit.com.mx';
  const password = 'password';

  const hashedPassword = await bcrypt.hash(password, 10);

  const superUser = await prisma.user.upsert({
    where: { email },
    update: { 
      hashedPassword,
      fullName: 'Super Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
    create: {
      email,
      hashedPassword,
      fullName: 'Super Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Super user:', superUser.email);
  console.log('✅ Role:', superUser.role);
  console.log('✅ isActive:', superUser.isActive);
  
  // Verify password
  const user = await prisma.user.findUnique({ where: { email }});
  const valid = await bcrypt.compare(password, user!.hashedPassword);
  console.log('✅ Password valid:', valid);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

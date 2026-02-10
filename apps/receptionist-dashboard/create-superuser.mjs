import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@globalfit.com.mx';
  const plainPassword = 'Admin123!@#';
  const fullName = 'Super Admin';

  const hashedPassword = await bcrypt.hash(plainPassword, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      hashedPassword,
      fullName,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
    create: {
      email,
      hashedPassword,
      fullName,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log('Superuser created:', {
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    password: plainPassword,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

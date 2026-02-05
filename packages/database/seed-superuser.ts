import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Creating super user...');

  const superUser = await prisma.user.upsert({
    where: { email: 'admin@globalfit.com.mx' },
    update: {},
    create: {
      email: 'admin@globalfit.com.mx',
      hashedPassword: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
      fullName: 'Super Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Super user created/updated:', superUser.email);
  console.log('🔑 Password: password');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

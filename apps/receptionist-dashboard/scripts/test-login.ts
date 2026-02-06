import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testLogin() {
  console.log('Testing admin login...');
  
  const user = await prisma.user.findUnique({
    where: { email: 'admin@globalfit.com.mx' }
  });

  if (!user) {
    console.log('❌ User not found');
    return;
  }

  console.log('✅ User found:', user.email);
  console.log('Role:', user.role);
  console.log('Active:', user.isActive);

  const valid = await bcrypt.compare('admin123!', user.hashedPassword);
  console.log('✅ Password valid:', valid);

  if (!valid) {
    console.log('🔐 Resetting password...');
    const newHash = await bcrypt.hash('admin123!', 12);
    await prisma.user.update({
      where: { email: 'admin@globalfit.com.mx' },
      data: { hashedPassword: newHash }
    });
    console.log('✅ Password reset');
  }
}

testLogin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

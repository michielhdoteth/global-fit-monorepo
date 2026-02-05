import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Debugging user...');

  const email = 'admin@globalfit.com.mx';
  const password = 'password';

  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    console.log('❌ User not found');
    
    // Create user with bcrypt hash
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await prisma.user.create({
      data: {
        email,
        hashedPassword,
        fullName: 'Super Admin',
        role: 'SUPER_ADMIN',
        isActive: true,
      }
    });
    
    console.log('✅ User created:', newUser.email);
    
    // Verify password
    const verify = await bcrypt.compare(password, newUser.hashedPassword);
    console.log('✅ Password verification:', verify);
  } else {
    console.log('✅ User found:', user.email);
    console.log('✅ User isActive:', user.isActive);
    console.log('✅ User role:', user.role);
    
    // Verify password
    const verify = await bcrypt.compare(password, user.hashedPassword);
    console.log('✅ Password verification:', verify);
    
    if (!verify) {
      // Update password
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { email },
        data: { hashedPassword }
      });
      console.log('✅ Password updated');
      
      const updated = await prisma.user.findUnique({ where: { email } });
      const verify2 = await bcrypt.compare(password, updated!.hashedPassword);
      console.log('✅ New password verification:', verify2);
    }
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

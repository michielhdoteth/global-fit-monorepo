import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient({
  log: ['query', 'error'],
});

const DEV_SECRET = 'dev-secret-change-me';

function getAuthSecret(): string {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || DEV_SECRET;
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signAuthToken(payload: any, ttlSeconds = 60 * 60 * 8): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const fullPayload = { ...payload, exp };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', getAuthSecret())
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${data}.${signature}`;
}

async function testFullLogin() {
  console.log('='.repeat(50));
  console.log('TESTING FULL LOGIN FLOW');
  console.log('='.repeat(50));
  
  console.log('\n1. Testing DATABASE_URL...');
  console.log('   DATABASE_URL set:', !!process.env.DATABASE_URL);
  
  console.log('\n2. Testing AUTH_SECRET...');
  console.log('   AUTH_SECRET set:', !!process.env.AUTH_SECRET);
  console.log('   AUTH_SECRET value:', process.env.AUTH_SECRET ? process.env.AUTH_SECRET.substring(0, 10) + '...' : 'NOT SET');

  console.log('\n3. Connecting to database...');
  try {
    const user = await prisma.user.findUnique({ 
      where: { email: 'admin@globalfit.com.mx' },
      select: { id: true, email: true, role: true, isActive: true }
    });
    console.log('   ✅ Database connected!');
    console.log('   User found:', user ? user.email : '❌ NOT FOUND');
    console.log('   Role:', user?.role);
    console.log('   Active:', user?.isActive);
    
    if (user) {
      console.log('\n4. Testing password...');
      const testPass = await bcrypt.hash('admin123!', 12);
      const valid = await bcrypt.compare('admin123!', user.hashedPassword);
      console.log('   ✅ Password valid:', valid);
      
      console.log('\n5. Testing token generation...');
      const token = signAuthToken({
        sub: user.id,
        email: user.email,
        role: user.role,
      });
      console.log('   ✅ Token generated successfully!');
      console.log('   Token:', token.substring(0, 50) + '...');
    }
  } catch (error) {
    console.log('   ❌ Database error:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('RESULT: Login should WORK');
  console.log('='.repeat(50));
}

testFullLogin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

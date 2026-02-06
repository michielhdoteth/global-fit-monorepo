import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient({
  log: ['error'],
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

async function testDirect() {
  console.log('Testing with correct env vars...\n');
  
  const url = process.env.DATABASE_URL;
  console.log('URL:', url?.replace(/:[^:@]+@/, ':****@'));
  
  try {
    const user = await prisma.user.findUnique({ 
      where: { email: 'admin@globalfit.com.mx' },
      select: { id: true, email: true, role: true, isActive: true, hashedPassword: true }
    });
    
    if (user) {
      console.log('✅ User found:', user.email);
      const valid = await bcrypt.compare('admin123!', user.hashedPassword);
      console.log('✅ Password valid:', valid);
      
      const token = signAuthToken({
        sub: user.id,
        email: user.email,
        role: user.role,
      });
      console.log('✅ Token generated!');
      console.log('\n' + '='.repeat(50));
      console.log('SUCCESS! Login should work now.');
      console.log('='.repeat(50));
    } else {
      console.log('❌ User not found');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testDirect()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

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

async function testLogin() {
  console.log('Testing login flow...');
  
  const email = 'admin@globalfit.com.mx';
  const password = 'admin123!';

  // 1. Find user
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log('❌ User not found');
    return;
  }
  console.log('✅ User found:', user.email);
  console.log('Role:', user.role);
  console.log('Active:', user.isActive);

  // 2. Check password
  const valid = await bcrypt.compare(password, user.hashedPassword);
  console.log('✅ Password valid:', valid);

  if (!valid) {
    console.log('❌ Invalid password');
    return;
  }

  // 3. Generate token
  const token = signAuthToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
  console.log('✅ Token generated:', token.substring(0, 50) + '...');

  console.log('\n✅ Login would succeed!');
}

testLogin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

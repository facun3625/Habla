import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? 'dev-secret-change-me-in-production'
);

const COOKIE = 'hp_token';
const EXPIRES = '7d';

export { COOKIE };

export async function signToken(payload: { userId: number; email: string; name?: string | null }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRES)
    .sign(secret);
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload as { userId: number; email: string; name?: string };
}

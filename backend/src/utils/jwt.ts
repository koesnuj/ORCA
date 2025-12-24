import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  status: string;
}

function resolveJwtSecret(): string {
  if (JWT_SECRET && JWT_SECRET.trim().length > 0) return JWT_SECRET;

  // Fail fast in production; allowing a default secret is a critical security risk.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }

  // Dev/test fallback only.
  return 'dev-insecure-jwt-secret';
}

/**
 * JWT 토큰 생성
 */
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, resolveJwtSecret(), {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

/**
 * JWT 토큰 검증
 */
export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, resolveJwtSecret()) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}


import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

// Request 객체 확장
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    status: string;
  };
}

/**
 * JWT 검증 미들웨어
 * Authorization: Bearer <token> 형식의 헤더를 검증
 */
export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ 
      success: false, 
      message: '인증 토큰이 필요합니다.' 
    });
    return;
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: '유효하지 않거나 만료된 토큰입니다.' 
    });
  }
}


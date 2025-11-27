import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

/**
 * 관리자 권한 체크 미들웨어
 * role이 ADMIN인지 확인
 */
export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ 
      success: false, 
      message: '인증이 필요합니다.' 
    });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ 
      success: false, 
      message: '관리자 권한이 필요합니다.' 
    });
    return;
  }

  next();
}

/**
 * 활성 상태 체크 미들웨어
 * status가 ACTIVE인지 확인
 */
export function requireActive(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ 
      success: false, 
      message: '인증이 필요합니다.' 
    });
    return;
  }

  if (req.user.status !== 'ACTIVE') {
    res.status(403).json({ 
      success: false, 
      message: '승인된 계정만 접근할 수 있습니다.' 
    });
    return;
  }

  next();
}


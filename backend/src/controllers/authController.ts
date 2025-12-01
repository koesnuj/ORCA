import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';

/**
 * 회원가입
 * POST /api/auth/register
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({
        success: false,
        message: '이메일, 비밀번호, 이름은 필수 항목입니다.',
      });
      return;
    }

    // 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: '이미 등록된 이메일입니다.',
      });
      return;
    }

    // 비밀번호 해시화
    const hashedPassword = await hashPassword(password);

    // 첫 번째 사용자는 자동으로 ADMIN & ACTIVE
    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: isFirstUser ? 'ADMIN' : 'USER',
        status: isFirstUser ? 'ACTIVE' : 'PENDING',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: isFirstUser
        ? '관리자 계정이 생성되었습니다.'
        : '회원가입이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.',
      user,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: '회원가입 중 오류가 발생했습니다.',
    });
  }
}

/**
 * 로그인
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: '이메일과 비밀번호를 입력해주세요.',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
      return;
    }

    // 비밀번호 확인
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
      return;
    }

    // 상태 확인
    if (user.status !== 'ACTIVE') {
      res.status(403).json({
        success: false,
        message:
          user.status === 'PENDING'
            ? '관리자의 승인을 기다리고 있습니다.'
            : '계정이 비활성화되었습니다.',
      });
      return;
    }

    // JWT 토큰 생성
    const accessToken = generateToken({ 
      userId: user.id, 
      email: user.email, 
      name: user.name,
      role: user.role, 
      status: user.status 
    });

    res.json({
      success: true,
      message: '로그인 성공',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: '로그인 중 오류가 발생했습니다.',
    });
  }
}

/**
 * 내 정보 조회
 * GET /api/auth/me
 */
export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.',
      });
      return;
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: '사용자 정보 조회 중 오류가 발생했습니다.',
    });
  }
}

/**
 * 프로필 업데이트
 * PATCH /api/auth/profile
 */
export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    const { name } = req.body;

    if (!name) {
      res.status(400).json({
        success: false,
        message: '이름은 필수 항목입니다.',
      });
      return;
    }

    // 현재 사용자 정보 조회 (이전 이름 확인용)
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
      return;
    }

    // 트랜잭션으로 처리 (사용자 이름 변경 + PlanItem assignee 변경)
    const updatedUser = await prisma.$transaction(async (tx) => {
      // 1. 사용자 이름 업데이트
      const user = await tx.user.update({
        where: { id: userId },
        data: { name },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // 2. 기존 이름으로 할당된 PlanItem 업데이트
      if (currentUser.name !== name) {
        await tx.planItem.updateMany({
          where: { assignee: currentUser.name },
          data: { assignee: name }
        });
      }

      return user;
    });

    res.json({
      success: true,
      message: '프로필이 업데이트되었습니다.',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: '프로필 업데이트 중 오류가 발생했습니다.',
    });
  }
}

/**
 * 비밀번호 변경
 * POST /api/auth/change-password
 */
export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: '현재 비밀번호와 새 비밀번호는 필수 항목입니다.',
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: '새 비밀번호는 최소 6자 이상이어야 합니다.',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.',
      });
      return;
    }

    // 현재 비밀번호 확인
    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: '현재 비밀번호가 올바르지 않습니다.',
      });
      return;
    }

    // 새 비밀번호 해시화
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({
      success: true,
      message: '비밀번호가 변경되었습니다.',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: '비밀번호 변경 중 오류가 발생했습니다.',
    });
  }
}

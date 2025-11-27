import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';

/**
 * 회원가입 컨트롤러
 * POST /api/auth/signup
 */
export async function signup(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name } = req.body;

    // 필수 필드 검증
    if (!email || !password || !name) {
      res.status(400).json({
        success: false,
        message: '이메일, 비밀번호, 이름은 필수 항목입니다.',
      });
      return;
    }

    // 이메일 중복 체크
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: '이미 사용 중인 이메일입니다.',
      });
      return;
    }

    // 비밀번호 해시화
    const hashedPassword = await hashPassword(password);

    // 첫 번째 사용자는 자동으로 ADMIN & ACTIVE 처리
    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    // 새 사용자 생성
    const newUser = await prisma.user.create({
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
        ? '관리자 계정이 생성되었습니다. 로그인해 주세요.' 
        : '회원가입이 완료되었습니다. 관리자 승인을 기다려 주세요.',
      user: newUser,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: '회원가입 중 오류가 발생했습니다.',
    });
  }
}

/**
 * 로그인 컨트롤러
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    // 필수 필드 검증
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: '이메일과 비밀번호를 입력해 주세요.',
      });
      return;
    }

    // 사용자 조회
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

    // 비밀번호 검증
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
      return;
    }

    // 상태 체크 (ACTIVE만 로그인 가능)
    if (user.status !== 'ACTIVE') {
      let message = '로그인할 수 없는 계정입니다.';
      if (user.status === 'PENDING') {
        message = '관리자 승인 대기 중입니다.';
      } else if (user.status === 'REJECTED') {
        message = '승인이 거절된 계정입니다.';
      }

      res.status(403).json({
        success: false,
        message,
      });
      return;
    }

    // JWT 토큰 생성
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    });

    res.status(200).json({
      success: true,
      accessToken: token,
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
 * 현재 사용자 정보 조회
 * GET /api/auth/me
 */
export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  try {
    // @ts-ignore - authenticateToken 미들웨어에서 설정됨
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: '인증이 필요합니다.',
      });
      return;
    }

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

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: '사용자 정보 조회 중 오류가 발생했습니다.',
    });
  }
}


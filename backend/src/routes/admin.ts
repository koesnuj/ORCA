import { Router } from 'express';
import {
  getPendingUsers,
  getAllUsers,
  approveUser,
  updateUserRole,
  resetPassword,
} from '../controllers/adminController';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleCheck';

const router = Router();

// 모든 admin 라우트는 인증 + 관리자 권한 필요
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/pending-users
 * @desc    가입 대기 중인 사용자 목록 조회
 * @access  Private (Admin only)
 */
router.get('/pending-users', getPendingUsers);

/**
 * @route   GET /api/admin/users
 * @desc    모든 사용자 목록 조회
 * @access  Private (Admin only)
 */
router.get('/users', getAllUsers);

/**
 * @route   PATCH /api/admin/users/approve
 * @desc    사용자 승인/거절
 * @access  Private (Admin only)
 */
router.patch('/users/approve', approveUser);

/**
 * @route   PATCH /api/admin/users/role
 * @desc    사용자 역할 변경
 * @access  Private (Admin only)
 */
router.patch('/users/role', updateUserRole);

/**
 * @route   POST /api/admin/users/reset-password
 * @desc    사용자 비밀번호 초기화
 * @access  Private (Admin only)
 */
router.post('/users/reset-password', resetPassword);

export default router;


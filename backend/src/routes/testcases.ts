import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth';
import { createTestCase, getTestCases, importTestCases, updateTestCase, deleteTestCase, reorderTestCases, bulkUpdateTestCases, bulkDeleteTestCases, moveTestCasesToFolder } from '../controllers/testcaseController';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.get('/', authenticateToken, getTestCases);
router.post('/', authenticateToken, createTestCase);
router.post('/reorder', authenticateToken, reorderTestCases);
router.post('/move', authenticateToken, moveTestCasesToFolder);
router.patch('/bulk', authenticateToken, bulkUpdateTestCases);
router.delete('/bulk', authenticateToken, bulkDeleteTestCases);
router.patch('/:id', authenticateToken, updateTestCase);
router.delete('/:id', authenticateToken, deleteTestCase);
router.post('/import', authenticateToken, upload.single('file'), importTestCases);

export default router;


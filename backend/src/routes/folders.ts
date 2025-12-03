import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { createFolder, getFolderTree, getTestCasesByFolder, moveFolder, reorderFolders, renameFolder } from '../controllers/folderController';

const router = express.Router();

router.get('/tree', authenticateToken, getFolderTree);
router.post('/', authenticateToken, createFolder);
router.patch('/reorder', authenticateToken, reorderFolders);
router.patch('/:id/move', authenticateToken, moveFolder);
router.patch('/:id/rename', authenticateToken, renameFolder);
router.get('/:folderId/testcases', authenticateToken, getTestCasesByFolder);

export default router;


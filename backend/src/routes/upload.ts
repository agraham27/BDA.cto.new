import { Router } from 'express';
import {
  deleteFile,
  getFileById,
  initializeStorage,
  listFiles,
  uploadFile,
  uploadMultipleFiles,
} from '@/controllers/uploadController';
import { authenticate, authorizeRoles } from '@/middleware/auth';
import { createUploadMiddleware } from '@/middleware/upload';

const router = Router();

router.post('/initialize', authenticate, authorizeRoles('ADMIN'), initializeStorage);

router.post('/', authenticate, createUploadMiddleware('file', false), uploadFile);

router.post('/multiple', authenticate, createUploadMiddleware('files', true), uploadMultipleFiles);

router.get('/', authenticate, listFiles);

router.get('/:id', authenticate, getFileById);

router.delete('/:id', authenticate, deleteFile);

export default router;

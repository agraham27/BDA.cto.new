import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { convertToHLS, downloadFile, getHLSManifest, getVideoMetadata, streamFile } from '@/controllers/streamController';

const router = Router();

router.get('/video/:id', streamFile);
router.get('/video/:id/metadata', authenticate, getVideoMetadata);
router.get('/video/:id/hls', authenticate, getHLSManifest);
router.post('/video/:id/hls', authenticate, convertToHLS);
router.get('/download/:id', downloadFile);

export default router;

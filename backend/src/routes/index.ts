import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import authRoutes from '@/routes/auth';
import profileRoutes from '@/routes/profile';
import adminRoutes from '@/routes/admin';
import studentRoutes from '@/routes/student';
import uploadRoutes from '@/routes/upload';
import streamRoutes from '@/routes/stream';
import publicRoutes from '@/routes/public';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

router.get('/api/health', (_req, res) => {
  res.status(StatusCodes.OK).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

router.use('/api/auth', authRoutes);
router.use('/api/profile', profileRoutes);
router.use('/api/admin', adminRoutes);
router.use('/api/student', studentRoutes);
router.use('/api/uploads', uploadRoutes);
router.use('/api/stream', streamRoutes);
router.use('/api/public', publicRoutes);

export default router;

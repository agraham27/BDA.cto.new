import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import authRoutes from '@/routes/auth';
import profileRoutes from '@/routes/profile';

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

export default router;

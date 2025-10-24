import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';

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

export default router;

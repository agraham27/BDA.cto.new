import app from './app';
import { ENV } from '@/config/env';
import { errorHandler } from '@/middleware/errorHandler';
import { notFoundHandler } from '@/middleware/notFound';
import { connectPrisma, disconnectPrisma } from '@/lib/prisma';
import { ensureUploadDirectories } from '@/utils/fileStorage';
import { logger } from '@/utils/logger';

app.use(notFoundHandler);
app.use(errorHandler);

void (async () => {
  try {
    await connectPrisma();
    await ensureUploadDirectories();
    logger.info('Upload directories initialized');
  } catch (error) {
    logger.error('Unable to establish database connection or initialize storage at startup', error);
    process.exit(1);
  }
})();

const server = app.listen(ENV.port, ENV.host, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║   🚀 Server Started Successfully!     ║
  ╠════════════════════════════════════════╣
  ║   Environment: ${ENV.nodeEnv.padEnd(24)}║
  ║   Host: ${ENV.host.padEnd(31)}║
  ║   Port: ${String(ENV.port).padEnd(31)}║
  ║   URL: http://${ENV.host}:${ENV.port}${' '.repeat(13)}║
  ╚════════════════════════════════════════╝
  `);
});

const gracefulShutdown = (signal: NodeJS.Signals) => {
  logger.info(`${signal} signal received: closing HTTP server`);
  server.close(() => {
    logger.info('HTTP server closed');
    disconnectPrisma()
      .then(() => {
        logger.info('Prisma client disconnected');
        process.exit(0);
      })
      .catch((error) => {
        logger.error('Error disconnecting Prisma client', error);
        process.exit(1);
      });
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default server;

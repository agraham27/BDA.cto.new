import app from './app';
import { ENV } from '@/config/env';
import { errorHandler } from '@/middleware/errorHandler';
import { notFoundHandler } from '@/middleware/notFound';

app.use(notFoundHandler);
app.use(errorHandler);

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

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default server;

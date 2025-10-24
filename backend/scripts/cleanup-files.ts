import { runScheduledCleanup } from '../src/utils/fileCleanup';

runScheduledCleanup()
  .then((result) => {
    console.log('File cleanup completed:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('File cleanup failed:', error);
    process.exit(1);
  });

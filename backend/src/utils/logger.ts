type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const levelPriority: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const CURRENT_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

function shouldLog(level: LogLevel) {
  return levelPriority[level] <= levelPriority[CURRENT_LEVEL];
}

export const logger = {
  error(message: string, ...meta: unknown[]) {
    if (shouldLog('error')) {
      console.error(`[ERROR] ${message}`, ...meta);
    }
  },
  warn(message: string, ...meta: unknown[]) {
    if (shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...meta);
    }
  },
  info(message: string, ...meta: unknown[]) {
    if (shouldLog('info')) {
      console.info(`[INFO] ${message}`, ...meta);
    }
  },
  debug(message: string, ...meta: unknown[]) {
    if (shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, ...meta);
    }
  },
};

import { Platform } from 'react-native';

type LogLevel = 'info' | 'warn' | 'error';

interface LogMessage {
  level: LogLevel;
  message: string;
  error?: any;
  context?: string;
  timestamp: string;
  platform?: string;
}

class Logger {
  private logs: LogMessage[] = [];
  private maxLogs = 100;

  private formatMessage(level: LogLevel, message: string, error?: any, context?: string): LogMessage {
    return {
      level,
      message,
      error,
      context,
      timestamp: new Date().toISOString(),
      platform: typeof Platform !== 'undefined' ? Platform.OS : 'unknown',
    };
  }

  private addLog(log: LogMessage) {
    this.logs.push(log);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // In development, also log to console
    if (__DEV__) {
      const consoleMessage = `[${log.level.toUpperCase()}] ${log.context ? `[${log.context}] ` : ''}${log.message}`;
      switch (log.level) {
        case 'info':
          console.log(consoleMessage);
          break;
        case 'warn':
          console.warn(consoleMessage);
          break;
        case 'error':
          console.error(consoleMessage, log.error);
          break;
      }
    }
  }

  info(message: string, context?: string) {
    this.addLog(this.formatMessage('info', message, undefined, context));
  }

  warn(message: string, context?: string) {
    this.addLog(this.formatMessage('warn', message, undefined, context));
  }

  error(message: string, error: any, context?: string) {
    this.addLog(this.formatMessage('error', message, error, context));
  }

  getLogs(): LogMessage[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}

export const logger = new Logger();
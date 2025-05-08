import { Platform } from 'react-native';

interface ErrorContext {
  context: string;
  action: string;
  attempt?: number;
  retryCount?: number;
  [key: string]: any;
}

/**
 * Captures and reports exceptions with additional context
 */
export function captureException(error: Error, context: ErrorContext) {
  // Log the error with full context
  console.error('Error captured:', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    },
    context,
    timestamp: new Date().toISOString(),
    environment: __DEV__ ? 'development' : 'production',
    platform: typeof Platform !== 'undefined' ? Platform.OS : 'unknown',
    retryAttempt: context.attempt,
    maxRetries: context.retryCount,
  });

  // In production, you would send this to your error reporting service
  // Example with Sentry:
  // if (!__DEV__) {
  //   Sentry.captureException(error, {
  //     extra: context
  //   });
  // }
}
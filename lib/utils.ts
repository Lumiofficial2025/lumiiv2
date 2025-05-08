// Utility function for exponential backoff retry
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  retries = 3,
  baseDelay = 1000,
  maxDelay = 10000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await operation();
    } catch (err: any) {
      lastError = err;
      
      // Don't retry if it's a validation error or auth error
      if (err.message?.includes('auth') || 
          err.message?.includes('validation') ||
          err.message?.includes('file type') ||
          err.message?.includes('5MB')) {
        throw err;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      
      // Add some randomness to prevent thundering herd
      const jitter = Math.random() * 100;
      
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
    }
  }
  
  throw lastError;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
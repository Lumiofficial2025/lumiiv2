import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { logger } from './logger';

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 1000,
  backoffFactor = 2
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries === 0) {
      throw error;
    }

    logger.warn(
      `Operation failed, retrying in ${delay}ms... (${retries} retries left)`,
      'retry_mechanism'
    );

    await new Promise(resolve => setTimeout(resolve, delay));

    return retryWithBackoff(
      operation,
      retries - 1,
      delay * backoffFactor,
      backoffFactor
    );
  }
}

// Get the Supabase URL and key from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validate the environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);
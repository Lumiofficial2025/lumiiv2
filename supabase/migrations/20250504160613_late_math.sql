/*
  # Add settings columns to profiles table

  1. Changes
    - Add notifications_enabled column (boolean, default true)
    - Add private_account column (boolean, default false)
    
  2. Notes
    - Both columns are nullable to maintain backward compatibility
    - Default values ensure expected behavior for existing profiles
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'notifications_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN notifications_enabled boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'private_account'
  ) THEN
    ALTER TABLE profiles ADD COLUMN private_account boolean DEFAULT false;
  END IF;
END $$;
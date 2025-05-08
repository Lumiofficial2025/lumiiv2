/*
  # Add avatar_version column to profiles table

  1. Changes
    - Add avatar_version column (integer, default 1)
    - This column will be used to bust the cache when a new avatar is uploaded
    
  2. Notes
    - Default value of 1 ensures existing profiles have a valid version
    - Column is nullable to maintain backward compatibility
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'avatar_version'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar_version integer DEFAULT 1;
  END IF;
END $$;
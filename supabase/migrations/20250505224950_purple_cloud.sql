/*
  # Add avatar version tracking to profiles table

  1. Changes
    - Add avatar_version column to profiles table
    - This helps track avatar updates and prevent caching issues
    
  2. Notes
    - Version is stored as text to support various versioning schemes
    - Default is null for backward compatibility
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_version text;

COMMENT ON COLUMN profiles.avatar_version IS 'Version identifier for the avatar image, used to bust caches';
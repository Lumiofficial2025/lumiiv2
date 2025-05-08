/*
  # Add hashtags column to posts table

  1. Changes
    - Add `hashtags` column to `posts` table as a text array
      - Default value: empty array
      - Nullable: true
      - Purpose: Store hashtags associated with each post

  2. Security
    - No additional RLS policies needed as the column inherits existing table policies
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' 
    AND column_name = 'hashtags'
  ) THEN
    ALTER TABLE posts 
    ADD COLUMN hashtags text[] DEFAULT ARRAY[]::text[];
  END IF;
END $$;
/*
  # Add hashtags support to posts table
  
  1. Changes
    - Add hashtags column to posts table
    - Add index for hashtag search performance
    
  2. Notes
    - Stores hashtags as text array for efficient querying
    - Index supports fast hashtag-based searches
*/

-- Add hashtags column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS hashtags text[];

-- Create GIN index for hashtag search
CREATE INDEX IF NOT EXISTS idx_posts_hashtags ON posts USING GIN (hashtags);

-- Add comment explaining the column
COMMENT ON COLUMN posts.hashtags IS 'Array of hashtags extracted from post caption';
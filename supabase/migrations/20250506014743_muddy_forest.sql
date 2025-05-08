/*
  # Add pg_trgm extension and update search function
  
  1. Changes
    - Enable pg_trgm extension for text similarity search
    - Update search_profiles function to use proper text similarity matching
    
  2. Notes
    - pg_trgm provides fuzzy string matching capabilities
    - Function now uses proper text similarity comparison
*/

-- Enable the pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS search_profiles;

-- Recreate the search function with proper similarity matching
CREATE OR REPLACE FUNCTION search_profiles(search_query TEXT)
RETURNS TABLE (
  id uuid,
  name text,
  avatar_url text,
  followers_count integer,
  following_count integer,
  private_account boolean,
  similarity real
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.avatar_url,
    p.followers_count,
    p.following_count,
    p.private_account,
    GREATEST(
      similarity(LOWER(p.name), LOWER(search_query)),
      similarity(LOWER(COALESCE(u.email, '')), LOWER(search_query))
    ) as similarity
  FROM profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  WHERE 
    similarity(LOWER(p.name), LOWER(search_query)) > 0.1
    OR similarity(LOWER(COALESCE(u.email, '')), LOWER(search_query)) > 0.1
  ORDER BY similarity DESC, followers_count DESC
  LIMIT 20;
END;
$$;
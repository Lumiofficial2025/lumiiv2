/*
  # Fix search_profiles function to include username
  
  1. Changes
    - Update search_profiles function to include username in results
    - Improve search matching to include usernames
    - Add proper type definitions for return values
    
  2. Notes
    - Uses pg_trgm for better text matching
    - Includes both name and username in search results
    - Maintains existing security settings
*/

-- Drop existing function
DROP FUNCTION IF EXISTS search_profiles;

-- Recreate function with username support
CREATE OR REPLACE FUNCTION search_profiles(search_query TEXT)
RETURNS TABLE (
  id uuid,
  name text,
  username text,
  avatar_url text,
  followers_count integer,
  following_count integer,
  private_account boolean,
  similarity real
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    LOWER(REGEXP_REPLACE(p.name, '\s+', '')) as username,
    p.avatar_url,
    p.followers_count,
    p.following_count,
    p.private_account,
    GREATEST(
      similarity(LOWER(p.name), LOWER(search_query)),
      similarity(LOWER(REGEXP_REPLACE(p.name, '\s+', '')), LOWER(search_query))
    ) as similarity
  FROM profiles p
  WHERE 
    similarity(LOWER(p.name), LOWER(search_query)) > 0.1
    OR similarity(LOWER(REGEXP_REPLACE(p.name, '\s+', '')), LOWER(search_query)) > 0.1
  ORDER BY similarity DESC, followers_count DESC
  LIMIT 20;
END;
$$;
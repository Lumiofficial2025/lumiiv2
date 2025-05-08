/*
  # Enhance profile search functionality
  
  1. Changes
    - Improve search function to handle partial matches
    - Add support for searching by username parts
    - Include bio in search results
    - Improve similarity matching
    
  2. Notes
    - Uses trigram similarity for better partial matches
    - Includes profile bio in search results
    - Orders by multiple relevance factors
*/

-- Drop existing function
DROP FUNCTION IF EXISTS search_profiles;

-- Recreate enhanced search function
CREATE OR REPLACE FUNCTION search_profiles(search_query TEXT)
RETURNS TABLE (
  id uuid,
  name text,
  username text,
  bio text,
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
  WITH processed_profiles AS (
    SELECT 
      p.*,
      LOWER(REGEXP_REPLACE(p.name, '\s+', '')) as username,
      GREATEST(
        similarity(LOWER(p.name), LOWER(search_query)),
        similarity(LOWER(REGEXP_REPLACE(p.name, '\s+', '')), LOWER(search_query)),
        CASE 
          WHEN p.bio IS NOT NULL THEN similarity(LOWER(p.bio), LOWER(search_query)) * 0.5
          ELSE 0
        END
      ) as match_score
    FROM profiles p
  )
  SELECT 
    pp.id,
    pp.name,
    pp.username,
    pp.bio,
    pp.avatar_url,
    pp.followers_count,
    pp.following_count,
    pp.private_account,
    pp.match_score as similarity
  FROM processed_profiles pp
  WHERE 
    pp.match_score > 0.1
    OR LOWER(pp.username) LIKE '%' || LOWER(search_query) || '%'
    OR LOWER(pp.name) LIKE '%' || LOWER(search_query) || '%'
  ORDER BY 
    pp.match_score DESC,
    pp.followers_count DESC,
    pp.name ASC
  LIMIT 20;
END;
$$;
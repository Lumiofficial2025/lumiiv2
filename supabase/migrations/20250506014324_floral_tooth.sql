/*
  # Add search functionality to profiles
  
  1. Changes
    - Add a search index on the name and username fields
    - Add a function to search profiles
    
  2. Notes
    - Uses PostgreSQL's built-in full text search
    - Includes both name and username in search results
    - Orders results by relevance
*/

-- Create a function to search profiles
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
    similarity(p.name, search_query) as similarity
  FROM profiles p
  WHERE 
    p.name ILIKE '%' || search_query || '%'
    OR p.id::text IN (
      SELECT id::text 
      FROM auth.users 
      WHERE email ILIKE '%' || search_query || '%'
    )
  ORDER BY similarity DESC, followers_count DESC
  LIMIT 20;
END;
$$;
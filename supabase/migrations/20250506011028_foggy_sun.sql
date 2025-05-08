/*
  # Prevent users from following themselves
  
  1. Changes
    - Update the "Users can follow others" policy to prevent self-follows
    - Add a check constraint to prevent self-follows at the database level
    
  2. Security
    - Policy ensures users can't follow themselves through the API
    - Check constraint provides database-level protection
    - Maintains existing functionality for following others
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Users can follow others" ON followers;

-- Recreate policy with self-follow prevention
CREATE POLICY "Users can follow others"
ON followers FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = follower_id AND 
  follower_id != following_id
);

-- Add check constraint to prevent self-follows
ALTER TABLE followers
ADD CONSTRAINT prevent_self_follow
CHECK (follower_id != following_id);

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT prevent_self_follow ON followers IS 'Prevents users from following themselves';
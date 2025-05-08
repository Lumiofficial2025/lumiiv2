/*
  # Fix likes table RLS policies

  1. Changes
    - Drop existing policies if they exist
    - Create new policies with proper checks
    - Ensure proper cascade behavior
    
  2. Security
    - Users can only create/delete their own likes
    - All authenticated users can view likes
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create likes" ON likes;
DROP POLICY IF EXISTS "Users can delete their likes" ON likes;
DROP POLICY IF EXISTS "Users can view likes" ON likes;

-- Create new policies
CREATE POLICY "Users can view likes"
ON likes
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can delete their likes"
ON likes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create likes"
ON likes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
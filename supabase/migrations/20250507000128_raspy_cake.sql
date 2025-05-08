/*
  # Update likes table policies
  
  1. Changes
    - Drop existing policies
    - Create new consolidated policies for likes management
    
  2. Security
    - Ensure authenticated users can only manage their own likes
    - Allow viewing of all likes for authenticated users
    - Prevent duplicate likes through table constraints
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create likes" ON likes;
DROP POLICY IF EXISTS "Users can delete their likes" ON likes;
DROP POLICY IF EXISTS "Users can view likes" ON likes;
DROP POLICY IF EXISTS "Authenticated users can like posts" ON likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON likes;

-- Create new consolidated policies
CREATE POLICY "Users can create likes"
ON likes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their likes"
ON likes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view likes"
ON likes
FOR SELECT
TO authenticated
USING (true);
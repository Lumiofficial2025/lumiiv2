/*
  # Add insert policy for profiles table
  
  1. Changes
    - Add RLS policy to allow authenticated users to insert their own profile
    
  2. Security
    - Policy ensures users can only create their own profile
    - Checks that the inserted row's ID matches the authenticated user's ID
*/

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
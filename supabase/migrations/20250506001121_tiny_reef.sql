/*
  # Implement followers system
  
  1. New Tables
    - `followers`
      - `id` (uuid, primary key)
      - `follower_id` (uuid, references profiles.id)
      - `following_id` (uuid, references profiles.id)
      - `created_at` (timestamptz)
      
  2. Changes to Profiles Table
    - Add followers_count column (integer)
    - Add following_count column (integer)
    
  3. Security
    - Enable RLS on followers table
    - Add policies for:
      - Users can follow/unfollow others
      - Users can view their followers/following
      - Public can view follower counts
*/

-- Create followers table
CREATE TABLE IF NOT EXISTS followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Add follower/following counts to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS followers_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count integer DEFAULT 0;

-- Enable RLS
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view followers/following"
ON followers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can follow others"
ON followers FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
ON followers FOR DELETE
TO authenticated
USING (auth.uid() = follower_id);

-- Create function to update follower counts
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment counts
    UPDATE profiles 
    SET followers_count = followers_count + 1
    WHERE id = NEW.following_id;
    
    UPDATE profiles 
    SET following_count = following_count + 1
    WHERE id = NEW.follower_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement counts
    UPDATE profiles 
    SET followers_count = followers_count - 1
    WHERE id = OLD.following_id;
    
    UPDATE profiles 
    SET following_count = following_count - 1
    WHERE id = OLD.follower_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to maintain counts
CREATE TRIGGER update_follower_counts_on_insert
  AFTER INSERT ON followers
  FOR EACH ROW
  EXECUTE FUNCTION update_follower_counts();

CREATE TRIGGER update_follower_counts_on_delete
  AFTER DELETE ON followers
  FOR EACH ROW
  EXECUTE FUNCTION update_follower_counts();
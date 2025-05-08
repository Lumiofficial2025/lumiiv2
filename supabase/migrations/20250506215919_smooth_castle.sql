/*
  # Create posts table and storage policies

  1. New Tables
    - `posts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `content_type` (text, check constraint for 'image' or 'video')
      - `content_url` (text)
      - `caption` (text)
      - `likes_count` (integer)
      - `comments_count` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Storage
    - Create posts bucket for storing media files
    - Add storage policies for user uploads

  3. Security
    - Enable RLS on posts table
    - Add policies for:
      - Users can create their own posts
      - Users can view all posts
      - Users can update/delete their own posts
*/

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content_type text CHECK (content_type IN ('image', 'video')),
  content_url text NOT NULL,
  caption text,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own posts"
  ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all posts"
  ON posts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own posts"
  ON posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create storage policies for posts bucket
BEGIN;

-- Policy to allow users to upload their own posts
CREATE POLICY "Users can upload their own posts"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'posts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow users to update their own posts
CREATE POLICY "Users can update their own posts"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'posts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow users to delete their own posts
CREATE POLICY "Users can delete their own posts"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'posts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow public read access to all posts
CREATE POLICY "Public read access for posts"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'posts');

COMMIT;
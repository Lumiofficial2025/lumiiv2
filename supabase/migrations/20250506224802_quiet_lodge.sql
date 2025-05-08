/*
  # Create posts bucket and storage policies
  
  1. Changes
    - Create posts bucket if it doesn't exist
    - Add storage policies for secure access to posts
    
  2. Security
    - Only authenticated users can upload to their own directory
    - Public read access for all posts
    - Users can only manage their own posts
*/

DO $$ 
BEGIN
  -- Create posts bucket if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'posts'
  ) THEN
    INSERT INTO storage.buckets (id, name)
    VALUES ('posts', 'posts');
  END IF;
END $$;

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop upload policy if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can upload their own posts' 
    AND tablename = 'objects' 
    AND schemaname = 'storage'
  ) THEN
    DROP POLICY "Users can upload their own posts" ON storage.objects;
  END IF;

  -- Drop update policy if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can update their own posts' 
    AND tablename = 'objects' 
    AND schemaname = 'storage'
  ) THEN
    DROP POLICY "Users can update their own posts" ON storage.objects;
  END IF;

  -- Drop delete policy if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can delete their own posts' 
    AND tablename = 'objects' 
    AND schemaname = 'storage'
  ) THEN
    DROP POLICY "Users can delete their own posts" ON storage.objects;
  END IF;

  -- Drop read policy if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Public read access for posts' 
    AND tablename = 'objects' 
    AND schemaname = 'storage'
  ) THEN
    DROP POLICY "Public read access for posts" ON storage.objects;
  END IF;
END $$;

-- Create new policies
CREATE POLICY "Users can upload their own posts"
  ON storage.objects 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    bucket_id = 'posts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own posts"
  ON storage.objects 
  FOR UPDATE 
  TO authenticated
  USING (
    bucket_id = 'posts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own posts"
  ON storage.objects 
  FOR DELETE 
  TO authenticated
  USING (
    bucket_id = 'posts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Public read access for posts"
  ON storage.objects 
  FOR SELECT 
  TO public
  USING (bucket_id = 'posts');
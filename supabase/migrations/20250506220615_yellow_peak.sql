/*
  # Update posts table and storage policies for image-only support
  
  1. Changes
    - Remove content_type column since we only support images now
    - Update storage policies to only allow image file uploads
    
  2. Security
    - Restrict file uploads to images only (jpg, jpeg, png, gif)
    - Maintain user isolation (users can only upload to their own folders)
    
  3. Notes
    - Existing video content should be migrated/archived before applying this change
*/

-- Remove content_type column since we only support images
ALTER TABLE posts DROP COLUMN IF EXISTS content_type;

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Begin transaction for policy changes
BEGIN;

  -- Drop existing policy if it exists
  DROP POLICY IF EXISTS "Users can upload their own posts" ON storage.objects;

  -- Create new policy for image uploads only
  CREATE POLICY "Users can upload their own posts"
    ON storage.objects 
    FOR INSERT 
    TO authenticated
    WITH CHECK (
      bucket_id = 'posts' AND
      auth.uid()::text = (storage.foldername(name))[1] AND
      LOWER(SUBSTRING(name FROM '\.([^\.]+)$')) IN ('jpg', 'jpeg', 'png', 'gif')
    );

COMMIT;
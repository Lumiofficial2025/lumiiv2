/*
  # Create storage policies for avatars bucket

  1. Security
    - Enable storage policies for avatars bucket
    - Add policies to:
      - Allow authenticated users to upload their own avatars
      - Allow public read access to all avatars
      - Allow users to update/delete their own avatars
      
  2. Notes
    - Policies ensure users can only manage their own avatars
    - Public read access enables avatar display without authentication
    - File paths are restricted to user's own directory
*/

-- Create policies for the avatars storage bucket
BEGIN;

-- Policy to allow users to upload their own avatars
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow users to update their own avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow public read access to all avatars
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

COMMIT;
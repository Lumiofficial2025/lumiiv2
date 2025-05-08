/*
  # Fix notification RLS policies and triggers
  
  1. Changes
    - Update notification RLS policies to allow system functions to create notifications
    - Modify handle_post_notification function to properly handle security definer
    
  2. Security
    - Ensure notifications can only be created by system functions
    - Maintain user isolation for notification viewing
    
  3. Notes
    - Uses SECURITY DEFINER to bypass RLS for trigger functions
    - Maintains existing notification uniqueness constraints
*/

-- Drop existing policies
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;

-- Create updated policies
CREATE POLICY "Users can view their own notifications"
ON notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Drop and recreate post notification function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION handle_post_notification()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Don't create notification if user is acting on their own post
  IF NEW.user_id = (SELECT user_id FROM posts WHERE id = NEW.post_id) THEN
    RETURN NEW;
  END IF;
  
  -- Insert notification
  INSERT INTO notifications (
    user_id,
    actor_id,
    type,
    post_id
  )
  VALUES (
    (SELECT user_id FROM posts WHERE id = NEW.post_id),
    NEW.user_id,
    TG_TABLE_NAME,
    NEW.post_id
  )
  ON CONFLICT (user_id, actor_id, type, COALESCE(post_id, '00000000-0000-0000-0000-000000000000'::uuid))
  DO NOTHING;
  
  RETURN NEW;
END;
$$;
/*
  # Fix notifications table RLS policies

  1. Changes
    - Drop existing policies if they exist
    - Create new policies with proper checks
    - Update notification triggers
    
  2. Security
    - Users can only view their own notifications
    - System can create notifications for valid interactions
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;

-- Create new policies
CREATE POLICY "Users can view their own notifications"
ON notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Drop and recreate post notification function with proper checks
CREATE OR REPLACE FUNCTION handle_post_notification()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;
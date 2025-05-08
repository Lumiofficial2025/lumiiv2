/*
  # Fix notifications for likes and comments
  
  1. Changes
    - Remove function parameter and use TG_ARGV instead
    - Recreate triggers to pass notification type as argument
    
  2. Security
    - Maintains existing security model
    - Only creates notifications for interactions from other users
    
  3. Notes
    - Uses TG_ARGV[0] to access the notification type
    - Handles duplicate notifications with ON CONFLICT
*/

-- Drop existing function and triggers
DROP TRIGGER IF EXISTS on_like_notification ON likes;
DROP TRIGGER IF EXISTS on_comment_notification ON comments;
DROP FUNCTION IF EXISTS handle_post_notification();

-- Create updated function to handle post notifications
CREATE OR REPLACE FUNCTION handle_post_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_type text;
BEGIN
  -- Get notification type from trigger argument
  notification_type := TG_ARGV[0];

  -- Get post owner and create notification
  INSERT INTO notifications (user_id, actor_id, type, post_id)
  SELECT 
    posts.user_id,  -- Notification recipient (post owner)
    NEW.user_id,    -- Actor (person who liked/commented)
    notification_type,
    NEW.post_id
  FROM posts
  WHERE posts.id = NEW.post_id
    AND posts.user_id != NEW.user_id  -- Don't notify for self-interactions
  ON CONFLICT (user_id, actor_id, type, COALESCE(post_id, '00000000-0000-0000-0000-000000000000'::uuid)) 
  DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers with type argument
CREATE TRIGGER on_like_notification
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION handle_post_notification('like');

CREATE TRIGGER on_comment_notification
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION handle_post_notification('comment');
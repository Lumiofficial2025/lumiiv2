/*
  # Fix notification trigger function

  1. Changes
    - Remove parameters from trigger function
    - Use TG_TABLE_NAME to determine notification type
    - Recreate triggers without arguments
    
  2. Notes
    - Trigger functions cannot have declared arguments
    - Using table name is more maintainable than passing type as argument
*/

-- Drop existing triggers
DROP TRIGGER IF EXISTS on_like_notification ON likes;
DROP TRIGGER IF EXISTS on_comment_notification ON comments;

-- Drop existing function
DROP FUNCTION IF EXISTS handle_post_notification();

-- Create updated function without parameters
CREATE OR REPLACE FUNCTION handle_post_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_type text;
BEGIN
  -- Determine notification type based on the triggering table
  notification_type := TG_TABLE_NAME;
  
  -- Insert notification
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

-- Recreate triggers without arguments
CREATE TRIGGER on_like_notification
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION handle_post_notification();

CREATE TRIGGER on_comment_notification
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION handle_post_notification();
/*
  # Fix notification types for likes and comments
  
  1. Changes
    - Drop existing triggers that depend on the function
    - Update function to use correct notification types
    - Recreate triggers with updated function
    
  2. Notes
    - Properly handles dependencies by dropping triggers first
    - Maps table names to correct notification types
    - Maintains existing security and functionality
*/

-- Drop existing triggers that depend on the function
DROP TRIGGER IF EXISTS on_like_notification ON likes;
DROP TRIGGER IF EXISTS on_comment_notification ON comments;

-- Drop and recreate function with correct notification types
CREATE OR REPLACE FUNCTION handle_post_notification()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  notification_type text;
BEGIN
  -- Don't create notification if user is acting on their own post
  IF NEW.user_id = (SELECT user_id FROM posts WHERE id = NEW.post_id) THEN
    RETURN NEW;
  END IF;
  
  -- Set correct notification type based on the triggering table
  notification_type := CASE TG_TABLE_NAME
    WHEN 'likes' THEN 'like'
    WHEN 'comments' THEN 'comment'
    ELSE NULL
  END;
  
  -- Only proceed if we have a valid notification type
  IF notification_type IS NOT NULL THEN
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
      notification_type,
      NEW.post_id
    )
    ON CONFLICT (user_id, actor_id, type, COALESCE(post_id, '00000000-0000-0000-0000-000000000000'::uuid))
    DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate triggers with updated function
CREATE TRIGGER on_like_notification
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION handle_post_notification();

CREATE TRIGGER on_comment_notification
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION handle_post_notification();
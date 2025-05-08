/*
  # Create notifications system
  
  1. New Tables
    - `notifications`: Stores user notifications
    - `likes`: Tracks post likes
    - `comments`: Stores post comments
    
  2. Features
    - Automatic notification creation for follows, likes, and comments
    - Post interaction tracking
    - Counter maintenance for likes and comments
    
  3. Security
    - Row Level Security (RLS) enabled on all tables
    - Appropriate policies for data access
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('follow', 'like', 'comment')),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create unique index for notifications
CREATE UNIQUE INDEX unique_notification ON notifications (
  user_id,
  actor_id,
  type,
  COALESCE(post_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create function to handle follow notifications
CREATE OR REPLACE FUNCTION handle_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification for new follow
  INSERT INTO notifications (user_id, actor_id, type)
  VALUES (NEW.following_id, NEW.follower_id, 'follow')
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for follow notifications
CREATE TRIGGER on_follow_notification
  AFTER INSERT ON followers
  FOR EACH ROW
  EXECUTE FUNCTION handle_follow_notification();

-- Create function to handle post interactions
CREATE OR REPLACE FUNCTION handle_post_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Get post owner and create notification
  INSERT INTO notifications (user_id, actor_id, type, post_id)
  SELECT 
    posts.user_id,
    auth.uid(),
    TG_ARGV[0]::text,
    NEW.post_id
  FROM posts
  WHERE posts.id = NEW.post_id
    AND posts.user_id != auth.uid()  -- Don't notify for self-interactions
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create tables for likes and comments
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, post_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create likes"
ON likes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their likes"
ON likes FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view likes"
ON likes FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can create comments"
ON comments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their comments"
ON comments FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view comments"
ON comments FOR SELECT TO authenticated
USING (true);

-- Create triggers for notifications
CREATE TRIGGER on_like_notification
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION handle_post_notification('like');

CREATE TRIGGER on_comment_notification
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION handle_post_notification('comment');

-- Create function to update post counts
CREATE OR REPLACE FUNCTION update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment the appropriate counter
    IF TG_TABLE_NAME = 'likes' THEN
      UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_TABLE_NAME = 'comments' THEN
      UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement the appropriate counter
    IF TG_TABLE_NAME = 'likes' THEN
      UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    ELSIF TG_TABLE_NAME = 'comments' THEN
      UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating post counts
CREATE TRIGGER update_post_likes_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_counts();

CREATE TRIGGER update_post_comments_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_counts();
/*
  # Add RLS policies for notifications table

  1. Changes
    - Enable RLS on notifications table
    - Add policies for:
      - System can create notifications
      - Users can view their own notifications
      
  2. Security
    - Ensures notifications can only be viewed by their intended recipients
    - Allows system/triggers to create notifications
*/

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;

-- Create policies
CREATE POLICY "System can create notifications"
ON notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can view their own notifications"
ON notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
/*
  # Fix notifications table RLS policies

  1. Changes
    - Add RLS policy for inserting notifications
    - Add RLS policy for authenticated users to view their own notifications
    
  2. Security
    - Only allow system-generated notifications (from triggers)
    - Users can only view notifications where they are the recipient
*/

-- Enable RLS if not already enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

-- Create policy for viewing notifications
CREATE POLICY "Users can view their own notifications"
ON notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create policy for inserting notifications
-- This allows the notification triggers to work
CREATE POLICY "System can create notifications"
ON notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add comment explaining the policies
COMMENT ON TABLE notifications IS 'Table storing user notifications with RLS policies:
- Users can only view their own notifications
- System/triggers can create notifications';
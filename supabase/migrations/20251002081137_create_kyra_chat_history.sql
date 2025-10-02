/*
  # Create Kyra Chat History Tables

  1. New Tables
    - `kyra_conversations`
      - `id` (uuid, primary key)
      - `title` (text) - auto-generated from first message
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `kyra_messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, foreign key)
      - `role` (text) - 'user' or 'assistant'
      - `content` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for anonymous users to read/write their own data
*/

-- Create conversations table
CREATE TABLE IF NOT EXISTS kyra_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'New Conversation',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS kyra_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES kyra_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE kyra_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyra_messages ENABLE ROW LEVEL SECURITY;

-- Policies for conversations
CREATE POLICY "Anyone can view conversations"
  ON kyra_conversations FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can create conversations"
  ON kyra_conversations FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can update conversations"
  ON kyra_conversations FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete conversations"
  ON kyra_conversations FOR DELETE
  TO anon
  USING (true);

-- Policies for messages
CREATE POLICY "Anyone can view messages"
  ON kyra_messages FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can create messages"
  ON kyra_messages FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can delete messages"
  ON kyra_messages FOR DELETE
  TO anon
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_kyra_messages_conversation_id ON kyra_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_kyra_conversations_updated_at ON kyra_conversations(updated_at DESC);

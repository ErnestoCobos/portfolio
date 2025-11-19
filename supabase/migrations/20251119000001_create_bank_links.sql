-- Create table for storing Belvo links
CREATE TABLE bank_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  belvo_link_id TEXT NOT NULL,
  institution TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE bank_links ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own links
CREATE POLICY "Users can view their own bank links" ON bank_links
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own links
CREATE POLICY "Users can insert their own bank links" ON bank_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own links
CREATE POLICY "Users can update their own bank links" ON bank_links
  FOR UPDATE USING (auth.uid() = user_id);

-- SQL Setup for Assignments Table
-- Run this in your Supabase SQL Editor

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  course TEXT NOT NULL,
  due_date DATE NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  target_year TEXT DEFAULT 'all',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
DROP POLICY IF EXISTS "Allow all operations on assignments" ON assignments;
CREATE POLICY "Allow all operations on assignments" ON assignments FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignments_priority ON assignments(priority);
CREATE INDEX IF NOT EXISTS idx_assignments_year ON assignments(target_year);
CREATE INDEX IF NOT EXISTS idx_assignments_active ON assignments(is_active);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_assignments_updated_at ON assignments;
CREATE TRIGGER update_assignments_updated_at 
  BEFORE UPDATE ON assignments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample assignments
INSERT INTO assignments (title, course, due_date, priority, target_year) VALUES
('Programming Assignment 2', 'Introduction to Programming', '2025-11-20', 'high', '1'),
('Database Design Project', 'Database Management Systems', '2025-11-25', 'medium', '1'),
('Programming Assignment 3', 'Introduction to Programming', '2025-12-05', 'low', '1'),
('Web Development Project', 'Web Development', '2025-11-28', 'high', '2'),
('Advanced Programming Assignment', 'Advanced Programming II', '2025-11-22', 'medium', '2')
ON CONFLICT DO NOTHING;

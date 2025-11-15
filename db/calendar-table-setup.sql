-- SQL Setup for Academic Calendar (Important Dates)
-- Run this in your Supabase SQL Editor

-- Create important_dates table for academic calendar
CREATE TABLE IF NOT EXISTS important_dates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  date_type TEXT NOT NULL CHECK (date_type IN ('test', 'exam', 'deadline', 'holiday')),
  target_year TEXT DEFAULT 'all',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE important_dates ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
DROP POLICY IF EXISTS "Allow all operations on important_dates" ON important_dates;
CREATE POLICY "Allow all operations on important_dates" ON important_dates FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_important_dates_start ON important_dates(start_date);
CREATE INDEX IF NOT EXISTS idx_important_dates_type ON important_dates(date_type);
CREATE INDEX IF NOT EXISTS idx_important_dates_year ON important_dates(target_year);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_important_dates_updated_at ON important_dates;
CREATE TRIGGER update_important_dates_updated_at 
  BEFORE UPDATE ON important_dates 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

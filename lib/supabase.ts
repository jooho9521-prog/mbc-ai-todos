
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://itaynxlbyoqwxbqxiuxo.supabase.co';
const supabaseKey = 'sb_publishable_maPrgWKXzbdi0XL66sY5Eg_ga0506Oz';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * [IMPORTANT] Run this SQL in your Supabase SQL Editor:
 * 
 * CREATE TABLE todos (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   title TEXT NOT NULL,
 *   description TEXT,
 *   is_completed BOOLEAN DEFAULT FALSE,
 *   priority TEXT DEFAULT 'medium',
 *   due_date TIMESTAMP WITH TIME ZONE,
 *   category TEXT DEFAULT 'General',
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 * 
 * ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Public Access" ON todos FOR ALL USING (true) WITH CHECK (true);
 */

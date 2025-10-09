-- Migration to fix demo user and ensure proper setup
-- Run this in your Supabase SQL Editor

-- 1. First, insert the demo user if it doesn't exist
INSERT INTO users (id, email, name) 
VALUES ('00000000-0000-0000-0000-000000000001', 'demo@macroo.app', 'Demo User')
ON CONFLICT (id) DO NOTHING;

-- 2. Verify the user_profiles table has the correct structure
-- (This should already be correct from your schema.sql)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Add name column to user_profiles if it doesn't exist
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- 4. Insert a default profile for the demo user if needed
INSERT INTO user_profiles (
    user_id, 
    name,
    height, 
    weight, 
    age, 
    gender, 
    activity_level, 
    goal, 
    daily_calorie_target,
    daily_protein_target,
    daily_carbs_target,
    daily_fat_target,
    daily_water_target
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Demo User', -- name
    170,  -- height in cm
    70.0, -- weight in kg
    30,   -- age
    'other', -- gender
    'moderately_active', -- activity_level
    'maintain_weight',   -- goal
    2000, -- daily_calorie_target
    150.0, -- daily_protein_target
    250.0, -- daily_carbs_target
    80.0,  -- daily_fat_target
    2000   -- daily_water_target in ml
)
ON CONFLICT (user_id) DO NOTHING;

-- 5. Verify everything is set up correctly
SELECT 'Demo user created successfully' as status
WHERE EXISTS (
    SELECT 1 FROM users WHERE id = '00000000-0000-0000-0000-000000000001'
);
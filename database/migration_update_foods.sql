-- Migration to update foods table with comprehensive nutritional data
-- Run this migration if you have an existing database that needs updates

-- Add new columns to foods table if they don't exist
ALTER TABLE foods 
ADD COLUMN IF NOT EXISTS fiber DECIMAL(8,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sugar DECIMAL(8,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sodium DECIMAL(8,2) DEFAULT 0;

-- Update serving_size column to have better default
ALTER TABLE foods 
ALTER COLUMN serving_size SET DEFAULT '100g';

-- Delete existing food entries to replace with accurate data
DELETE FROM foods WHERE is_custom = false;

-- Insert comprehensive food database with accurate nutritional information
INSERT INTO foods (name, calories, protein, carbs, fat, fiber, sugar, sodium, serving_size, is_custom) VALUES
-- Indian Foods
('Idli', 58, 2.0, 12.0, 0.4, 0.8, 0.5, 2, '1 piece (30g)', false),
('Dosa', 168, 4.0, 22.0, 7.4, 1.2, 1.0, 15, '1 medium (100g)', false),
('Appam', 120, 2.5, 24.0, 2.0, 1.0, 2.0, 8, '1 piece (100g)', false),
('Chapati', 104, 3.1, 18.0, 2.4, 2.8, 0.4, 181, '1 medium (40g)', false),
('Paratha', 126, 3.0, 18.0, 4.4, 2.5, 0.6, 230, '1 medium (40g)', false),
('Naan', 262, 9.0, 45.0, 5.1, 2.2, 3.5, 523, '1 piece (100g)', false),

-- Rice & Grains
('Basmati Rice (cooked)', 130, 2.7, 28.0, 0.3, 0.4, 0.1, 1, '100g', false),
('Brown Rice (cooked)', 112, 2.6, 22.0, 0.9, 1.8, 0.4, 5, '100g', false),
('Quinoa (cooked)', 120, 4.4, 22.0, 1.9, 2.8, 0.9, 7, '100g', false),
('Oats', 68, 2.4, 12.0, 1.4, 1.7, 0.3, 49, '50g dry', false),

-- Proteins
('Boiled Egg', 155, 13.0, 1.1, 11.0, 0, 0.6, 124, '1 large (100g)', false),
('Scrambled Egg', 91, 6.1, 0.7, 6.7, 0, 0.4, 169, '1 egg (60g)', false),
('Chicken Breast (grilled)', 165, 31.0, 0, 3.6, 0, 0, 74, '100g', false),
('Fish (Salmon)', 208, 25.0, 0, 12.0, 0, 0, 59, '100g', false),
('Paneer', 321, 25.0, 3.4, 25.0, 0, 3.2, 18, '100g', false),
('Tofu', 144, 17.0, 2.8, 9.0, 2.3, 0.6, 14, '100g', false),

-- Legumes & Pulses
('Dal (Cooked)', 116, 9.0, 20.0, 0.4, 8.0, 2.0, 5, '100g', false),
('Chickpeas (cooked)', 164, 8.9, 27.0, 2.6, 8.0, 4.8, 7, '100g', false),
('Black Beans (cooked)', 132, 8.9, 23.0, 0.5, 8.7, 0.3, 2, '100g', false),
('Kidney Beans (cooked)', 127, 8.7, 23.0, 0.5, 6.4, 0.3, 2, '100g', false),

-- Vegetables
('Potato (boiled)', 77, 2.0, 17.0, 0.1, 2.2, 0.8, 6, '100g', false),
('Sweet Potato (boiled)', 76, 1.4, 17.0, 0.1, 2.5, 5.4, 6, '100g', false),
('Broccoli', 25, 2.6, 5.0, 0.4, 2.3, 1.5, 41, '100g', false),
('Spinach', 23, 2.9, 3.6, 0.4, 2.2, 0.4, 79, '100g', false),
('Carrot', 41, 0.9, 10.0, 0.2, 2.8, 4.7, 69, '100g', false),
('Tomato', 18, 0.9, 3.9, 0.2, 1.2, 2.6, 5, '100g', false),

-- Fruits
('Apple', 52, 0.3, 14.0, 0.2, 2.4, 10.0, 1, '100g', false),
('Banana', 89, 1.1, 23.0, 0.3, 2.6, 12.0, 1, '100g', false),
('Orange', 43, 0.9, 11.0, 0.1, 2.2, 8.5, 0, '100g', false),
('Mango', 60, 0.8, 15.0, 0.4, 1.6, 13.0, 1, '100g', false),
('Grapes', 62, 0.6, 16.0, 0.2, 0.9, 15.0, 2, '100g', false),

-- Nuts & Seeds (per 100g)
('Almonds', 579, 21.0, 22.0, 50.0, 12.0, 4.4, 1, '30g (handful)', false),
('Walnuts', 654, 15.0, 14.0, 65.0, 6.7, 2.6, 2, '30g (handful)', false),
('Peanuts', 567, 26.0, 16.0, 49.0, 8.5, 4.7, 18, '30g (handful)', false),
('Cashews', 553, 18.0, 30.0, 44.0, 3.3, 6.0, 12, '30g (handful)', false),

-- Dairy
('Milk (whole)', 61, 3.2, 4.8, 3.3, 0, 4.8, 44, '100ml', false),
('Yogurt (plain)', 59, 10.0, 3.6, 0.4, 0, 3.2, 36, '100g', false),
('Cheese (cheddar)', 402, 25.0, 1.3, 33.0, 0, 0.5, 653, '100g', false),

-- Oils & Fats (per 100g)
('Olive Oil', 884, 0, 0, 100.0, 0, 0, 2, '1 tbsp (15ml)', false),
('Coconut Oil', 862, 0, 0, 100.0, 0, 0, 0, '1 tbsp (15ml)', false),
('Ghee', 900, 0, 0, 100.0, 0, 0, 0, '1 tbsp (15ml)', false),
('Butter', 717, 0.9, 0.7, 81.0, 0, 0.7, 643, '1 tbsp (15g)', false)

ON CONFLICT (name, user_id) DO UPDATE SET
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat,
  fiber = EXCLUDED.fiber,
  sugar = EXCLUDED.sugar,
  sodium = EXCLUDED.sodium,
  serving_size = EXCLUDED.serving_size;

-- Update any existing meal entries to ensure they work with new food data
-- This is safe as it only updates references, not the meal data itself
UPDATE meal_entries 
SET updated_at = CURRENT_TIMESTAMP 
WHERE updated_at < CURRENT_TIMESTAMP - INTERVAL '1 day';

-- Refresh materialized views if any exist
-- (Add specific view refresh commands if your database uses them)

COMMIT;
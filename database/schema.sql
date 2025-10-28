-- Diet Tracker App Database Schema for Supabase
-- Copy and paste this into Supabase SQL Editor

-- Enable UUID extension (Supabase has this enabled by default)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for future user management)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Food database table
CREATE TABLE foods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    calories INTEGER NOT NULL,
    protein DECIMAL(8,2) NOT NULL,
    carbs DECIMAL(8,2) NOT NULL,
    fat DECIMAL(8,2) NOT NULL,
    fiber DECIMAL(8,2) DEFAULT 0,
    sugar DECIMAL(8,2) DEFAULT 0,
    sodium DECIMAL(8,2) DEFAULT 0,
    serving_size VARCHAR(100) DEFAULT '100g',
    category VARCHAR(100),
    brand VARCHAR(255),
    barcode VARCHAR(50),
    user_id UUID REFERENCES users(id),
    is_custom BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, user_id)
);

-- Meal entries table
CREATE TABLE meal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    food_id UUID REFERENCES foods(id),
    meal_type VARCHAR(20) CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    quantity DECIMAL(8,2) NOT NULL DEFAULT 1,
    serving_size VARCHAR(100),
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Water entries table
CREATE TABLE water_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    amount INTEGER NOT NULL, -- in ml
    date DATE NOT NULL,
    time TIME DEFAULT CURRENT_TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User profiles table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id),
    name VARCHAR(255), -- user display name
    height INTEGER, -- in cm
    weight DECIMAL(5,2), -- in kg
    age INTEGER,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    activity_level VARCHAR(20) CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active')),
    goal VARCHAR(20) CHECK (goal IN ('lose_weight', 'maintain_weight', 'gain_weight')),
    daily_calorie_target INTEGER,
    daily_protein_target DECIMAL(8,2),
    daily_carbs_target DECIMAL(8,2),
    daily_fat_target DECIMAL(8,2),
    daily_water_target INTEGER DEFAULT 2000, -- in ml
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Meal templates table
CREATE TABLE meal_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    meal_type VARCHAR(20) CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    foods JSONB NOT NULL, -- Array of {food_id, quantity, serving_size}
    total_calories INTEGER,
    total_protein DECIMAL(8,2),
    total_carbs DECIMAL(8,2),
    total_fat DECIMAL(8,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Achievements table
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    achievement_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    points INTEGER DEFAULT 0,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- Weekly challenges table
CREATE TABLE weekly_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    challenge_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_value INTEGER,
    current_value INTEGER DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    completed BOOLEAN DEFAULT false,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_foods_name ON foods(name);
CREATE INDEX idx_foods_user_id ON foods(user_id);
CREATE INDEX idx_meal_entries_user_date ON meal_entries(user_id, date);
CREATE INDEX idx_meal_entries_food_id ON meal_entries(food_id);
CREATE INDEX idx_water_entries_user_date ON water_entries(user_id, date);

-- Insert demo user
INSERT INTO users (id, email, name) VALUES 
('00000000-0000-0000-0000-000000000001', 'demo@macroo.app', 'Demo User');

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
('Butter', 717, 0.9, 0.7, 81.0, 0, 0.7, 643, '1 tbsp (15g)', false);

-- Functions for updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_foods_updated_at BEFORE UPDATE ON foods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meal_entries_updated_at BEFORE UPDATE ON meal_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meal_templates_updated_at BEFORE UPDATE ON meal_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
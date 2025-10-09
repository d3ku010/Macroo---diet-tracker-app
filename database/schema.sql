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

-- Insert some default foods (based on your current foodDatabase.jsx)
INSERT INTO foods (name, calories, protein, carbs, fat, serving_size, is_custom) VALUES
('Idli', 58, 2.0, 12.0, 0.4, '1 piece', false),
('Appam', 120, 2.0, 24.0, 3.0, '1 piece', false),
('Boiled Egg', 155, 13.0, 1.1, 11.0, '1 large egg', false),
('Rice', 130, 2.7, 28.0, 0.3, '100g cooked', false);

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
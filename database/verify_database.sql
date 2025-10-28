-- Database Verification and Troubleshooting Script
-- Use this to verify your database setup and diagnose common issues

-- 1. Check if all required tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('users', 'foods', 'meal_entries', 'water_entries', 'user_profiles', 'meal_templates', 'achievements', 'weekly_challenges') 
        THEN '✅ Required table exists'
        ELSE '❌ Unexpected table'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Check foods table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'foods' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check user_profiles table constraints
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    tc.is_deferrable,
    tc.initially_deferred,
    rc.match_option AS match_type,
    rc.update_rule,
    rc.delete_rule,
    tc2.table_name AS foreign_table_name,
    kcu2.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
    ON tc.constraint_catalog = kcu.constraint_catalog
    AND tc.constraint_schema = kcu.constraint_schema
    AND tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.referential_constraints rc
    ON tc.constraint_catalog = rc.constraint_catalog
    AND tc.constraint_schema = rc.constraint_schema
    AND tc.constraint_name = rc.constraint_name
LEFT JOIN information_schema.table_constraints tc2
    ON rc.unique_constraint_catalog = tc2.constraint_catalog
    AND rc.unique_constraint_schema = tc2.constraint_schema
    AND rc.unique_constraint_name = tc2.constraint_name
LEFT JOIN information_schema.key_column_usage kcu2
    ON tc2.constraint_catalog = kcu2.constraint_catalog
    AND tc2.constraint_schema = kcu2.constraint_schema
    AND tc2.constraint_name = kcu2.constraint_name
WHERE tc.table_name = 'user_profiles';

-- 4. Check if demo user exists
SELECT 
    id,
    email,
    name,
    created_at
FROM users 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 5. Check food database content
SELECT 
    COUNT(*) as total_foods,
    COUNT(CASE WHEN is_custom = false THEN 1 END) as default_foods,
    COUNT(CASE WHEN is_custom = true THEN 1 END) as custom_foods
FROM foods;

-- 6. Check for common constraint issues
-- Activity level constraint check
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%activity_level%';

-- Goal constraint check  
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%goal%';

-- 7. Sample data check - Recent meal entries
SELECT 
    me.id,
    me.user_id,
    me.meal_type,
    me.quantity,
    me.date,
    f.name as food_name,
    me.created_at
FROM meal_entries me
LEFT JOIN foods f ON me.food_id = f.id
ORDER BY me.created_at DESC
LIMIT 5;

-- 8. Sample data check - Recent water entries
SELECT 
    id,
    user_id,
    amount,
    date,
    time,
    created_at
FROM water_entries
ORDER BY created_at DESC
LIMIT 5;

-- 9. Check for any orphaned records
-- Meal entries without valid food references
SELECT 
    COUNT(*) as orphaned_meal_entries
FROM meal_entries me
LEFT JOIN foods f ON me.food_id = f.id
WHERE f.id IS NULL;

-- 10. User profile validation
SELECT 
    up.id,
    up.user_id,
    up.activity_level,
    up.goal,
    up.daily_calorie_target,
    up.daily_water_target,
    CASE 
        WHEN up.activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active') 
        THEN '✅ Valid activity level'
        ELSE '❌ Invalid activity level: ' || up.activity_level
    END as activity_level_status,
    CASE 
        WHEN up.goal IN ('lose_weight', 'maintain_weight', 'gain_weight') 
        THEN '✅ Valid goal'
        ELSE '❌ Invalid goal: ' || up.goal
    END as goal_status
FROM user_profiles up;

-- Expected Results Guide:
-- - All required tables should exist
-- - Demo user should exist with ID '00000000-0000-0000-0000-000000000001'
-- - Foods table should have fiber, sugar, sodium columns
-- - Default foods should be populated (40+ entries)
-- - Activity levels should only be: sedentary, lightly_active, moderately_active, very_active, extremely_active
-- - Goals should only be: lose_weight, maintain_weight, gain_weight
-- - No orphaned meal entries should exist
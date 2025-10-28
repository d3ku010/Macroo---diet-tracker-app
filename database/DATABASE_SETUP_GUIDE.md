# Database Setup and Troubleshooting Guide

## Quick Setup for New Database

If you're setting up a fresh Supabase database, run these steps in order:

### 1. Run the Main Schema
Execute `schema.sql` in your Supabase SQL Editor to create all tables and initial data.

### 2. Verify Setup
Execute `verify_database.sql` to check if everything is set up correctly.

### 3. If Upgrading Existing Database
Execute `migration_update_foods.sql` to update your food database with new comprehensive nutritional data.

## Common Issues and Solutions

### Issue 1: "Property 'getMeals' doesn't exist"
**Cause**: Incorrect import statements
**Solution**: Ensure you're importing from `utils/supabaseStorage` not `utils/macrooDatabase`
```javascript
// ✅ Correct
import { getMeals, getProfile } from '../utils/supabaseStorage';

// ❌ Incorrect  
import { getMeals, getProfile } from '../utils/macrooDatabase';
```

### Issue 2: "null value in column 'amount' violates not-null constraint"
**Cause**: Water entry validation issue
**Solution**: Already fixed in `utils/supabaseStorage.jsx` with validation:
```javascript
if (!waterEntry.amount || isNaN(waterEntry.amount) || waterEntry.amount <= 0) {
    throw new Error('Invalid water amount. Must be a positive number.');
}
```

### Issue 3: "user_profiles_activity_level_check constraint violation"
**Cause**: Activity level values don't match database constraints
**Solution**: Already fixed in `utils/macrooDatabase.jsx` with mapping:
```javascript
const mapActivityLevel = (appLevel) => {
    const mapping = {
        'sedentary': 'sedentary',
        'light': 'lightly_active',
        'moderate': 'moderately_active', 
        'active': 'very_active',
        'very_active': 'extremely_active'
    };
    return mapping[appLevel] || 'lightly_active';
};
```

### Issue 4: Missing fiber, sugar, sodium columns in foods table
**Cause**: Old database schema
**Solution**: Run the migration file:
```sql
-- Add new columns
ALTER TABLE foods 
ADD COLUMN IF NOT EXISTS fiber DECIMAL(8,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sugar DECIMAL(8,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sodium DECIMAL(8,2) DEFAULT 0;
```

### Issue 5: Demo user not found
**Cause**: Missing demo user in database
**Solution**: Insert demo user:
```sql
INSERT INTO users (id, email, name) VALUES 
('00000000-0000-0000-0000-000000000001', 'demo@macroo.app', 'Demo User');
```

## Database Schema Validation Checklist

Run `verify_database.sql` and ensure:

- ✅ All 8 required tables exist
- ✅ Demo user exists with correct ID
- ✅ Foods table has fiber, sugar, sodium columns
- ✅ Default foods are populated (40+ entries)
- ✅ Activity level constraints are correct
- ✅ Goal constraints are correct
- ✅ No orphaned meal entries exist

## Environment Variables

Ensure your `.env` file has correct Supabase credentials:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Performance Optimization

The app now uses optimized database queries:
- `getMeals(date)` - Gets meals for specific date only
- `getWaterEntries(date)` - Gets water entries for specific date only
- Eliminates client-side filtering for better performance

## Expected Application Behavior

After proper database setup:
- ✅ Home screen loads without crashes
- ✅ Daily nutrition summary displays correctly
- ✅ Water tracking works with validation
- ✅ Profile saving works with constraint mapping
- ✅ Food database shows 40+ comprehensive food items
- ✅ All database operations handle errors gracefully

## Troubleshooting Steps

1. **Check browser console** for specific error messages
2. **Run verification script** to identify database issues
3. **Check Supabase logs** in your project dashboard
4. **Verify environment variables** are correctly set
5. **Run migration scripts** if upgrading from old schema
6. **Check network connectivity** to Supabase

## Support

If issues persist:
1. Check the browser console for specific error messages
2. Verify your Supabase project is active and accessible
3. Ensure RLS (Row Level Security) policies allow your operations
4. Check Supabase project logs for server-side errors
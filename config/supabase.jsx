// Supabase configuration for Macroo Diet Tracker
// Replace the values below with your actual Supabase credentials

export const SUPABASE_CONFIG = {
    // Replace with your Supabase project URL
    // Example: https://your-project-id.supabase.co
    url: 'https://rokaqtsshjnvcljzijik.supabase.co',

    // Replace with your Supabase anon key
    // Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJva2FxdHNzaGpudmNsanppamlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2ODM4NjUsImV4cCI6MjA3NTI1OTg2NX0.D1QgJck-lnPw8UH4CwLevTjABYkg7S23e4HPjt9W_po',

    // Service role key (keep this secret, only use in secure contexts)
    // serviceRoleKey: 'YOUR_SUPABASE_SERVICE_ROLE_KEY', // Uncomment if needed
};

// Supabase table names
export const TABLES = {
    USERS: 'users',
    FOODS: 'foods',
    MEAL_ENTRIES: 'meal_entries',
    WATER_ENTRIES: 'water_entries',
    USER_PROFILES: 'user_profiles',
    MEAL_TEMPLATES: 'meal_templates',
    ACHIEVEMENTS: 'achievements',
    WEEKLY_CHALLENGES: 'weekly_challenges',
};

// API endpoints for different operations
export const API_OPERATIONS = {
    // Food operations
    GET_FOODS: 'foods',
    ADD_FOOD: 'foods',
    UPDATE_FOOD: 'foods',
    DELETE_FOOD: 'foods',

    // Meal operations
    GET_MEALS: 'meal_entries',
    ADD_MEAL: 'meal_entries',
    UPDATE_MEAL: 'meal_entries',
    DELETE_MEAL: 'meal_entries',

    // Water tracking
    GET_WATER_ENTRIES: 'water_entries',
    ADD_WATER_ENTRY: 'water_entries',

    // User profile
    GET_PROFILE: 'user_profiles',
    UPDATE_PROFILE: 'user_profiles',
};
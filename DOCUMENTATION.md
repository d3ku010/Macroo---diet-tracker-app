# Diet Tracker App - Complete Project Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Design](#architecture--design)
3. [File Structure & Organization](#file-structure--organization)
4. [Core Features](#core-features)
5. [Technical Implementation](#technical-implementation)
6. [Database Schema](#database-schema)
7. [Component Documentation](#component-documentation)
8. [API & Data Flow](#api--data-flow)
9. [Known Issues & Solutions](#known-issues--solutions)
10. [Development Workflow](#development-workflow)
11. [Testing & Quality Assurance](#testing--quality-assurance)
12. [Deployment & Distribution](#deployment--distribution)
13. [Future Enhancements](#future-enhancements)

---

## Project Overview

### Application Purpose
The Diet Tracker App is a comprehensive nutrition management platform built with React Native and Expo. It provides users with advanced calorie tracking, meal logging, nutrition analysis, and gamification features to promote healthy eating habits.

### Target Audience
- Health-conscious individuals tracking daily nutrition
- Fitness enthusiasts monitoring macro/micro nutrients
- Users seeking gamified motivation for healthy eating
- People wanting detailed nutrition analytics and insights

### Key Value Propositions
- **Comprehensive Tracking**: Calories, macros, hydration, meal photos
- **Smart Features**: AI recommendations, barcode scanning, meal templates
- **Gamification**: Achievement system, weekly challenges, progress tracking
- **Data Portability**: Export/import functionality with multiple formats
- **Visual Analytics**: Progress rings, charts, trend analysis

---

## Architecture & Design

### Technology Stack

#### Frontend Framework
- **React Native**: Cross-platform mobile development
- **Expo SDK 54**: Development platform and build tools
- **Expo Router**: File-based navigation system
- **React Native Web**: Web platform support

#### Data & Storage
- **AsyncStorage**: Local data persistence
- **Supabase**: Backend database and authentication
- **SQLite**: Local database operations (via Expo SQLite)

#### UI & Visualization
- **React Native SVG**: Custom graphics and progress rings
- **React Native Chart Kit**: Data visualization components
- **Expo Image**: Optimized image handling
- **Custom Theme System**: Dynamic theming with palette switching

#### Development Tools
- **TypeScript**: Type safety and development experience
- **ESLint**: Code quality and consistency
- **PropTypes**: Runtime type validation
- **Metro Bundler**: JavaScript bundling and hot reloading

### Design Patterns

#### Component Architecture
```
App Level
├── Navigation (Expo Router)
├── Theme Provider (Global theming)
├── Storage Layer (AsyncStorage + Supabase)
└── Error Boundaries (Global error handling)

Feature Level
├── Screens (Tab-based navigation)
├── Components (Reusable UI elements)
├── Utils (Business logic and helpers)
└── Types (PropTypes definitions)
```

#### Data Flow Pattern
```
User Input → Component State → Utils Layer → Storage Layer → Database
                ↓
UI Updates ← Component Re-render ← State Updates ← Data Retrieval
```

---

## File Structure & Organization

### Root Directory Structure
```
diet-tracker-app/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation screens
│   └── summary.jsx        # Summary/report screen
├── assets/                # Static assets (images, fonts)
├── components/            # Reusable UI components
│   ├── charts/           # Data visualization components
│   ├── forms/            # Form and input components
│   └── ui/               # Generic UI elements
├── config/               # Configuration files
├── constants/            # App constants and settings
├── data/                 # Static data and mock data
├── database/             # Database schemas and migrations
├── hooks/                # Custom React hooks
├── scripts/              # Build and utility scripts
├── types/                # TypeScript/PropTypes definitions
└── utils/                # Business logic and utilities
    ├── achievements/     # Achievement system logic
    └── recommendations/  # AI recommendation engine
```

### Screen Organization (app/ directory)
```
app/
├── (tabs)/
│   ├── _layout.jsx       # Tab navigation layout
│   ├── index.jsx         # Home/Dashboard screen
│   ├── add-meal.jsx      # Meal logging interface
│   ├── food-db.jsx       # Food database management
│   ├── monthly.jsx       # Analytics and trends
│   └── profile.jsx       # User profile and settings
└── summary.jsx           # Detailed reports and summaries
```

### Component Organization
```
components/
├── charts/
│   ├── DailyCalorieChart.jsx      # Daily calorie visualization
│   ├── MacroRatioPieChart.jsx     # Macro distribution pie chart
│   ├── ProgressRing.jsx           # Circular progress indicators
│   └── WeeklyMonthlyChart.jsx     # Trend analysis charts
├── forms/
│   ├── BarcodeScanner.jsx         # Barcode scanning functionality
│   ├── EnhancedFoodSearch.jsx     # Advanced food search
│   ├── ExportBackupManager.jsx    # Data export/import
│   ├── FoodSearchForm.jsx         # Basic food search
│   ├── MealPhotoCapture.jsx       # Photo capture interface
│   └── MealTemplateForm.jsx       # Meal template management
└── ui/
    ├── PaletteSwitcher.jsx        # Theme color picker
    ├── PrimaryButton.jsx          # Primary action button
    ├── SecondaryButton.jsx        # Secondary action button
    ├── SegmentedControl.jsx       # Tab-like control
    ├── ThemeProvider.jsx          # Theme context provider
    └── Toast.jsx                  # Notification system
```

---

## Core Features

### 1. Meal Logging & Tracking

#### Food Database Management
- **Local Storage**: 500+ common foods with nutrition data
- **Custom Entries**: User-added foods with full nutrition profiles
- **Serving Sizes**: Flexible portion control (grams, cups, pieces)
- **Nutrition Fields**: Calories, protein, carbs, fat, fiber, sugar per 100g

#### Meal Entry Methods
- **Search Interface**: Text-based food search with filtering
- **Barcode Scanning**: Product barcode recognition and lookup
- **Meal Templates**: Saved meal combinations for quick logging
- **Photo Documentation**: Visual meal tracking with camera integration

#### Daily Tracking
- **Real-time Updates**: Immediate nutrition calculation
- **Progress Visualization**: Circular progress rings for macros
- **Hydration Tracking**: Water intake monitoring
- **Meal Timing**: Breakfast, lunch, dinner, snack categorization

### 2. Analytics & Visualization

#### Progress Rings
```jsx
// Multi-metric progress visualization
<ProgressRing
  progress={[
    { value: caloriesConsumed, target: calorieTarget, color: '#FF6B6B' },
    { value: proteinConsumed, target: proteinTarget, color: '#4ECDC4' },
    { value: carbsConsumed, target: carbTarget, color: '#45B7D1' }
  ]}
  size={200}
  strokeWidth={12}
/>
```

#### Chart Components
- **Daily Calorie Chart**: Hourly calorie consumption trends
- **Macro Pie Chart**: Nutritional balance visualization
- **Weekly/Monthly Charts**: Long-term progress analysis
- **Interactive Tooltips**: Detailed data on hover/touch

### 3. Gamification System

#### Achievement Categories
```javascript
const achievementTypes = {
  CONSISTENCY: {
    STREAK_3: "3-day logging streak",
    STREAK_7: "7-day logging streak",
    STREAK_30: "30-day logging streak"
  },
  NUTRITION: {
    PROTEIN_TARGET: "Hit protein target",
    BALANCED_DAY: "Balanced macro day",
    VEGGIE_MASTER: "5+ vegetable servings"
  },
  HYDRATION: {
    WATER_GOAL: "Daily water goal achieved",
    HYDRATION_WEEK: "Week of proper hydration"
  }
};
```

#### Weekly Challenges
- **Rotating Challenges**: Different focus each week
- **Progress Tracking**: Visual progress indicators
- **Reward System**: Achievement badges and notifications

### 4. Smart Features

#### AI Recommendation Engine
```javascript
// Nutrition gap analysis and food suggestions
const generateRecommendations = (userProfile, recentMeals, nutritionGaps) => {
  return {
    proteinSuggestions: recommendProteinSources(nutritionGaps.protein),
    fiberSuggestions: recommendFiberSources(nutritionGaps.fiber),
    mealTiming: analyzeMealTiming(recentMeals),
    balanceImprovements: suggestMacroBalance(userProfile, recentMeals)
  };
};
```

#### Meal Templates
- **Template Creation**: Save frequent meal combinations
- **Quick Logging**: One-tap meal entry
- **Nutritional Profiles**: Pre-calculated nutrition for templates
- **Customization**: Modify template portions and ingredients

### 5. Data Management

#### Export Capabilities
- **JSON Format**: Complete data backup with structure preservation
- **CSV Format**: Spreadsheet-compatible nutrition logs
- **Text Summaries**: Human-readable progress reports
- **Photo Archives**: Meal photo collections with metadata

#### Import Functionality
- **Backup Restoration**: Full data recovery from JSON exports
- **Food Database Import**: Custom food additions via CSV
- **Template Sharing**: Import meal templates from other users

---

## Technical Implementation

### State Management

#### Local State Pattern
```jsx
// Component-level state for UI interactions
const [selectedFood, setSelectedFood] = useState(null);
const [searchQuery, setSearchQuery] = useState('');
const [loading, setLoading] = useState(false);
```

#### Global State via Context
```jsx
// Theme and user preferences
const ThemeContext = createContext({
  palette: 'default',
  setPalette: () => {},
  isDarkMode: false,
  toggleDarkMode: () => {}
});
```

### Data Persistence

#### AsyncStorage Structure
```javascript
// Storage keys and data structure
const STORAGE_KEYS = {
  FOODS: '@foods',
  MEALS: '@meals', 
  USER_PROFILE: '@userProfile',
  ACHIEVEMENTS: '@achievements',
  TEMPLATES: '@mealTemplates',
  SETTINGS: '@appSettings'
};

// Data format examples
const foodEntry = {
  id: 'food_001',
  name: 'Chicken Breast',
  nutritionPer100g: {
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    fiber: 0,
    sugar: 0
  },
  category: 'Meat & Poultry',
  isCustom: false
};

const mealEntry = {
  id: 'meal_001',
  date: '2025-10-09',
  type: 'lunch',
  foods: [
    { foodId: 'food_001', quantity: 150, unit: 'grams' }
  ],
  totalNutrition: { /* calculated values */ },
  photo: 'path/to/photo.jpg',
  timestamp: '2025-10-09T12:30:00Z'
};
```

#### Supabase Integration
```javascript
// Database operations with error handling
const saveMealToSupabase = async (mealData) => {
  try {
    const { data, error } = await supabase
      .from('meals')
      .insert([{
        user_id: user.id,
        date: mealData.date,
        meal_type: mealData.type,
        foods: mealData.foods,
        total_calories: mealData.totalNutrition.calories,
        created_at: new Date().toISOString()
      }]);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving meal:', error);
    throw error;
  }
};
```

### Performance Optimizations

#### Image Handling
```javascript
// Optimized photo capture and storage
const capturePhoto = async () => {
  const photo = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8, // Compress to reduce storage
  });
  
  // Store locally and optionally sync to cloud
  const localPath = await FileSystem.moveAsync({
    from: photo.uri,
    to: `${FileSystem.documentDirectory}meals/${Date.now()}.jpg`
  });
  
  return localPath;
};
```

#### Chart Rendering
```javascript
// Efficient data processing for charts
const processChartData = useMemo(() => {
  return meals
    .filter(meal => isWithinTimeRange(meal.date, timeRange))
    .reduce((acc, meal) => {
      // Aggregate nutrition data efficiently
      acc.calories += meal.totalNutrition.calories;
      acc.protein += meal.totalNutrition.protein;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
}, [meals, timeRange]);
```

---

## Database Schema

### AsyncStorage Schema

#### Foods Collection
```typescript
interface Food {
  id: string;
  name: string;
  nutritionPer100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
  };
  category: string;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
}
```

#### Meals Collection
```typescript
interface Meal {
  id: string;
  date: string; // YYYY-MM-DD format
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: Array<{
    foodId: string;
    quantity: number;
    unit: string;
  }>;
  totalNutrition: NutritionProfile;
  photo?: string;
  timestamp: string;
}
```

#### User Profile
```typescript
interface UserProfile {
  id: string;
  goals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    water: number; // in ml
  };
  preferences: {
    theme: string;
    units: 'metric' | 'imperial';
    notifications: boolean;
  };
  stats: {
    totalMealsLogged: number;
    currentStreak: number;
    longestStreak: number;
    joinDate: string;
  };
}
```

### Supabase Schema

#### Tables Structure
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Foods table
CREATE TABLE foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name VARCHAR NOT NULL,
  calories_per_100g DECIMAL(6,2),
  protein_per_100g DECIMAL(5,2),
  carbs_per_100g DECIMAL(5,2),
  fat_per_100g DECIMAL(5,2),
  fiber_per_100g DECIMAL(5,2),
  sugar_per_100g DECIMAL(5,2),
  category VARCHAR,
  is_custom BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meals table
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  date DATE NOT NULL,
  meal_type VARCHAR NOT NULL,
  foods JSONB NOT NULL,
  total_calories DECIMAL(7,2),
  total_protein DECIMAL(6,2),
  total_carbs DECIMAL(6,2),
  total_fat DECIMAL(6,2),
  photo_url VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Water entries table
CREATE TABLE water_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  amount INTEGER NOT NULL, -- in ml
  date DATE NOT NULL, -- ⚠️ Required field causing migration errors
  time TIME DEFAULT CURRENT_TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id),
  name VARCHAR(255),
  height INTEGER, -- in cm
  weight DECIMAL(5,2), -- in kg
  age INTEGER,
  gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
  activity_level VARCHAR(20) CHECK (activity_level IN (
    'sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'
  )), -- ⚠️ App uses different values causing constraint violations
  goal VARCHAR(20) CHECK (goal IN ('lose_weight', 'maintain_weight', 'gain_weight')),
  daily_calorie_target INTEGER,
  daily_protein_target DECIMAL(8,2),
  daily_carbs_target DECIMAL(8,2),
  daily_fat_target DECIMAL(8,2),
  daily_water_target INTEGER DEFAULT 2000, -- ⚠️ App expects 'dailyWaterGoalMl'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements table
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  achievement_type VARCHAR NOT NULL,
  achievement_key VARCHAR NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_type, achievement_key)
);
```

### 🍎 **Comprehensive Food Database**

The application now includes a comprehensive food database with accurate nutritional information:

#### Food Categories Covered:
- **Indian Foods**: Idli, Dosa, Appam, Chapati, Paratha, Naan
- **Rice & Grains**: Basmati Rice, Brown Rice, Quinoa, Oats  
- **Proteins**: Eggs, Chicken, Fish, Paneer, Tofu
- **Legumes & Pulses**: Dal, Chickpeas, Black Beans, Kidney Beans
- **Vegetables**: Potato, Sweet Potato, Broccoli, Spinach, Carrot, Tomato
- **Fruits**: Apple, Banana, Orange, Mango, Grapes
- **Nuts & Seeds**: Almonds, Walnuts, Peanuts, Cashews
- **Dairy**: Milk, Yogurt, Cheese
- **Oils & Fats**: Olive Oil, Coconut Oil, Ghee, Butter

#### Nutritional Data Included:
- **Macronutrients**: Calories, Protein, Carbohydrates, Fat
- **Micronutrients**: Fiber, Sugar, Sodium
- **Serving Sizes**: Realistic portion sizes for accurate tracking
- **Scientific Accuracy**: All values based on USDA and reliable nutritional databases

#### Implementation:
- **Frontend**: `data/foodDatabase.jsx` - 40+ food items with complete nutritional profiles
- **Backend**: `database/schema.sql` - Synchronized INSERT statements for initial database population
- **Format**: All values per 100g with appropriate serving size recommendations

This comprehensive database ensures users can accurately track their nutrition across a wide variety of foods commonly consumed in Indian and international diets.

### 🛠️ **Database Management Tools**

The project includes comprehensive database management and troubleshooting tools:

#### Database Files:
- **`database/schema.sql`**: Complete database schema with all tables and initial data
- **`database/migration_update_foods.sql`**: Migration script to update existing databases with new food data
- **`database/verify_database.sql`**: Diagnostic script to verify database setup and identify issues
- **`database/DATABASE_SETUP_GUIDE.md`**: Comprehensive troubleshooting guide with solutions for common issues

#### Key Features:
- **Automated Validation**: Scripts to verify table structure and data integrity
- **Migration Support**: Safe updates for existing databases
- **Constraint Checking**: Validates activity levels, goals, and data types
- **Performance Optimization**: Includes query optimization recommendations
- **Error Diagnostics**: Specific solutions for common database errors

#### Usage:
1. **New Setup**: Run `schema.sql` for fresh database installation
2. **Existing Database**: Run `migration_update_foods.sql` to update food data
3. **Troubleshooting**: Run `verify_database.sql` to diagnose issues
4. **Support**: Refer to `DATABASE_SETUP_GUIDE.md` for detailed solutions

#### ⚠️ **Critical Schema Issues**
The current database schema has several mismatches with the application code:

1. **Water Entries**: Migration fails because date field is required but not always provided
2. **Activity Levels**: App uses values like 'light', 'moderate' but database expects 'lightly_active', 'moderately_active'
3. **Column Names**: App expects `dailyWaterGoalMl` but database has `daily_water_target`

**See Database Troubleshooting Guide section for detailed fixes.**

---

## Component Documentation

### Chart Components

#### ProgressRing Component
```jsx
/**
 * Circular progress ring with multiple metrics
 * @param {Array} progress - Array of progress objects
 * @param {number} size - Ring diameter in pixels
 * @param {number} strokeWidth - Ring thickness
 * @param {boolean} showLabels - Display progress labels
 */
const ProgressRing = ({ 
  progress, 
  size = 200, 
  strokeWidth = 12, 
  showLabels = true 
}) => {
  // Implementation with SVG circles and animations
};

// Usage example
<ProgressRing
  progress={[
    { value: 1200, target: 2000, color: '#FF6B6B', label: 'Calories' },
    { value: 80, target: 150, color: '#4ECDC4', label: 'Protein' }
  ]}
  size={250}
  strokeWidth={15}
/>
```

#### DailyCalorieChart Component
```jsx
/**
 * Line chart showing calorie consumption throughout the day
 * @param {Array} data - Hourly calorie data
 * @param {string} timeRange - Display range (day/week/month)
 * @param {Function} onDataPointPress - Callback for data interaction
 */
const DailyCalorieChart = ({ data, timeRange, onDataPointPress }) => {
  // Chart implementation with react-native-chart-kit
};
```

### Form Components

#### EnhancedFoodSearch Component
```jsx
/**
 * Advanced food search with filtering and sorting
 * @param {Array} foods - Available foods database
 * @param {Function} onFoodSelect - Food selection callback
 * @param {Object} filters - Active search filters
 * @param {string} placeholder - Search input placeholder
 */
const EnhancedFoodSearch = ({ 
  foods, 
  onFoodSelect, 
  filters = {}, 
  placeholder = "Search foods..." 
}) => {
  // Search logic with debouncing and filtering
};
```

#### BarcodeScanner Component
```jsx
/**
 * Barcode scanning interface with camera integration
 * @param {Function} onBarcodeScanned - Scan result callback
 * @param {Function} onClose - Close scanner callback
 * @param {boolean} isVisible - Scanner visibility state
 */
const BarcodeScanner = ({ onBarcodeScanned, onClose, isVisible }) => {
  // Camera implementation with barcode recognition
};
```

### UI Components

#### ThemeProvider Component
```jsx
/**
 * Global theme context provider
 * @param {ReactNode} children - Child components
 * @param {string} initialPalette - Starting color palette
 */
const ThemeProvider = ({ children, initialPalette = 'default' }) => {
  const [palette, setPalette] = useState(initialPalette);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const themeValue = {
    palette,
    setPalette,
    isDarkMode,
    toggleDarkMode: () => setIsDarkMode(!isDarkMode),
    colors: getColorPalette(palette, isDarkMode)
  };
  
  return (
    <ThemeContext.Provider value={themeValue}>
      {children}
    </ThemeContext.Provider>
  );
};
```

---

## API & Data Flow

### Data Flow Architecture

#### Meal Logging Flow
```
1. User Input (Search/Scan/Template)
   ↓
2. Food Selection & Quantity Input
   ↓
3. Nutrition Calculation (utils/nutritionCalculator.js)
   ↓
4. Local Storage Update (AsyncStorage)
   ↓
5. Supabase Sync (Background)
   ↓
6. UI State Update & Progress Ring Refresh
   ↓
7. Achievement Check & Notification
```

#### Data Synchronization
```javascript
// Bidirectional sync between local and remote storage
const syncData = async () => {
  try {
    // Push local changes to Supabase
    const localMeals = await getLocalMeals();
    const unsyncedMeals = localMeals.filter(meal => !meal.synced);
    
    for (const meal of unsyncedMeals) {
      await saveMealToSupabase(meal);
      await markMealAsSynced(meal.id);
    }
    
    // Pull remote changes
    const remoteMeals = await fetchRemoteMeals();
    await updateLocalMeals(remoteMeals);
    
  } catch (error) {
    console.error('Sync error:', error);
    // Implement retry logic
  }
};
```

### API Endpoints (Supabase)

#### Authentication
```javascript
// User registration and login
const authAPI = {
  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    return { data, error };
  },
  
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  }
};
```

#### Data Operations
```javascript
// CRUD operations for meals
const mealsAPI = {
  create: async (mealData) => {
    return await supabase.from('meals').insert([mealData]);
  },
  
  read: async (userId, dateRange) => {
    return await supabase
      .from('meals')
      .select('*')
      .eq('user_id', userId)
      .gte('date', dateRange.start)
      .lte('date', dateRange.end);
  },
  
  update: async (mealId, updates) => {
    return await supabase
      .from('meals')
      .update(updates)
      .eq('id', mealId);
  },
  
  delete: async (mealId) => {
    return await supabase
      .from('meals')
      .delete()
      .eq('id', mealId);
  }
};
```

---

## Known Issues & Solutions

### Current Issues

#### 1. **RESOLVED - Application Crashes** ✅
**Issue**: Missing function imports causing immediate application crashes

**Status**: ✅ **FIXED** - Added missing imports for getMeals and getProfile

**Solution Applied**: Added `import { getMeals, getProfile } from '../utils/macrooDatabase';` to `components/DailyNutritionSummary.jsx`

**Impact**: Primary dashboard component now renders successfully

#### 2. **RESOLVED - Database Constraint Violations** ✅
**Issue**: Critical database constraint violations in user profile operations

**Status**: ✅ **FIXED** - Added value mapping functions for database constraints

**Solution Applied**: 
- Added activity level mapping: `'light' → 'lightly_active'`, `'moderate' → 'moderately_active'`
- Added goal mapping: `'lose' → 'lose_weight'`, `'maintain' → 'maintain_weight'`, `'gain' → 'gain_weight'`
- Updated `utils/macrooDatabase.jsx` saveUserProfile method with proper value mapping

**Remaining Issues**:
- Water entry creation (missing `date` field) - **Still needs fix**
- Data migration from AsyncStorage to Supabase - **Still needs fix**

**Resolved Errors**:
```sql
-- ✅ FIXED: User profile constraint violations
-- Activity level mapping now correctly converts app values to DB constraints
-- Goal mapping now correctly converts app values to DB constraints
```

**Outstanding Errors**:
```sql
-- ⚠️ STILL NEEDS FIX: Water entries missing required date field
ERROR: null value in column "date" of relation "water_entries" violates not-null constraint
```

**Root Causes**:
- `macrooMigration.jsx` not populating required date field for water entries
- Activity level values not matching database CHECK constraints
- Mismatch between app code expecting `dailyWaterGoalMl` and database schema using `daily_water_target`

**Immediate Fix Required**:
- Update water entry migration to include proper date handling
- Standardize activity level values between app and database
- Align column naming conventions across app and schema

#### 2. Metro Bundler `<anonymous>` File Errors
**Issue**: Repeated ENOENT errors referencing `<anonymous>` file paths during development.

**Status**: ⚠️ Ongoing - App functions normally but logs show errors

**Impact**: 
- No functional impact on app performance
- Development console shows repeated error messages
- May indicate underlying source map or debugging issues

**Workarounds**:
- Errors don't affect app functionality
- Use `npx expo start -c` to clear cache
- Consider using tunnel mode for testing: `npx expo start --tunnel -c`

**Investigation Notes**:
- Related to Metro's source mapping and error reporting system
- May be linked to recent React Native Web integration fixes
- Appears after successful bundling, suggesting runtime debugging issue

#### 3. Package Version Mismatches
**Issue**: Expo SDK warns about package version incompatibilities.

**Affected Packages**:
```
expo-image@3.0.8 (expected: ~3.0.9)
react-native-worklets@0.6.0 (expected: 0.5.1)
@types/react@19.0.14 (expected: ~19.1.10)
eslint-config-expo@9.2.0 (expected: ~10.0.0)
typescript@5.8.3 (expected: ~5.9.2)
```

**Status**: ✅ Non-critical - App functions properly with current versions

**Solutions**:
- Update packages individually: `npm install package@expected-version`
- Bulk update: Review and update package.json versions
- Alternative: Create custom development client with EAS

### Database Schema Fixes Required

#### Immediate Actions Needed

**1. Fix Water Entry Migration**
```jsx
// Current problematic code in macrooMigration.jsx
const waterEntry = {
    user_id: userId,
    amount: entry.amount,
    date: entry.date,    // This might be null/undefined
    time: entry.time,
};

// Required fix
const waterEntry = {
    user_id: userId,
    amount: entry.amount,
    date: entry.date || new Date().toISOString().split('T')[0], // Ensure date is provided
    time: entry.time || new Date().toTimeString().split(' ')[0],
};
```

**2. Fix Activity Level Constraints**
```sql
-- Database expects these values:
-- 'sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'

-- App currently uses:
-- 'light', 'moderate', 'active', 'very_active'

-- Solution: Update app to use database values or update database constraints
```

**3. Fix Column Name Mismatch**
```jsx
// App expects: dailyWaterGoalMl
// Database has: daily_water_target

// Fix in macrooDatabase.jsx and related files
const profileData = {
    daily_water_target: profile.dailyWaterGoal || 2000, // Instead of dailyWaterGoalMl
};
```

### Resolved Issues

#### 1. SVG Component Import Errors ✅
**Previously**: Missing react-native-svg imports causing ReferenceError crashes
**Resolution**: Added proper imports in DailyNutritionSummary.jsx and other components
```jsx
import Svg, { Circle } from 'react-native-svg';
```

#### 2. Dynamic require() Statements ✅
**Previously**: Runtime errors from dynamic require() calls
**Resolution**: Converted to proper ES6 imports
```jsx
// Before (problematic)
const { saveMeal } = require('../utils/supabaseStorage');

// After (fixed)
import { saveMeal } from '../utils/supabaseStorage';
```

#### 3. Supabase Data Field Mismatches ✅
**Previously**: Inconsistent field references (timestamp vs date)
**Resolution**: Standardized data field access patterns
```jsx
// Standardized field access
const mealDate = meal.date; // Instead of meal.timestamp
const calories = meal.calories; // Instead of meal.nutrients.calories
```

### Prevention Strategies

#### Code Quality Measures
- **PropTypes Validation**: Runtime type checking for all components
- **Error Boundaries**: Graceful error handling and user feedback
- **Consistent Import Patterns**: ES6 imports throughout codebase
- **Data Validation**: Input sanitization and type checking

#### Development Practices
- **Regular Testing**: Test on both web and mobile platforms
- **Cache Management**: Regular Metro cache clearing during development
- **Version Control**: Pin dependency versions for stability
- **Documentation**: Keep component and API documentation updated

### Database Troubleshooting Guide

#### **CRITICAL RUNTIME ERRORS** ⚠️

**1. ✅ FIXED - Missing Function Imports & Water Entry Validation**
**Error**: `getMeals is not a function (it is undefined)` / `null value in column "amount"`

**Location**: `components/DailyNutritionSummary.jsx` and `utils/supabaseStorage.jsx`

**Solution Applied**:
```jsx
// Corrected import to use supabaseStorage wrapper functions
import { getMeals, getProfile } from '../utils/supabaseStorage';

// Added validation in saveWaterEntry
if (!waterEntry.amount || isNaN(waterEntry.amount) || waterEntry.amount <= 0) {
    throw new Error('Invalid water amount. Must be a positive number.');
}
const supabaseWater = {
    user_id: DEMO_USER_ID,
    amount: parseInt(waterEntry.amount), // Ensure it's an integer
    date: waterEntry.date || new Date().toISOString().split('T')[0], // Default to today
    time: waterEntry.time || new Date().toTimeString().split(' ')[0],
};
```

**Performance Optimizations**:
- Fixed getMeals() call to pass date parameter: `getMeals(date)` instead of getting all meals and filtering
- Updated water entries loading to use date parameter: `getWaterEntries(todayDate)` for better performance
- Improved data flow and component refresh mechanisms

**Status**: ✅ **RESOLVED** - All critical issues fixed, app should function properly

**2. ✅ FIXED - User Profile Constraint Violations**
**Error**: `new row for relation "user_profiles" violates check constraint "user_profiles_activity_level_check"`

**Cause**: App values didn't match database constraint values

**Solution Applied**:
```jsx
// Added to utils/macrooDatabase.jsx in saveUserProfile method
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

const mapGoal = (appGoal) => {
    const mapping = {
        'lose': 'lose_weight',
        'maintain': 'maintain_weight',
        'gain': 'gain_weight'
    };
    return mapping[appGoal] || 'maintain_weight';
};
```

**Status**: ✅ **RESOLVED** - Profile saving now works correctly

#### Water Entry Errors
**Error**: `null value in column "date" of relation "water_entries" violates not-null constraint`

**Cause**: Migration code not properly handling missing or null date values

**Fix Steps**:
1. Update `utils/macrooMigration.jsx` in `migrateWaterEntries()` method
2. Add null checking and default date assignment:
```jsx
const waterEntry = {
    user_id: userId,
    amount: entry.amount,
    date: entry.date || new Date().toISOString().split('T')[0],
    time: entry.time || new Date().toTimeString().split(' ')[0],
};
```

#### User Profile Constraint Violations
**Error**: `new row for relation "user_profiles" violates check constraint "user_profiles_activity_level_check"`

**Cause**: App uses activity level values that don't match database CHECK constraints

**Valid Database Values**:
- `sedentary`
- `lightly_active` 
- `moderately_active`
- `very_active`
- `extremely_active`

**Fix Steps**:
1. Update activity level mapping in user profile forms
2. Add validation before database insertion:
```jsx
const mapActivityLevel = (appValue) => {
    const mapping = {
        'light': 'lightly_active',
        'moderate': 'moderately_active', 
        'active': 'very_active'
    };
    return mapping[appValue] || 'sedentary';
};
```

#### Column Name Mismatches
**Error**: `Could not find the 'dailyWaterGoalMl' column of 'user_profiles' in the schema cache`

**Cause**: Inconsistent column naming between app code and database schema

**Fix Steps**:
1. Standardize column names across `utils/macrooDatabase.jsx` and `utils/supabaseStorage.jsx`
2. Use database column names: `daily_water_target` instead of `dailyWaterGoalMl`
3. Update all profile save/load operations

---

## Development Workflow

### Setup & Environment

#### Initial Setup
```powershell
# Clone and install dependencies
git clone <repository-url>
cd diet-tracker-app
npm install

# Start development server
npm start

# Platform-specific commands
npm run web      # Web development
npm run android  # Android development
npm run ios      # iOS development
```

#### Environment Variables
```env
# .env file structure
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development Commands

#### Common Tasks
```powershell
# Clear Metro cache and restart
npx expo start -c

# Tunnel mode for network issues
npx expo start --tunnel

# Reset project (clears cache and reinstalls)
npm run reset-project

# Linting and code quality
npm run lint
```

#### Debugging Tools
```powershell
# Enable debugging
npx expo start --dev-client

# Web debugging
npx expo start --web --dev

# Production build testing
npx expo build:web
```

### Code Standards

#### Component Structure
```jsx
// Standard component template
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

const ComponentName = ({ prop1, prop2, onAction }) => {
  const [localState, setLocalState] = useState(null);
  
  useEffect(() => {
    // Component initialization
  }, []);
  
  const handleAction = () => {
    onAction?.(localState);
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{prop1}</Text>
    </View>
  );
};

ComponentName.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number,
  onAction: PropTypes.func
};

ComponentName.defaultProps = {
  prop2: 0,
  onAction: null
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  },
  text: {
    fontSize: 16,
    color: '#333'
  }
});

export default ComponentName;
```

#### File Naming Conventions
- **Components**: PascalCase (`MyComponent.jsx`)
- **Utilities**: camelCase (`dataUtils.js`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS.js`)
- **Screens**: PascalCase matching route (`HomeScreen.jsx`)

### Version Control

#### Git Workflow
```bash
# Feature development
git checkout -b feature/new-feature
git add .
git commit -m "feat: add new feature description"
git push origin feature/new-feature

# Bug fixes
git checkout -b fix/issue-description
git add .
git commit -m "fix: resolve issue description"
git push origin fix/issue-description
```

#### Commit Message Standards
- `feat: ` New features
- `fix: ` Bug fixes
- `docs: ` Documentation updates
- `style: ` Code formatting
- `refactor: ` Code restructuring
- `test: ` Test additions
- `chore: ` Maintenance tasks

---

## Testing & Quality Assurance

### Testing Strategy

#### Manual Testing Checklist
- [ ] **Meal Logging**: Add, edit, delete meals across all input methods
- [ ] **Search Functionality**: Text search, filtering, sorting accuracy
- [ ] **Barcode Scanning**: Product recognition and data accuracy
- [ ] **Progress Tracking**: Accurate nutrition calculations and visualizations
- [ ] **Export/Import**: Data integrity across all export formats
- [ ] **Achievement System**: Proper unlock conditions and notifications
- [ ] **Cross-Platform**: Web and mobile functionality parity

#### Device Testing
- **iOS Devices**: iPhone (various sizes), iPad
- **Android Devices**: Phone and tablet form factors
- **Web Browsers**: Chrome, Firefox, Safari, Edge
- **Network Conditions**: Offline mode, slow connections

### Quality Metrics

#### Performance Benchmarks
- **App Startup**: < 3 seconds to interactive
- **Meal Logging**: < 1 second for food search results
- **Chart Rendering**: < 500ms for complex visualizations
- **Data Sync**: < 5 seconds for full data synchronization

#### Code Quality Standards
- **PropTypes Coverage**: 100% of components have type validation
- **Error Handling**: All async operations wrapped in try-catch
- **Documentation**: JSDoc comments for complex functions
- **Accessibility**: Screen reader support and proper contrast ratios

### Bug Reporting Template
```markdown
## Bug Report

**Description**: Brief description of the issue

**Steps to Reproduce**:
1. Step one
2. Step two
3. Step three

**Expected Behavior**: What should happen

**Actual Behavior**: What actually happens

**Environment**:
- Platform: iOS/Android/Web
- Device: Device model
- App Version: Version number
- OS Version: Operating system version

**Screenshots**: Attach relevant screenshots

**Additional Context**: Any other relevant information
```

---

## Deployment & Distribution

### Build Process

#### Web Deployment
```powershell
# Build for web production
npx expo build:web

# Deploy to hosting service (example with Netlify)
npm install -g netlify-cli
netlify deploy --prod --dir=web-build
```

#### Mobile App Distribution

##### Development Builds
```powershell
# Create development build for testing
eas build --profile development --platform all

# Install on device
eas build:run --platform ios
eas build:run --platform android
```

##### Production Builds
```powershell
# Configure app.json for production
{
  "expo": {
    "name": "Diet Tracker Pro",
    "slug": "diet-tracker-pro",
    "version": "1.0.0",
    "platforms": ["ios", "android", "web"]
  }
}

# Create production builds
eas build --profile production --platform all

# Submit to app stores
eas submit --platform ios
eas submit --platform android
```

### Release Management

#### Version Strategy
- **Major**: Breaking changes (1.0.0 → 2.0.0)
- **Minor**: New features (1.0.0 → 1.1.0)
- **Patch**: Bug fixes (1.0.0 → 1.0.1)

#### Release Checklist
- [ ] Update version numbers in package.json and app.json
- [ ] Update CHANGELOG.md with new features and fixes
- [ ] Run full test suite on all platforms
- [ ] Create release builds and test thoroughly
- [ ] Update documentation for new features
- [ ] Tag release in git repository
- [ ] Deploy to production environments
- [ ] Monitor for post-release issues

### Environment Configuration

#### Development Environment
```json
{
  "expo": {
    "slug": "diet-tracker-dev",
    "scheme": "diet-tracker-dev",
    "updates": {
      "enabled": true,
      "checkAutomatically": "ON_LOAD"
    }
  }
}
```

#### Production Environment
```json
{
  "expo": {
    "slug": "diet-tracker-pro",
    "scheme": "diet-tracker",
    "updates": {
      "enabled": false
    },
    "assetBundlePatterns": [
      "**/*"
    ]
  }
}
```

---

## Future Enhancements

### Short-term Improvements (Next 3 months)

#### 1. Enhanced Barcode Database
- **Integration**: Connect to FoodData Central API
- **Coverage**: Expand product database beyond current limitations
- **Accuracy**: Improve nutrition data quality and consistency

#### 2. Social Features
- **Meal Sharing**: Share meal photos and nutrition with friends
- **Community Challenges**: Group challenges and leaderboards
- **Recipe Exchange**: User-generated recipe sharing platform

#### 3. Advanced Analytics
- **Trend Analysis**: Machine learning-based pattern recognition
- **Predictive Insights**: Forecast nutrition gaps and recommendations
- **Health Integration**: Apple Health and Google Fit synchronization

### Medium-term Features (3-6 months)

#### 1. Wearable Integration
- **Activity Tracking**: Sync with fitness trackers for calorie adjustment
- **Smart Notifications**: Meal reminders based on activity patterns
- **Heart Rate Integration**: Correlate nutrition with fitness metrics

#### 2. Meal Planning System
- **Weekly Planner**: Drag-and-drop meal planning interface
- **Shopping Lists**: Auto-generated grocery lists from meal plans
- **Budget Tracking**: Cost analysis and budget-friendly alternatives

#### 3. Professional Features
- **Dietitian Mode**: Advanced tools for nutrition professionals
- **Client Management**: Multi-user support for practitioners
- **Report Generation**: Detailed client progress reports

### Long-term Vision (6+ months)

#### 1. AI-Powered Nutrition Coach
- **Personalized Recommendations**: Advanced ML algorithms for food suggestions
- **Natural Language Processing**: Voice input for meal logging
- **Computer Vision**: Automatic food recognition from photos

#### 2. Ecosystem Expansion
- **Smart Kitchen Integration**: Connect with smart scales and appliances
- **Restaurant Integration**: Partner with restaurants for menu nutrition data
- **Grocery Integration**: Direct ordering from meal plans

#### 3. Health Platform Integration
- **Medical Records**: Integration with electronic health records
- **Biomarker Tracking**: Lab result correlation with nutrition data
- **Chronic Disease Management**: Specialized tools for diabetes, heart disease

### Technical Debt & Infrastructure

#### Code Modernization
- **TypeScript Migration**: Full conversion from PropTypes to TypeScript
- **Testing Framework**: Implement Jest and React Native Testing Library
- **CI/CD Pipeline**: Automated testing and deployment workflows
- **Performance Monitoring**: Real-time app performance tracking

#### Scalability Improvements
- **Database Optimization**: Query optimization and indexing strategies
- **Caching Layer**: Redis implementation for frequently accessed data
- **CDN Integration**: Global content delivery for improved performance
- **Microservices Architecture**: Break monolithic backend into services

### User Experience Enhancements

#### Accessibility Improvements
- **Voice Navigation**: Full voice control capabilities
- **Screen Reader Optimization**: Enhanced VoiceOver and TalkBack support
- **Color Blind Support**: High contrast and alternative color schemes
- **Motor Accessibility**: Simplified gestures and larger touch targets

#### Internationalization
- **Multi-language Support**: Localization for major languages
- **Regional Food Databases**: Local food items and brands
- **Cultural Adaptations**: Region-specific nutrition guidelines
- **Currency Support**: Local pricing for premium features

---

## Conclusion

The Diet Tracker App represents a comprehensive nutrition management platform that successfully combines modern mobile development practices with user-centric design. This documentation serves as a living document that will evolve with the project, providing developers, stakeholders, and users with detailed insights into the application's architecture, features, and future direction.

### Key Achievements
- ✅ **Robust Architecture**: Scalable React Native foundation with Expo
- ✅ **Comprehensive Features**: Full nutrition tracking with gamification
- ✅ **Cross-Platform Support**: Web and mobile compatibility
- ✅ **Data Portability**: Complete export/import functionality
- ✅ **Modern UI/UX**: Intuitive interface with advanced visualizations

### Ongoing Commitment
The development team remains committed to continuous improvement, user feedback incorporation, and technical excellence. Regular updates to this documentation ensure all stakeholders have access to current and accurate project information.

---

*Last Updated: October 28, 2025*  
*Document Version: 1.5.0*  
*Next Review Date: November 28, 2025*

**Major Updates in v1.5.0:**
- **✅ COMPREHENSIVE FOOD DATABASE UPDATE**: Completely overhauled food database with accurate nutritional information
- **✅ EXPANDED NUTRITION DATA**: Added fiber, sugar, and sodium values for all food entries
- **✅ IMPROVED FOOD COVERAGE**: Expanded from 4 to 40+ food items covering all major food categories
- **✅ ACCURATE MACROS**: Updated all nutritional values with scientifically accurate data
- **✅ PROPER SERVING SIZES**: Added realistic serving size information for better portion tracking
- **✅ DATABASE SCHEMA UPDATED**: Synchronized database INSERT statements with new food data
- Includes Indian foods, grains, proteins, vegetables, fruits, nuts, dairy, and oils
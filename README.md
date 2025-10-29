# Diet Tracker App - Macroo

A comprehensive nutrition and meal tracking app built with **Expo + React Native** featuring smart recommendations, gamification, and professional data analytics.

## 🎯 Key Features

- **Smart Meal Logging**: Advanced food search, barcode scanning, meal templates
- **Profile-Based Targets**: Personalized calorie and water goals with health insights
- **Visual Progress Tracking**: Interactive charts, progress rings, macro breakdowns
- **Achievement System**: Daily streaks, weekly challenges, milestone rewards
- **Photo Documentation**: Capture meals with camera integration
- **Data Export/Backup**: JSON, CSV, and summary report generation
- **AI Recommendations**: Smart food suggestions based on nutrition gaps

## 🚀 Recent Updates (October 2025)

- ✅ **Profile Integration**: Daily calorie/water targets now sync across all screens
- ✅ **Meal Refresh**: Real-time updates when adding/editing meals
- ✅ **Consistent Defaults**: 1950 cal / 3000ml (12 glasses) recommended targets
- ✅ **Import Fixes**: Resolved SVG and component import issues
- ✅ **Database Standardization**: Unified Supabase field mappings

## �️ Quick Start

### Prerequisites
- **Node.js 18.x** (recommended for compatibility)
- **Expo CLI** latest version
- **Mobile device** with Expo Go app

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm start

# For network issues, use tunnel mode
npx expo start --tunnel -c
```

### Usage
1. **Scan QR code** with Expo Go app on your phone
2. **Web version**: Access at `http://localhost:8082`
3. **Set up profile** with your health goals and targets
4. **Start logging meals** using search, templates, or barcode scanning

## 📱 Core Functionality

### Meal Tracking
- **Food Database**: Comprehensive nutrition info (calories, protein, carbs, fat)
- **Multiple Input Methods**: Search, templates, barcode scanning
- **Photo Documentation**: Capture meal images
- **Smart Quantities**: Automatic nutrition calculations

### Progress Analytics
- **Daily Summaries**: Real-time nutrition breakdown
- **Visual Charts**: Progress rings, pie charts, trend analysis
- **Goal Tracking**: Calorie, water, and macro targets
- **Historical Data**: Weekly and monthly progress views

### Gamification
- **Achievement System**: Unlock badges for consistency and milestones
- **Weekly Challenges**: Rotating nutrition and hydration challenges
- **Streak Tracking**: Daily logging consistency rewards
- **Progress Sharing**: Export summaries and achievements

## 🏗️ Architecture

### Tech Stack
- **Framework**: Expo SDK 51 + React Native
- **Navigation**: Expo Router (file-based routing)
- **Database**: Supabase integration with local AsyncStorage
- **Charts**: React Native Chart Kit with custom components
- **Camera**: Expo Camera for barcode scanning and photos

### Project Structure
```
app/(tabs)/          # Main app screens
├── index.jsx        # Home dashboard with progress rings
├── add-meal.jsx     # Multi-mode meal logging
├── monthly.jsx      # Analytics and trends
├── profile.jsx      # User profile and settings
└── food-db.jsx      # Food database management

components/          # Reusable components
├── charts/          # Progress rings, pie charts, trend charts
├── forms/           # Food search, barcode scanner, templates
├── ui/              # Theme provider, buttons, controls
└── layout/          # Responsive layout components

utils/               # Business logic
├── achievements/    # Achievement system and challenges
├── recommendations/ # AI-powered food suggestions
├── supabaseClient.jsx # Database operations
├── storage.jsx      # Local data persistence
└── healthCalculations.js # BMI, calorie, water calculations
```

## 🎨 Features Breakdown

### Smart Recommendations
- **AI-Powered Insights**: Nutrition gap analysis and suggestions
- **Meal Timing Analysis**: Optimize eating patterns
- **Custom Macro Targets**: Based on fitness goals and profile
- **Food Recommendations**: Context-aware suggestions

### Data Management
- **Export Options**: JSON backup, CSV reports, nutrition summaries
- **Import Functionality**: Restore from backup files
- **Template System**: Save frequently eaten meal combinations
- **Photo Storage**: Meal documentation with image compression

### User Experience
- **Theme System**: Multiple color palettes with dark/light modes
- **Responsive Design**: Optimized for various screen sizes
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Performance**: Lazy loading and optimized rendering

## � Troubleshooting

### Common Issues
- **Connection Problems**: Use `npx expo start --tunnel -c` for network issues
- **Cache Issues**: Clear Metro cache with `npx expo start -c`
- **Permission Errors**: Camera/photo permissions required for full functionality

### Package Compatibility
- Some dependency version mismatches are present but non-critical
- App functions normally despite Metro bundler warning logs
- Use Node.js 18.x for optimal compatibility

## 📚 Additional Resources

- **Complete Documentation**: See [DOCUMENTATION.md](./DOCUMENTATION.md) for technical details
- **Database Setup**: See [database/DATABASE_SETUP_GUIDE.md](./database/DATABASE_SETUP_GUIDE.md)
- **Error Handling**: See [ERROR_HANDLING_DOCS.md](./ERROR_HANDLING_DOCS.md)

---

**Perfect for users who want comprehensive nutrition management beyond basic calorie counting!**

Built with ❤️ using Expo and React Native

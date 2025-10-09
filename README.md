# Diet Tracker App - Enhanced Edition

A comprehensive calorie & meal tracker built with Expo + React Native (Expo Router) featuring advanced nutrition tracking, gamification, and smart recommendations.

## � Recent Updates & Bug Fixes

### Latest Fixes (October 2025)
- ✅ **SVG Import Fixes**: Resolved missing react-native-svg component imports in DailyNutritionSummary
- ✅ **Import System Cleanup**: Converted dynamic require() statements to proper ES6 imports
- ✅ **Supabase Integration**: Standardized data field mappings for consistent database operations
- ✅ **Web Compatibility**: Enhanced React Native Web support with proper component imports
- ✅ **Error Handling**: Improved error boundaries and user feedback systems
- ⚠️ **Metro Bundler Logs**: `<anonymous>` file errors persist but don't affect functionality

### 📋 Complete Documentation
**See [DOCUMENTATION.md](./DOCUMENTATION.md) for comprehensive project details including architecture, API references, database schema, and development workflows.**

## 🚀 Major Enhancement Categories

This app has been completely redesigned with 6 major enhancement categories:

### 1. ✅ **File Standardization & Organization**
- All files converted to `.jsx` format with proper component structure
- Organized component hierarchy: `charts/`, `forms/`, `ui/`
- Comprehensive PropTypes validation system
- Enhanced error handling throughout the application

### 2. ✅ **Advanced Visualizations**
- **Progress Rings**: Daily macro targets vs consumed with visual indicators
- **Weekly/Monthly Charts**: Trend analysis showing progress over time
- **Interactive Tooltips**: Detailed breakdown in chart visualizations
- **Macro Pie Charts**: Nutritional balance visualization
- **Goal Tracking**: Visual progress indicators for all targets

### 3. ✅ **Smart Features**
- **Food Search & Filtering**: Advanced search with sorting capabilities
- **Meal Templates**: Save and reuse favorite meal combinations
- **Photo Integration**: Capture photos of meals for documentation
- **Barcode Scanning**: Scan product barcodes for instant nutrition data
- **Export/Backup**: Comprehensive data management and sharing

### 4. ✅ **AI-Powered Nutrition Engine**
- **Meal Timing Analysis**: Insights into eating patterns and optimization
- **Custom Macro Targets**: Based on fitness goals and user profile
- **Food Recommendation System**: AI-driven suggestions based on nutrition gaps
- **Personalized Insights**: Smart recommendations for nutritional improvement

### 5. ✅ **Gamification System**
- **Achievement System**: 10+ achievements across consistency, hydration, nutrition
- **Weekly Challenges**: Rotating challenges (hydration, protein, vegetables)
- **Progress Tracking**: Milestone rewards and streak tracking
- **Progress Sharing**: Export summaries and progress images

### 6. ✅ **Enhanced User Experience**
- **Multiple Input Modes**: Search, Templates, Barcode scanning
- **Smart Recommendations**: Context-aware food suggestions
- **Data Portability**: Complete export/import functionality
- **Professional UI**: Polished interface with comprehensive error handling

## 📱 Key Features

### Core Functionality
- **Food Database**: Maintain detailed nutrition information (calories, protein, carbs, fat per 100g)
- **Meal Logging**: Track meals with quantities and automatic nutrition calculation
- **Water Tracking**: Monitor daily hydration with progress indicators
- **Daily Summaries**: Comprehensive nutrition breakdown with visual charts

### Advanced Features
- **Photo Documentation**: Capture and store meal photos
- **Barcode Integration**: Scan products for instant nutrition lookup
- **Template System**: Save frequently eaten meals for quick logging
- **Search & Filter**: Advanced food search with multiple sorting options
- **Achievement System**: Gamified progress tracking with rewards
- **Weekly Challenges**: Rotating nutrition and consistency challenges
- **Export/Backup**: JSON, CSV, and summary report generation
- **Smart Recommendations**: AI-powered food suggestions based on nutrition gaps

### Visualization & Analytics
- **Progress Rings**: Visual macro target tracking
- **Trend Charts**: Weekly and monthly progress analysis
- **Pie Charts**: Macro distribution visualization
- **Interactive Tooltips**: Detailed data breakdowns
- **Achievement Progress**: Visual milestone tracking

## 🛠️ Installation & Setup

### Requirements
- **Node.js**: 18.x recommended (18.18.0 tested) - Required for optimal compatibility
- **Expo CLI**: Latest version for SDK 54 compatibility
- **Mobile Device**: iOS/Android with Expo Go app installed
- **Web Browser**: For web version testing and development

### Key Dependencies & Features
The app includes these essential dependencies for full functionality:
- `react-native-svg` - Progress rings and custom graphics (recently fixed imports)
- `@supabase/supabase-js` - Database integration with standardized field mapping
- `expo-camera` - Camera functionality for meal photos
- `expo-image-picker` - Image selection capabilities
- `expo-document-picker` - File import functionality
- `expo-file-system` - File operations and storage
- `expo-sharing` - Data export and sharing
- `react-native-chart-kit` - Advanced chart visualizations
- `prop-types` - Runtime type validation

### Quick Start

1. **Install Dependencies**
   ```powershell
   npm install
   ```

2. **Start Development Server**
   ```powershell
   # Recommended command (clears cache and handles port conflicts)
   npm start
   
   # Alternative for mobile testing (avoids network issues)
   npx expo start --tunnel -c
   
   # For same-network testing
   npx expo start -c
   ```

3. **Run on Device**
   - Install **Expo Go** app on your mobile device
   - Scan the QR code from the Metro bundler
   - **Web Version**: Access at `http://localhost:8082` (or assigned port)
   - If connection fails, use `--tunnel` mode

### Camera Permissions
The app requires camera and photo library permissions for:
- Meal photo capture
- Barcode scanning functionality
- Photo import from gallery

Permissions are requested automatically when accessing camera features.

## 🎯 Usage Guide

### Adding Meals
1. **Search Mode**: Use the enhanced search to find foods with filtering options
2. **Template Mode**: Quick access to saved meal combinations
3. **Barcode Mode**: Scan product barcodes for instant nutrition lookup
4. **Photo Documentation**: Capture meal photos for visual tracking

### Viewing Progress
- **Home Screen**: Daily progress rings showing macro targets vs consumed
- **Charts**: Interactive visualizations with detailed tooltips  
- **Achievements**: Track your consistency and nutrition milestones
- **Monthly View**: Analyze trends and patterns over time

### Data Management
- **Export Options**: JSON backup, CSV reports, nutrition summaries
- **Import Data**: Restore from backup files
- **Templates**: Save frequently eaten meals
- **Achievements**: Unlock rewards for consistent tracking

### Gamification Features
- **Daily Streaks**: Track consecutive days of logging
- **Weekly Challenges**: Rotating challenges for hydration, nutrition, consistency
- **Achievement System**: Unlock badges for milestones
- **Progress Sharing**: Export summaries to share your progress

## 🏗️ Architecture Overview

### Design Patterns
- **Expo Router**: File-based routing system for navigation
- **Component Architecture**: Modular design with reusable components
- **Theme System**: Dynamic theming with palette switching
- **Local-First**: All data stored on device using AsyncStorage
- **Type Safety**: PropTypes validation throughout the application
- **Error Handling**: Comprehensive error boundaries and user feedback

### Data Flow
- **Storage Layer**: Enhanced AsyncStorage with error handling
- **Recommendation Engine**: AI-powered nutrition analysis
- **Achievement System**: Progress tracking with milestone detection  
- **Export System**: Multiple format support (JSON, CSV, Text)

### Performance Features
- **Lazy Loading**: Components loaded on demand
- **Optimized Charts**: Efficient rendering with react-native-chart-kit
- **Image Optimization**: Compressed photos with expo-image
- **Background Processing**: Async operations for smooth UX

---

## 🚀 What's New in Enhanced Edition

This version represents a complete transformation of the original diet tracker with:

- **6x More Features**: From basic tracking to comprehensive nutrition management
- **Professional UI**: Polished interface with advanced visualizations
- **Smart Technology**: AI recommendations and pattern analysis  
- **Gamification**: Achievement system with weekly challenges
- **Data Portability**: Complete export/import functionality
- **Camera Integration**: Photo documentation and barcode scanning
- **Type Safety**: Comprehensive validation and error handling

Perfect for users who want more than just basic calorie counting - this is a complete nutrition management platform!

## 📁 Project Structure

### Core App Files
- `app/(tabs)/_layout.jsx` — Enhanced tab layout with new navigation
- `app/(tabs)/index.jsx` — Home screen with progress rings, charts, and insights
- `app/(tabs)/add-meal.jsx` — Multi-mode meal logging (Search/Templates/Barcode)
- `app/(tabs)/monthly.jsx` — Advanced analytics with trend charts
- `app/(tabs)/food-db.jsx` — Enhanced food database management
- `app/(tabs)/profile.jsx` — Comprehensive profile with export/backup functionality

### Component Architecture
```
components/
├── charts/
│   ├── DailyCalorieChart.jsx     # Enhanced with interactive tooltips
│   ├── MacroRatioPieChart.jsx    # Nutrition distribution visualization
│   ├── ProgressRing.jsx          # Single & multi-metric progress rings
│   └── WeeklyMonthlyChart.jsx    # Trend analysis charts
├── forms/
│   ├── BarcodeScanner.jsx        # Product barcode scanning
│   ├── ExportBackupManager.jsx   # Data management interface
│   ├── FoodSearchForm.jsx        # Advanced food search & filtering
│   ├── MealPhotoCapture.jsx      # Photo capture functionality
│   └── MealTemplateForm.jsx      # Template management system
└── ui/
    ├── PaletteSwitcher.jsx       # Theme palette selection
    ├── PrimaryButton.jsx         # Enhanced button components
    ├── SegmentedControl.jsx      # Mode selection controls
    ├── ThemeProvider.jsx         # Theme & palette management
    └── Toast.js                  # Notification system
```

### Utility Systems
```
utils/
├── achievements/
│   ├── index.jsx                 # Achievement system engine
│   └── weeklyChallenges.jsx     # Weekly challenge rotation
├── recommendations/
│   └── index.jsx                # AI recommendation engine
├── exportUtils.jsx              # Data export/import functionality
├── notifications.js             # Notification management
├── storage.js                   # Enhanced data persistence
└── toast.js                     # User feedback system
```

### Type System
- `types/index.jsx` — Comprehensive PropTypes definitions and validation
- `utils/storage.js` — AsyncStorage helpers (food & meal persistence)

## 🔧 Troubleshooting

### Common Issues & Solutions

#### Metro Bundler Issues
- **ENOENT `<anonymous>` file errors**: ⚠️ Ongoing issue - App functions normally but shows repeated error logs
  - These errors don't affect app functionality
  - Related to Metro's source mapping system during development
  - Use `npx expo start -c` to clear cache if needed
- **Missing SVG components**: ✅ Fixed by adding proper `react-native-svg` imports
- **Dynamic require() errors**: ✅ Converted to ES6 imports for better compatibility

#### Expo Go Connection Issues  
- **"Failed to download remote update"**: Use `npx expo start --tunnel -c` to avoid network issues
- **USB Android debugging**: Run `adb reverse tcp:8081 tcp:8081`
- **Port conflicts**: App automatically detects and uses available ports (e.g., 8082)

#### Package Version Compatibility
- **Dependency warnings**: The following packages may show version mismatches but are functional:
  - `expo-image@3.0.8` (expected: ~3.0.9)
  - `react-native-worklets@0.6.0` (expected: 0.5.1)
  - `@types/react@19.0.14` (expected: ~19.1.10)
  - `eslint-config-expo@9.2.0` (expected: ~10.0.0)
  - `typescript@5.8.3` (expected: ~5.9.2)

#### Development Environment
- **Node.js compatibility**: Use Node 18.x for best results
- **Missing dependencies**: Run `npm install @emnapi/core` if needed
- **Custom dev client**: For native module updates, consider EAS build with `--profile development`

## 🚀 Development Status

### Current State
- ✅ **App Functional**: All core features working properly
- ✅ **Web Version**: Successfully accessible at `http://localhost:8082`
- ✅ **Mobile Ready**: Compatible with Expo Go on iOS/Android
- ✅ **Error-Free Bundling**: Metro bundler compiles successfully
- ⚠️ **Package Versions**: Minor version mismatches with Expo SDK (non-critical)

### Git Repository Setup
```powershell
# Initialize repository (if needed)
git init
git add .
git commit -m "Diet tracker app with recent bug fixes"

# Push to remote repository  
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main
```

### Development Commands
```powershell
# Start development server (recommended)
npm start

# Clear cache and restart
npx expo start -c

# Tunnel mode for network issues
npx expo start --tunnel -c

# Web development
npx expo start --web
```

## 📚 Additional Resources

### Complete Project Documentation
For comprehensive project information, see **[DOCUMENTATION.md](./DOCUMENTATION.md)** which includes:
- **Detailed Architecture**: Complete technical implementation details
- **Component Documentation**: API references for all components
- **Database Schema**: Full data structure documentation
- **Development Workflow**: Detailed development and deployment processes
- **Future Roadmap**: Planned enhancements and feature additions
- **Troubleshooting Guide**: Extended issue resolution strategies

### External Resources
- **Expo Documentation**: [docs.expo.dev](https://docs.expo.dev)
- **React Native Guide**: [reactnative.dev](https://reactnative.dev)
- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **React Native Chart Kit**: [github.com/indiespirit/react-native-chart-kit](https://github.com/indiespirit/react-native-chart-kit)

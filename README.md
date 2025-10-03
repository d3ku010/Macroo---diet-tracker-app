# diet-tracker-app

Light-weight calorie & meal tracker built with Expo + React Native.

This app lets you maintain a simple food database (per-100g nutrition), log meals with quantity, and view daily nutrient summaries. It uses Expo Router's file-based routing and AsyncStorage for local data persistence.

Recommended repo name
- diet-tracker-app

Short description
- A minimal Expo React Native app to store foods, log meals, and view daily nutrition summaries.

Features
- Add foods to a local Food DB (calories, protein, carbs, fat per 100g)
- Log meals referencing foods from the Food DB and track quantities
- Daily nutrient summary and simple bar chart visualization

Quick start (local)

1. Install dependencies

```powershell
npm install
```

2. Start Expo

```powershell
npx expo start
```

3. Open in Expo Go or emulator from the Metro UI

Notes about recent fixes (important before pushing)
- Moved the "Add Food" form into the Food DB tab (`app/(tabs)/food-db.jsx`) so the Food DB tab shows a form first and the list below it.
- Added a filesystem route for `food-db` so the `Tabs.Screen` in `app/(tabs)/_layout.jsx` is not extraneous.
- Added `getFoodList` alias in `utils/storage.js` to keep imports consistent and avoid runtime errors.

Project layout (key files)
- `app/(tabs)/_layout.jsx` — tab layout and icons
- `app/(tabs)/index.jsx` — home / summary screen
- `app/(tabs)/add-meal.jsx` — add meal screen (uses foods from food DB)
- `app/(tabs)/food-db.jsx` — add-food form + food list
- `utils/storage.js` — AsyncStorage helpers (food & meal persistence)

Guidelines for pushing
- Initialize a git repo (if not already):

```powershell
git init
git add .
git commit -m "Initial import of diet-tracker-app"
```
- Create the remote repo on GitHub (recommended name: `diet-tracker-app`) and push:

```powershell
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main
```

Troubleshooting notes
- If you see a warning like "[Layout children]: Too many screens defined. Route 'food-db' is extraneous", ensure a matching filesystem route file exists in the `app` tree (e.g., `app/(tabs)/food-db.jsx`) or remove the manual `Tabs.Screen` entry.
- If screens import functions that don't exist (for example `getFoodList` vs `getFoodDatabase`), the app will crash when modules are imported — keep exports and imports consistent.

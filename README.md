# diet-tracker-app

Light-weight calorie & meal tracker built with Expo + React Native (Expo Router).

This app lets you maintain a simple food database (per-100g nutrition), log meals with quantity, and view daily nutrient summaries. It uses file-based routing via Expo Router and AsyncStorage for local persistence.

Quick overview of recent changes
- Added a palette switcher (three distinct palettes) and palette persistence.
- Theme toggle moved from Profile to the Overview (home) header — use the animated sun/moon icon to switch light/dark within the selected palette.
- Reworked the History/Monthly screen: Daily + Monthly sections, compact segmented controls, and chart focused on macros (protein/carbs/fat).

Features
- Add foods to a local Food DB (calories, protein, carbs, fat per 100g)
- Log meals referencing foods from the Food DB and track quantities
- Daily nutrient summary and simple chart visualization
- Theme + palette switching (dark/light per palette)

Requirements & recommended environment
- Node.js: recommend Node 18.x (18.18.0 tested). Newer Node versions (20/22) may cause native postinstall scripts to fail for some packages.
- Expo CLI: use the bundled `npx expo` commands as shown below.

Quick start (local)

1. Install dependencies

```powershell
npm install
```

2. Start Expo (recommended: use Tunnel when testing on mobile to avoid LAN/VPN/firewall issues)

```powershell
# Preferred when testing on a phone across networks
npx expo start --tunnel -c

# Or (LAN) if your phone and dev machine are on the same network
npx expo start -c
```

3. Open in Expo Go
- Scan the QR code shown in the Metro UI or open the URL in Expo Go. If you see "Failed to download remote update" on the phone, switch to `--tunnel` or use USB with `adb reverse tcp:8081 tcp:8081` (Android).

Project layout (key files)
- `app/(tabs)/_layout.jsx` — tab layout and icons
- `app/(tabs)/index.jsx` — overview / summary screen (now contains the theme toggle and PaletteSwitcher)
- `app/(tabs)/monthly.jsx` — history / monthly trends (daily/monthly split, segmented controls)
- `app/(tabs)/add-meal.jsx` — add meal screen
- `app/(tabs)/food-db.jsx` — food database + add-food form
- `components/ui/ThemeProvider.jsx` — theme & palette provider (exposes `useTheme()`)
- `components/ui/PaletteSwitcher.jsx` — quick palette switcher UI
- `utils/storage.js` — AsyncStorage helpers (food & meal persistence)

Dependency compatibility note
- Metro and Expo will warn if installed packages don't match the expected Expo SDK versions; mismatched native packages (react-native, react-native-reanimated, expo-router, etc.) can cause Expo Go to fail. If you rely on updated native modules, consider building a custom dev client (EAS) or align package versions with the Expo SDK.

Troubleshooting
- "Failed to download remote update" / "Something went wrong" in Expo Go:
	- Use `npx expo start --tunnel -c` to avoid local network/firewall issues.
	- If using USB Android debugging: run `adb reverse tcp:8081 tcp:8081`.
	- Ensure the Metro server prints `Metro waiting on exp://...` and that your phone can access that host/port.

- Metro start crashes with ENOENT referencing `node_modules/@emnapi/core/dist`:
	- Run `npm install @emnapi/core` and then `npx expo start -c`.
	- If `npm install` fails during postinstall on newer Node versions, switch to Node 18.x (recommended) and reinstall.

- Dependency alignment: to avoid runtime mismatch with Expo Go, either:
	1. Align package versions with Expo's recommended versions (upgrade/downgrade in `package.json`), then `npm install`; OR
	2. Create a custom development client with EAS (`eas build --profile development`) and run with `expo start --dev-client`.

Guidelines for pushing
- Initialize a git repo (if not already):

```powershell
git init
git add .
git commit -m "Initial import of diet-tracker-app"
```

- Push to a remote repository:

```powershell
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main
```

If you'd like, I can also add a short CONTRIBUTING.md and a development checklist (recommended Node version, expo commands, and how to create a dev client).

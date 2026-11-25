# Tic-Tac-Toe

A clean mobile app foundation using Expo SDK 58, React Native, TypeScript, and NativeWind. The game runs on the device; game rules and state have not been implemented yet.

## Run

```bash
npm ci
npm start
```

Open the project in Expo Go, or use `npm run android`, `npm run ios`, or `npm run web`. To clear Metro's cache, run `npm start -- --clear`.

## Structure

- `src/app/index.tsx`: home screen; `_layout.tsx`: root navigation, font loading, and splash handling.
- `src/components/`: shared themed text and view components.
- `src/hooks/`: theme and color-scheme hooks.
- `src/constants/`: theme values and local font definitions.
- `src/global.css` and `tailwind.config.js`: NativeWind v4 / Tailwind CSS v3 styling.
- `assets/fonts/`: Plus Jakarta Sans regular, medium, semibold, and bold, with its license.
- `assets/branding/`: the game's icon, splash artwork, and generation metadata, configured in `app.json`.

Use NativeWind `className` for styling and `font-sans` for Plus Jakarta Sans. Keep game state in memory unless persistence is requested.

## Checks

```bash
npm run lint
npx tsc --noEmit
```

ESLint is not configured yet, so the lint command may prompt to install and configure it. No test runner or test script is currently defined.

The final launcher icon and native splash need an installed app build for verification. Expo Go's launch screen differs from a standalone app; see [Expo's icon and splash guide](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/).

# Tic-Tac-Toe

A mobile Tic-Tac-Toe app using Expo SDK 58, React Native, TypeScript, and NativeWind. Start a game from the welcome page, choose an opponent, mark, and device difficulty in the setup modal, then continue to the empty game page. The welcome page also shows game history. Match preferences and history stay in memory; gameplay has not been implemented yet.

## Run

```bash
npm ci
npm start
```

Open the project in Expo Go, or use `npm run android`, `npm run ios`, or `npm run web`. To clear Metro's cache, run `npm start -- --clear`.

## Structure

- `src/app/index.tsx`: home screen; `_layout.tsx`: root navigation, font loading, and splash handling.
- `src/app/game.tsx`: empty game page; setup choices are passed as route parameters for future gameplay.
- `src/components/welcome/`: welcome page, match setup, and a centered game-history dialog.
- `src/components/`: shared themed text and view components.
- `src/hooks/`: theme hooks and the shared game-history provider; `useGameHistory().recordGame()` records completed matches.
- `src/constants/`: static options, defaults, labels, styling lookups, theme values, and local font definitions.
- `src/types/`: app-specific welcome, game-history, component-prop, and theme types.
- `src/global.css` and `tailwind.config.js`: NativeWind v4 / Tailwind CSS v3 styling.
- `assets/fonts/`: Plus Jakarta Sans regular, medium, semibold, and bold, with its license.
- `assets/branding/`: the game's icon, splash artwork, and generation metadata, configured in `app.json`.

Use NativeWind `className` for styling and `font-sans` for Plus Jakarta Sans. Keep game state in memory unless persistence is requested.

Use the sun/moon button at the top of the welcome page to switch the whole app between light and dark. It starts with the device theme; a manual selection lasts for the current session.

Game history starts empty and lasts for the current app session. The history list is ready to receive completed matches when gameplay is implemented.

## Checks

```bash
npm run lint
npx tsc --noEmit
```

ESLint is not configured yet, so the lint command may prompt to install and configure it. No test runner or test script is currently defined.

The final launcher icon and native splash need an installed app build for verification. Expo Go's launch screen differs from a standalone app; see [Expo's icon and splash guide](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/).

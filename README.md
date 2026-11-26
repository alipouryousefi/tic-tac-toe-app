# Tic-Tac-Toe

A mobile Tic-Tac-Toe app using Expo SDK 58, React Native, TypeScript, and NativeWind. Play with a friend on one device or against the device at easy, balanced, or hard difficulty. X goes first; occupied squares and finished games cannot accept moves. Winning lines and draws are detected automatically.

Every accepted move is saved locally before the board updates. Reopen the app and tap **Resume game** on the welcome page to continue an unfinished round, including one paused on the device's turn. Restart clears the board while keeping match settings; starting a new game replaces the saved session.

## Run

```bash
npm ci
npm start
```

Open the project in Expo Go, or use `npm run android`, `npm run ios`, or `npm run web`. To clear Metro's cache, run `npm start -- --clear`.

## Structure

- `src/app/index.tsx`: home screen; `_layout.tsx`: root navigation, font loading, and splash handling.
- `src/app/game.tsx`: thin game route, rendering the playable board and controls.
- `src/components/welcome/`: welcome page, match setup, and a centered game-history dialog.
- `src/components/game/`: responsive board, turn/result display, and restart controls.
- `src/game/`: pure rules/AI, saved-snapshot validation, SQLite storage on mobile, and IndexedDB storage on web.
- `src/components/`: shared themed text and view components.
- `src/hooks/`: theme, history, and saved-session providers. `useGameSession()` owns persistence and game actions; completed rounds go through `useGameHistory().recordGame()` once per session ID.
- `src/constants/`: static options, defaults, labels, styling lookups, theme values, and local font definitions.
- `src/types/`: app-specific welcome, game-history, component-prop, and theme types.
- `src/global.css` and `tailwind.config.js`: NativeWind v4 / Tailwind CSS v3 styling.
- `assets/fonts/`: Plus Jakarta Sans regular, medium, semibold, and bold, with its license.
- `assets/branding/`: the game's icon, splash artwork, and generation metadata, configured in `app.json`.

Use NativeWind `className` for styling and `font-sans` for Plus Jakarta Sans. There is no backend or API. A single current game is stored in Expo SQLite on iOS/Android and IndexedDB in the browser. Only unfinished games get a Resume button.

Use the sun/moon button at the top of the welcome page to switch the whole app between light and dark. It starts with the device theme; a manual selection lasts for the current session.

Game history starts empty and lists completed rounds from the current app session; abandoned/restarted rounds are not counted. History and theme choice are not persisted.

## Checks

```bash
npm run lint
npx tsc --noEmit
npm test
```

Use Node 22.13 or newer for the test suite's built-in SQLite support. Tests cover all winning lines, draws, invalid moves, unbeatable hard-mode play, saved-board validation, storage reopening/replacement/recovery, and game/resume UI states. Native SQLite adapter tests use real temporary SQLite files; browser storage tests verify IndexedDB transaction behavior.

The final launcher icon and native splash need an installed app build for verification. Expo Go's launch screen differs from a standalone app; see [Expo's icon and splash guide](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/).

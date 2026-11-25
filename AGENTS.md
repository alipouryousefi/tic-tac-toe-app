# Project

- Mobile Tic-Tac-Toe app using React Native, Expo SDK 58, and strict TypeScript. Prioritize mobile performance and iOS/Android compatibility; preserve existing web support.
- The game runs entirely on the device. Do not introduce a backend, API, or SQLite database. Keep game state in memory unless persistence is explicitly requested.
- The repository has a welcome/match-setup flow, an empty game page, and a root navigator; gameplay has not been implemented yet.

## Structure and conventions

- `src/app/`: the home screen (`index.tsx`), empty game route (`game.tsx`), and root navigator (`_layout.tsx`). Keep components, hooks, types, and game logic outside this directory.
- `src/components/welcome/`: welcome UI, match setup, and a centered game-history modal.
- `src/types/`: all app-specific TypeScript types, grouped by purpose (for example, `welcome.types.ts` and `theme.types.ts`).
- `src/constants/`: static app data, default settings, labels, styling lookups, theme values, and font definitions.
- `src/components/`: shared themed UI; `src/hooks/`: theme hooks and the in-memory game-history provider; `assets/fonts/`: local fonts; `assets/branding/`: game icon and splash artwork.
- Use Expo Router for navigation; import `Link`, `router`, and `useLocalSearchParams` from `expo-router`. Docs: https://docs.expo.dev/router/introduction.md
- Use the existing aliases: `@/*` maps to `src/*`, and `@/assets/*` maps to `assets/*`.
- Follow nearby code: kebab-case filenames, two-space indentation, single quotes, semicolons, and separate external/local import groups. Prefer clear names, small functions, immutable updates, and straightforward control flow. Reuse existing components and helpers where they fit.

## Game code and styling

- Keep screens focused on composing components and wiring interactions. Extract reusable UI when it makes a screen easier to read.
- Keep all app-specific type, interface, and enum declarations in `src/types/`, grouped into clearly named files such as `game.types.ts`. Use `import type` for type-only imports.
- Keep static option arrays, labels, defaults, and shared constant data in `src/constants/`; keep runtime-derived values with their consuming code.
- Keep move validation, win/draw detection, and next-player rules in a pure module such as `game.logic.ts`, independent of React and React Native. Keep related game files together outside `src/app/` (for example, in a new `src/game/` directory).
- Use local React state or a reducer. A hook such as `useTicTacToe` (in `use-tic-tac-toe.ts`) may separate state/actions from rendering when useful.
- Record completed matches through `useGameHistory().recordGame()`. History starts empty and lasts for the current app session; do not add sample results.
- Use NativeWind `className` for React Native styling; reserve inline styles for runtime values that cannot be expressed with static classes. NativeWind v4 uses Tailwind CSS v3, configured in `tailwind.config.js` and `src/global.css`; the root layout imports the CSS. Keep the `src/` content glob covering all files that contain classes. Docs: https://www.nativewind.dev/llms-full.txt
- `AppThemeProvider` synchronizes NativeWind, navigation, themed components, and the status bar. Use `useAppTheme()` for the current light/dark mode and toggle; the welcome page has a sun/moon button. Theme selection lasts for the current session. Preserve `darkMode: 'class'` and the `.dark:root` variable overrides.
- Plus Jakarta Sans is loaded from local assets through `src/constants/fonts.ts` in the root layout. Use `font-sans` with the regular/medium/semibold/bold weights, or the shared `ThemedText` component; its `code` variant keeps a monospaced font.

## Tooling and checks

Use npm (`package-lock.json` is committed; no Bun lockfile).

```bash
npm start                  # expo start
npm run android            # expo start --android
npm run ios                # expo start --ios
npm run web                # expo start --web
npm run lint               # expo lint
npx tsc --noEmit           # typecheck; no package.json script
npx expo-doctor            # diagnose dependencies/configuration
npx expo install --fix     # fix SDK-incompatible versions
```

- Run lint and typecheck before finishing; report any blockers. ESLint dependencies/configuration are currently absent, so `npm run lint` may offer to install/configure them. Do not accept setup during a task that forbids dependency or configuration changes.
- No test script or test runner is currently defined in `package.json`.

## Expo and native workflow

- Before writing code that touches Expo, EAS, or React Native APIs, read the `expo` major in `package.json` and fetch matching docs at `https://docs.expo.dev/versions/v<major>.0.0/` (currently SDK 58). Do not rely on remembered APIs. For other Expo topics, fetch https://docs.expo.dev/llms.txt and follow the relevant links.
- Install packages with `npx expo install <package>` for SDK-compatible versions. Prefer recommended Expo modules and check available skills before adding dependencies.
- `ios/` and `android/` are absent and generated through Continuous Native Generation. Configure native behavior in `app.json` and config plugins; do not create or edit native directories by hand.
- Expo Go includes only its bundled native modules. Libraries requiring additional native code need a development build: `npx expo run:ios`, `npx expo run:android`, or `npx eas-cli@latest build --profile development` with an appropriate profile.
- Use EAS for cloud builds/signing/submission and OTA updates: `npx eas-cli@latest build`, `submit`, or `update`. EAS is not configured in this repository yet. Docs: https://docs.expo.dev/eas/index.md

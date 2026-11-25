# Project

- Mobile Tic-Tac-Toe app using React Native, Expo SDK 58, and strict TypeScript. Prioritize mobile performance and iOS/Android compatibility; preserve existing web support.
- The game runs entirely on the device. Do not introduce a backend, API, or SQLite database. Keep game state in memory unless persistence is explicitly requested.
- The repository currently contains Expo starter screens; game modules have not been created yet.

## Structure and conventions

- `src/app/`: Expo Router screens (`index.tsx`, `explore.tsx`) and navigator layouts (`_layout.tsx`). Keep components, hooks, types, and game logic outside this directory.
- `src/components/` (including `ui/`): reusable UI; `src/hooks/`: shared hooks; `src/constants/theme.ts`: theme values; `assets/`: static assets.
- Use Expo Router for navigation; import `Link`, `router`, and `useLocalSearchParams` from `expo-router`. Docs: https://docs.expo.dev/router/introduction.md
- Use the existing aliases: `@/*` maps to `src/*`, and `@/assets/*` maps to `assets/*`.
- Follow nearby code: kebab-case filenames, two-space indentation, single quotes, semicolons, and separate external/local import groups. Prefer clear names, small functions, immutable updates, and straightforward control flow. Reuse existing components and helpers where they fit.

## Game code and styling

- Keep screens focused on composing components and wiring interactions. Extract reusable UI when it makes a screen easier to read.
- Keep app-specific types in separate files close to their feature, such as `game.types.ts`.
- Keep move validation, win/draw detection, and next-player rules in a pure module such as `game.logic.ts`, independent of React and React Native. Keep related game files together outside `src/app/` (for example, in a new `src/game/` directory).
- Use local React state or a reducer. A hook such as `useTicTacToe` (in `use-tic-tac-toe.ts`) may separate state/actions from rendering when useful.
- Use NativeWind `className` for React Native styling; reserve inline styles for runtime values that cannot be expressed with static classes. The current starter uses `StyleSheet` and has no NativeWind dependency or configuration yet; verify setup before relying on `className` support.

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
- `npm run reset-project` moves or deletes starter files and recreates routes; use only when a reset is requested.

## Expo and native workflow

- Before writing code that touches Expo, EAS, or React Native APIs, read the `expo` major in `package.json` and fetch matching docs at `https://docs.expo.dev/versions/v<major>.0.0/` (currently SDK 58). Do not rely on remembered APIs. For other Expo topics, fetch https://docs.expo.dev/llms.txt and follow the relevant links.
- Install packages with `npx expo install <package>` for SDK-compatible versions. Prefer recommended Expo modules and check available skills before adding dependencies.
- `ios/` and `android/` are absent and generated through Continuous Native Generation. Configure native behavior in `app.json` and config plugins; do not create or edit native directories by hand.
- Expo Go includes only its bundled native modules. Libraries requiring additional native code need a development build: `npx expo run:ios`, `npx expo run:android`, or `npx eas-cli@latest build --profile development` with an appropriate profile.
- Use EAS for cloud builds/signing/submission and OTA updates: `npx eas-cli@latest build`, `submit`, or `update`. EAS is not configured in this repository yet. Docs: https://docs.expo.dev/eas/index.md

# Tic-Tac-Toe

A mobile Tic-Tac-Toe app using Expo SDK 58, React Native, TypeScript, and NativeWind. Play with a friend on one device or against the device at easy, balanced, or hard difficulty. X goes first; occupied squares and finished games cannot accept moves. Winning lines and draws are detected automatically.

Every accepted move is saved locally before the board updates. Reopen the app and tap **Resume game** on the welcome page to continue an unfinished round, including one paused on the device's turn. Restart clears the board while keeping match settings; starting a new game replaces the saved session.

## Run

```bash
npm ci
npm start
```

Open the project in Expo Go, or use `npm run android`, `npm run ios`, or `npm run web`. To clear Metro's cache, run `npm start -- --clear`.

## Build native apps with EAS

EAS Build creates installable Android/iOS apps in Expo's cloud. You can run these commands from an Ubuntu server without Android Studio or Xcode. You need an Expo account; cloud builds are subject to your [Expo plan's limits](https://expo.dev/pricing).

### First-time setup

Run commands from the project root:

```bash
npm ci
npx expo login --no-browser
npx --yes eas-cli@latest whoami
npx --yes eas-cli@latest init
npx --yes eas-cli@latest build:configure
```

The terminal login prompts for your Expo email/username and password, plus a verification code if required. Skip login if already authenticated. `init` links the repository to an Expo project; skip it if `expo.extra.eas.projectId` is already set in `app.json`. This repository does not currently include `eas.json`.

Choose stable, unique identifiers when prompted, such as `com.yourname.tictactoe` for `expo.android.package` and `expo.ios.bundleIdentifier`. Replace the example with your own identifier and keep it unchanged for future builds of the same app.

After configuration, merge these profiles into the generated `eas.json`, preserving other settings:

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

The preview profile creates a standalone app: it does not require Expo Go, a running Metro server, or `expo-dev-client`. Commit the generated `eas.json` and project configuration changes for repeatable builds. Keep signing credentials in EAS-managed credentials rather than the repository.

### Android APK to install or share

```bash
npx --yes eas-cli@latest build --platform android --profile preview
```

On the first build, allow EAS to generate an Android keystore when prompted. When the build finishes, open the build URL, download the APK on the phone, and allow installation from that browser if Android asks. A Google Play developer account is not needed to install an APK directly.

Internal build links allow access without an Expo login by default; check the project's **Unauthenticated access to internal builds** setting before sharing. The installed preview runs independently of your terminal.

### iPhone preview

Physical-device iOS builds require a paid Apple Developer Program membership and registered test devices:

```bash
npx --yes eas-cli@latest device:create
npx --yes eas-cli@latest build --platform ios --profile preview
```

Open the registration link on each test iPhone before building. Complete Apple's account/signing prompts privately in your terminal and let EAS manage provisioning. Share the finished build's install link with those registered devices. Adding another device requires a new build or re-signing the existing build.

### Builds for the stores

```bash
# Android App Bundle (AAB) for Google Play
npx --yes eas-cli@latest build --platform android --profile production

# iOS build for App Store Connect / TestFlight
npx --yes eas-cli@latest build --platform ios --profile production
```

A production Android AAB is uploaded to Google Play; use the preview APK for direct installation. Store distribution requires the corresponding Google Play or Apple developer membership. Building does not submit or publish the app.

Check build progress and retrieve the artifact link with:

```bash
npx --yes eas-cli@latest build:list
```

See Expo's [first-build guide](https://docs.expo.dev/build/setup/) and [internal distribution guide](https://docs.expo.dev/build/internal-distribution/) for details.

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

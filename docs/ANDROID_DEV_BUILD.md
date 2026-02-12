# Android Development Build Guide

This guide explains how to build and test the ReefKeeper Android app locally without requiring a Metro bundler server.

## Background

By default, React Native and Expo debug builds load JavaScript from a Metro development server. This allows for fast refresh and easy debugging, but requires the Metro server to be running. When you install a debug APK on a device or emulator without Metro running, you'll see an error like "metro is not running" or "Unable to load script".

**ReefKeeper is configured to bundle JavaScript directly into debug APKs**, allowing them to run standalone without Metro.

## Building the Android APK

### Prerequisites

- Node.js 20+
- Java 17
- Android SDK (via Android Studio)
- All dependencies installed: `npm install`

### Build Steps

1. **Generate the native Android project:**
   ```bash
   npx expo prebuild --platform android --clean
   ```
   This creates the `android/` directory with native Android project files.

2. **Build the debug APK:**
   ```bash
   cd android
   ./gradlew assembleDebug --no-daemon
   ```

3. **Locate the APK:**
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Installing and Running

**On an Android Emulator:**
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

**On a Physical Device:**
1. Enable USB debugging on your device
2. Connect via USB
3. Run: `adb install android/app/build/outputs/apk/debug/app-debug.apk`

The app will launch and run without requiring Metro to be running.

## How It Works

ReefKeeper uses a custom Expo config plugin (`plugins/withBundleInDebug.js`) that modifies the Android build configuration during the prebuild step. This plugin adds the following configuration to `android/app/build.gradle`:

```groovy
project.ext.react = [
    bundleInDebug: true,
    devDisabledInDebug: false
]
```

### Configuration Options

- **`bundleInDebug: true`** - Bundles JavaScript into the debug APK instead of loading from Metro
- **`devDisabledInDebug: false`** - Keeps developer menu and debugging features enabled

This gives you the best of both worlds:
- ✅ APK runs standalone without Metro
- ✅ Developer menu still available (shake device or `adb shell input keyevent 82`)
- ✅ Can still enable remote JS debugging via the developer menu

## Development Workflow

### Option 1: Fast Development (Metro)

For rapid development with hot reload:

```bash
npx expo start --android
```

This runs Metro and connects to a development build, giving you instant feedback on code changes.

### Option 2: Standalone Testing (APK)

For testing on real devices or without Metro:

1. Make your code changes
2. Rebuild the APK (steps above)
3. Reinstall on device
4. Test the app

This workflow is slower but tests the app in a more production-like environment.

## CI/CD Integration

The GitHub Actions workflow (`.github/workflows/android.yml`) automatically:
1. Runs `npx expo prebuild --platform android --clean`
2. Builds the debug APK with `./gradlew assembleDebug`
3. Uploads the APK as a build artifact

The bundleInDebug plugin ensures that CI-built APKs work correctly when downloaded and tested locally.

## Troubleshooting

### APK still shows Metro error

If you see Metro errors after applying this fix:
1. Clean the build: `cd android && ./gradlew clean`
2. Delete the android folder: `rm -rf android`
3. Regenerate with prebuild: `npx expo prebuild --platform android --clean`
4. Rebuild: `cd android && ./gradlew assembleDebug`

### JavaScript changes not reflected

If your code changes aren't showing up:
- You must rebuild the APK after code changes
- Debug builds bundle JS at build time, not runtime
- Use Metro workflow (Option 1 above) for faster iteration

### Auth0 configuration warnings

The warnings about Auth0 configuration during prebuild are expected if you haven't set up Auth0 credentials. The app will still build, but authentication features won't work. See the main README for Auth0 setup instructions.

## Related Documentation

- [Main README](../README.md) - Full setup instructions
- [Android Build Optimization](./ANDROID_BUILD_OPTIMIZATION.md) - Performance tips for faster builds
- [Expo Config Plugins](https://docs.expo.dev/config-plugins/plugins/) - Learn about custom plugins

# Offline-built Expo Demo APK — Design

Date: 2026-06-17

## Goal
Build a minimal Expo (React Native) demo app into a standalone, installable
Android APK entirely on the local machine — no EAS cloud, no runtime network.

## App content
Single screen: welcome title + a tap counter button. Uses only `react-native`
core components (no navigation, state libs, or backend).

## Toolchain (verified present)
- Node 24 / npm 11, Expo CLI
- Android SDK: `C:\Users\Public\Android\Sdk` (platforms <= android-36, build-tools 34-36)
- JDK 17: `C:\Program Files\Java\jdk-17` — used only for the Gradle build via a
  scoped `JAVA_HOME`; system Java 8 left untouched.
- Existing `~/.gradle` cache (prior Android builds have run here).

## Steps
1. Scaffold `DemoApp` with `create-expo-app` (blank TypeScript template).
2. Replace `App.tsx` with the counter + welcome screen.
3. `npx expo prebuild --platform android` to generate the native `android/` project.
4. Gradle `assembleRelease` with `JAVA_HOME` -> jdk-17 and `ANDROID_HOME` set.
   The RN/Expo template's release build type is signed with the auto-generated
   debug keystore by default, so the APK is self-contained, signed, and runs
   without Metro.
5. Verify artifact at `android/app/build/outputs/apk/release/app-release.apk`.

## Why assembleRelease (not assembleDebug)
A debug APK expects a running Metro server for JS; the release build embeds the
JS bundle, making it the correct choice for an offline/standalone demo.

## Out of scope (YAGNI)
Navigation, state libraries, backend, iOS, release/store keystore, emulator install.

## Risk
First Gradle build may download Gradle/AGP/Maven artifacts if cache is missing
any. Cache already exists, so expected to be fast; will flag if it pulls a lot.

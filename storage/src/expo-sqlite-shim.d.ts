/**
 * Ambient shim for the OPTIONAL `expo-sqlite` peer dependency (React Native
 * only). It is intentionally NOT installed in this monorepo — a RN app's
 * bundler resolves it at runtime. This `declare module` lets `tsc` resolve the
 * dynamic `import('expo-sqlite')` in `src/mobile.ts` (implicit any); the
 * `as unknown as ExpoSqliteModule` cast there supplies the real shape. A
 * consumer that DOES install `expo-sqlite` keeps its own real types — an
 * untyped ambient `declare module` does not clash with the package's shipped
 * declarations (unlike `@ts-expect-error`, which would then error).
 */
declare module 'expo-sqlite';

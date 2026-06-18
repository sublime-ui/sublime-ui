export const REQUIREMENTS = {
  node: { min: 18 },
  jdk: { major: 17 },
  ndk: '27.1.12297006',
  cmake: '3.22.1',
  buildTools: '35.0.0',
  platform: 'android-35',
} as const;

export const JDK_DOWNLOAD = {
  windowsX64:
    'https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.13%2B11/OpenJDK17U-jdk_x64_windows_hotspot_17.0.13_11.zip',
} as const;

export const CMDLINE_TOOLS_URL = {
  windows:
    'https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip',
} as const;

/** Leading integer of a version string, or null if none. */
function leadingMajor(actual: string | null): number | null {
  if (actual === null) return null;
  const match = actual.match(/\d+/);
  if (match === null) return null;
  return Number.parseInt(match[0], 10);
}

export function satisfiesMajor(
  actual: string | null,
  requiredMajor: number,
): boolean {
  const major = leadingMajor(actual);
  return major !== null && major >= requiredMajor;
}

export function satisfiesExact(
  actual: string | null,
  required: string,
): boolean {
  return actual !== null && actual === required;
}

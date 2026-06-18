import { describe, it, expect } from 'vitest';
import { isAbsolute } from 'node:path';
import { parseMissingSdkComponents, gradlewPath } from '../src/lib/gradle.js';

describe('gradlewPath', () => {
  it('returns an absolute path even when given a relative android dir', () => {
    // A relative gradlew path spawned with cwd=androidDir is re-resolved
    // against the child cwd on Windows, doubling the path and failing with
    // "The system cannot find the path specified." Must be absolute.
    const p = gradlewPath('sandbox/DemoApp/android');
    expect(isAbsolute(p)).toBe(true);
    expect(p.endsWith('gradlew') || p.endsWith('gradlew.bat')).toBe(true);
  });

  it('leaves an already-absolute android dir absolute', () => {
    const abs =
      process.platform === 'win32' ? 'C:\\proj\\android' : '/proj/android';
    expect(isAbsolute(gradlewPath(abs))).toBe(true);
  });
});

describe('parseMissingSdkComponents', () => {
  it('extracts NDK and CMake ids from the real failure text', () => {
    const stderr = [
      '> Task :app:configureCMakeRelWithDebInfo FAILED',
      'com.android.builder.sdk.InstallFailedException: Failed to install the following SDK components:',
      '      ndk;27.1.12297006 NDK (Side by side) 27.1.12297006',
      '      cmake;3.22.1 CMake 3.22.1',
      'The SDK directory is not writable…',
    ].join('\n');
    expect(parseMissingSdkComponents(stderr)).toEqual([
      'ndk;27.1.12297006',
      'cmake;3.22.1',
    ]);
  });

  it('handles a single missing component', () => {
    const stderr =
      'Failed to install the following Android SDK packages as some licences have not been accepted.\n   ndk;27.1.12297006 NDK (Side by side)';
    expect(parseMissingSdkComponents(stderr)).toEqual(['ndk;27.1.12297006']);
  });

  it('de-duplicates repeated ids', () => {
    const stderr = 'need cmake;3.22.1\nalso cmake;3.22.1 again';
    expect(parseMissingSdkComponents(stderr)).toEqual(['cmake;3.22.1']);
  });

  it('returns empty array when nothing is missing', () => {
    expect(parseMissingSdkComponents('BUILD SUCCESSFUL in 42s')).toEqual([]);
  });
});

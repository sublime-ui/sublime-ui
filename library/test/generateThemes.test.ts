import { describe, it, expect, vi } from 'vitest';

// The native build of generateThemes maps tokens onto a react-native-paper MD3
// theme. We mock react-native-paper so the mapping can be unit-tested under the
// node test env (importing the real package would pull React Native, whose Flow
// source does not load in node).
vi.mock('react-native-paper', () => {
  const colors = { primary: '#000', error: '#000', background: '#000' };
  return {
    MD3LightTheme: { dark: false, roundness: 4, colors },
    MD3DarkTheme: { dark: true, roundness: 4, colors },
  };
});

import { generateThemes } from '../src/tokens/generateThemes.js';
import { generateThemes as generateThemesNative } from '../src/tokens/generateThemes.native.js';
import { defaultTokens } from '../src/tokens/tokens.js';

describe('generateThemes (web)', () => {
  it('maps tokens into an MUI theme', () => {
    const { muiTheme } = generateThemes(defaultTokens, 'dark');
    expect(muiTheme.palette.mode).toBe('dark');
    expect(muiTheme.palette.primary.main).toBe(defaultTokens.color.dark.primary);
    expect(muiTheme.palette.error.main).toBe(defaultTokens.color.dark.danger);
    expect(muiTheme.shape.borderRadius).toBe(defaultTokens.radii.md);
  });
  it('is pure — same input yields equal MUI output', () => {
    const a = generateThemes(defaultTokens, 'light');
    const b = generateThemes(defaultTokens, 'light');
    expect(a.muiTheme.palette.primary.main).toBe(b.muiTheme.palette.primary.main);
  });
});

describe('generateThemes (native)', () => {
  it('maps tokens into a Paper MD3 theme', () => {
    const { paperTheme } = generateThemesNative(defaultTokens, 'light');
    expect(paperTheme.colors.primary).toBe(defaultTokens.color.light.primary);
    expect(paperTheme.colors.error).toBe(defaultTokens.color.light.danger);
    expect(paperTheme.roundness).toBe(defaultTokens.radii.md);
    expect(paperTheme.dark).toBe(false);
  });
});

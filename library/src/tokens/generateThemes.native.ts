import { MD3LightTheme, MD3DarkTheme, type MD3Theme } from 'react-native-paper';
import type { Theme } from '@mui/material';
import type { SublimeTokens } from './tokens.js';

/**
 * Native build of `generateThemes`.
 *
 * Only `paperTheme` is consumed on native (by `SublimeProvider.native.tsx`). We do
 * NOT import `@mui/material` at runtime here — `muiTheme` is a placeholder to satisfy
 * the cross-platform signature shared with the web variant (`generateThemes.ts`) and
 * is never read on native. `@mui/material` is imported only as a type (erased).
 */
export function generateThemes(
  tokens: SublimeTokens,
  mode: 'light' | 'dark',
): { paperTheme: MD3Theme; muiTheme: Theme } {
  const c = tokens.color[mode];
  const base = mode === 'dark' ? MD3DarkTheme : MD3LightTheme;

  const paperTheme: MD3Theme = {
    ...base,
    roundness: tokens.radii.md,
    colors: {
      ...base.colors,
      primary: c.primary,
      onPrimary: c.primaryFg,
      secondary: c.secondary,
      onSecondary: c.secondaryFg,
      error: c.danger,
      background: c.background,
      onBackground: c.foreground,
      surface: c.surface,
      onSurface: c.foreground,
      outline: c.surfaceBorder,
      outlineVariant: c.divider,
    },
  };

  // Never consumed on native; present only for signature parity with the web build.
  return { paperTheme, muiTheme: {} as Theme };
}

import { createTheme, type Theme } from '@mui/material';
import type { MD3Theme } from 'react-native-paper';
import type { SublimeTokens } from './tokens.js';

/**
 * Web build of `generateThemes`.
 *
 * Only `muiTheme` is consumed on web (by `SublimeProvider.tsx`). The `paperTheme`
 * field exists solely to satisfy the cross-platform signature shared with the
 * native variant (`generateThemes.native.ts`); it is never read on web. We
 * deliberately do NOT import `react-native-paper` at runtime here — doing so pulls
 * React Native (and its Flow syntax) into the web bundle and breaks Vite/webpack.
 * `react-native-paper` is imported only as a type (erased at build).
 */
export function generateThemes(
  tokens: SublimeTokens,
  mode: 'light' | 'dark',
): { paperTheme: MD3Theme; muiTheme: Theme } {
  const c = tokens.color[mode];

  const muiTheme = createTheme({
    palette: {
      mode,
      primary: { main: c.primary, contrastText: c.primaryFg },
      secondary: { main: c.secondary, contrastText: c.secondaryFg },
      success: { main: c.success },
      warning: { main: c.warning },
      error: { main: c.danger },
      info: { main: c.info },
      background: { default: c.background, paper: c.surface },
      text: { primary: c.foreground, secondary: c.mutedFg },
      divider: c.divider,
    },
    shape: { borderRadius: tokens.radii.md },
    typography: { fontFamily: tokens.typography.family },
  });

  // Never consumed on web; present only for signature parity with the native build.
  return { paperTheme: {} as MD3Theme, muiTheme };
}

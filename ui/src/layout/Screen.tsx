import type { ScreenProps } from './Screen.types.js';

export function Screen({ children, padded = true, testID }: ScreenProps) {
  return (
    <main data-testid={testID} style={{ padding: padded ? 16 : 0, minHeight: '100%' }}>
      {children}
    </main>
  );
}

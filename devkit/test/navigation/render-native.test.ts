import { describe, it, expect } from 'vitest';
import { renderNative } from '../../src/lib/navigation/render-native';

const tree = {
  key: 'root', kind: 'book', format: 'bottomNav', options: {},
  children: [
    { key: 'home', kind: 'page', component: 'Home', options: {} },
    { key: 'settings', kind: 'book', format: 'stack', options: {}, children: [
      { key: 'profile', kind: 'page', component: 'Profile', options: {} },
    ] },
  ],
} as const;

describe('renderNative', () => {
  it('emits a bottomNav navigator with screens and a NavigationContainer', () => {
    const out = renderNative(tree as any, { screensImport: './screens' });
    expect(out).toContain('createBottomTabNavigator');
    expect(out).toContain('<Tab.Screen name="home"');
    expect(out).toContain('NavigationContainer');
  });

  it('emits a nested stack navigator for a linked stack book', () => {
    const out = renderNative(tree as any, { screensImport: './screens' });
    expect(out).toContain('createNativeStackNavigator');
  });

  it('wires NavProvider through useNativeNav', () => {
    const out = renderNative(tree as any, { screensImport: './screens' });
    expect(out).toContain('NavProvider');
    expect(out).toContain('useNativeNav');
  });
});

import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello from Expo 👋</Text>
      <Text style={styles.subtitle}>Built locally — fully offline</Text>

      <Text style={styles.count}>{count}</Text>

      <View style={styles.row}>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => setCount((c) => c + 1)}
        >
          <Text style={styles.buttonText}>Tap me</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.buttonGhost, pressed && styles.buttonPressed]}
          onPress={() => setCount(0)}
        >
          <Text style={styles.buttonGhostText}>Reset</Text>
        </Pressable>
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1220',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#7c8aa5',
    fontSize: 15,
    marginTop: 6,
    marginBottom: 32,
  },
  count: {
    color: '#4da3ff',
    fontSize: 72,
    fontWeight: '800',
    marginBottom: 28,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonGhost: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#33415c',
  },
  buttonGhostText: {
    color: '#aab6cc',
    fontSize: 16,
    fontWeight: '600',
  },
});

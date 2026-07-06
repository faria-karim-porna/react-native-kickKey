// src/keyboard/KeyboardScreen.tsx

/**
 * PHASE 1 — Placeholder keyboard screen.
 *
 * This component renders inside KickKeyInputMethodService via ReactRootView.
 * Its sole purpose in Phase 1 is to prove that React Native renders correctly
 * inside the Android IME system.
 *
 * Phase 2 will replace this with real key rows, NativeModules wiring,
 * shift logic, and the suggestion bar.
 *
 * ⚠️  DO NOT import anything from the companion app (expo-router, zustand,
 *     AsyncStorage, settings store). This file is bundled into keyboard.bundle
 *     which must stay small (~3–5MB).
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import PlaceholderKey from './PlaceholderKey';

// Placeholder key rows — just enough to show a keyboard shape.
// Real layout comes in Phase 2.
const ROW_1 = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
const ROW_2 = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
const ROW_3 = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];

export default function KeyboardScreen() {
  return (
    <View style={styles.keyboard}>
      {/* Header — shows that React Native is rendering inside the IME */}
      <View style={styles.header}>
        <Text style={styles.headerText}>⌨ KickKey · Phase 1 · React Native</Text>
      </View>

      {/* Placeholder suggestion bar */}
      <View style={styles.suggestionBar}>
        <Text style={styles.suggestionPlaceholder}>Suggestions appear here in Phase 4</Text>
      </View>

      {/* Key rows */}
      <View style={styles.row}>
        {ROW_1.map((key) => (
          <PlaceholderKey key={key} label={key} />
        ))}
      </View>

      <View style={styles.row}>
        {ROW_2.map((key) => (
          <PlaceholderKey key={key} label={key} />
        ))}
      </View>

      <View style={styles.row}>
        <PlaceholderKey label="⇧" flex={1.5} />
        {ROW_3.map((key) => (
          <PlaceholderKey key={key} label={key} />
        ))}
        <PlaceholderKey label="⌫" flex={1.5} />
      </View>

      {/* Bottom row */}
      <View style={styles.row}>
        <PlaceholderKey label="!#1" flex={1.5} />
        <PlaceholderKey label="🌐" flex={1} />
        <PlaceholderKey label="space" flex={5} />
        <PlaceholderKey label="↵" flex={1.5} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    width: '100%',
    backgroundColor: '#0d0d1a',
    paddingBottom: 8,
  },
  header: {
    backgroundColor: '#1a1a2e',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  headerText: {
    color: '#00BCD4',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  suggestionBar: {
    height: 36,
    backgroundColor: '#12122a',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  suggestionPlaceholder: {
    color: '#444',
    fontSize: 12,
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
});

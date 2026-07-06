// src/keyboard/PlaceholderKey.tsx
//
// PHASE 1 — Placeholder key component.
// Phase 2 will replace this with the full Key component with NativeModules wiring.

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface PlaceholderKeyProps {
  label: string;
  flex?: number;
}

export default function PlaceholderKey({ label, flex = 1 }: PlaceholderKeyProps) {
  return (
    <TouchableOpacity
      style={[styles.key, { flex }]}
      activeOpacity={0.7}
      onPress={() => {
        // Phase 2 will wire this to NativeModules.KickKey.commitKey()
        console.log('Key pressed:', label);
      }}
    >
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  key: {
    height: 44,
    marginHorizontal: 3,
    marginVertical: 4,
    backgroundColor: '#2a2a40',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  label: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});

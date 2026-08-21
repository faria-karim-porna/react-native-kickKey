import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Circuit } from '../../src/keyboard/qykey/circuit/Circuit';

/**
 * Animated circuit-board background for tab screens.
 * Matches the same pattern used in app/onboarding/_layout.tsx:
 *  – <Circuit animated /> renders SVG wires behind content
 *  – A semi-transparent overlay keeps text legible
 */
export default function CircuitBackground() {
  return (
    <View style={styles.container}>
      <Circuit animated />
      <View style={styles.overlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#e0e5ecac',
  },
});

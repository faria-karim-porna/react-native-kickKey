import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Circuit } from '../../src/keyboard/qykey/circuit/Circuit';

export default function OnboardingLayout() {
  return (
    <View style={styles.root}>
      {/* Circuit-board pattern behind all onboarding screens */}
      <Circuit animated />

      {/* Semi-transparent overlay so circuit is subtle & text is legible */}
      <View style={styles.overlay} />

      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          animationDuration: 250,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="step1-enable" />
        <Stack.Screen name="step2-default" />
        <Stack.Screen name="step3-overlay" />
        <Stack.Screen name="step4-done" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#e0e5ecac',
  },
});

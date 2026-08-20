import React from 'react';
import { View, StyleSheet } from 'react-native';

interface SetupProgressProps {
  currentStep: 1 | 2 | 3;
}

export default function SetupProgress({ currentStep }: SetupProgressProps) {
  return (
    <View style={styles.row}>
      {[1, 2, 3].map((step) => (
        <View
          key={step}
          style={[
            styles.dot,
            step === currentStep && styles.dotActive,
            step < currentStep && styles.dotComplete,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#c8ccd0',
    // Inset neumorphic effect
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.12)',
    borderLeftColor: 'rgba(0,0,0,0.12)',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.6)',
    borderRightColor: 'rgba(255,255,255,0.6)',
  },
  dotActive: {
    backgroundColor: '#00BCD4',
    width: 24,
  },
  dotComplete: {
    backgroundColor: '#00BCD4',
    opacity: 0.6,
  },
});

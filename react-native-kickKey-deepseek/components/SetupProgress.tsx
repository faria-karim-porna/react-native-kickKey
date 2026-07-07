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
    backgroundColor: '#2a2a40',
  },
  dotActive: {
    backgroundColor: '#00BCD4',
    width: 24,
  },
  dotComplete: {
    backgroundColor: '#4CAF50',
  },
});

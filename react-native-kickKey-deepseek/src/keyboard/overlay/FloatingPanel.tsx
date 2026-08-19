import React, { useEffect } from 'react';
import { View, StyleSheet, NativeModules } from 'react-native';
import QykeyKeyboard from '../qykey/QykeyKeyboard';
import ErrorBoundary from '../ErrorBoundary';

export default function FloatingPanel() {
  // Same readiness signal the IME surface sends: lets native know the JS
  // mounted so the ReactHost can be resumed (Fabric mount pipeline).
  useEffect(() => {
    try {
      const p = NativeModules.KickKey?.keyboardReady?.();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (e) {
      console.warn('[KickKey] FloatingPanel keyboardReady failed:', e);
    }
  }, []);

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <QykeyKeyboard />
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

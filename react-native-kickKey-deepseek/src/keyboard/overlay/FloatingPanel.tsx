// ============================================================
// FloatingPanel.tsx — root of the "KickKeyOverlay" React surface
// (the floating keyboard/touchpad panel opened from the
// accessibility button/shortcut — no input field required).
//
// M1 scope: a slim header with a close (✕) button + the full
// QykeyKeyboard (keyboard ⇄ touchpad slider works unchanged).
// Dragging the panel arrives in a later milestone.
// ============================================================

import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, NativeModules } from 'react-native';
import QykeyKeyboard from '../qykey/QykeyKeyboard';
import ErrorBoundary from '../ErrorBoundary';
import { FA5Icon } from '../qykey/icons';

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

  const close = () => {
    try {
      NativeModules.KickKey?.hideFloatingPanel?.();
    } catch (e) {
      console.warn('[KickKey] hideFloatingPanel failed:', e);
    }
  };

  return (
    <ErrorBoundary>
      <View style={styles.panel}>
        <View style={styles.header}>
          <Text style={styles.title}>KickKey</Text>
          <Pressable onPress={close} hitSlop={10} style={styles.closeBtn}>
            <FA5Icon name="times" size={14} color="#888" />
          </Pressable>
        </View>
        <View style={styles.body}>
          <QykeyKeyboard />
        </View>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: '#e0e5ec',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#abb2b9',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  header: {
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    backgroundColor: '#d0d7de',
    borderBottomWidth: 1,
    borderBottomColor: '#abb2b9',
  },
  title: { fontSize: 11, fontWeight: '700', color: '#444', letterSpacing: 0.5 },
  closeBtn: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
});

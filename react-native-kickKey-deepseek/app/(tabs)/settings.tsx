import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, AppState, Pressable } from 'react-native';
import { useSettingsStore } from '../../store/settingsStore';
import ToggleRow from '../../components/ToggleRow';
import KickKey from '../../modules/kickkey-module';

export default function SettingsScreen() {
  const [a11yEnabled, setA11yEnabled] = useState<boolean | null>(null);

  const checkA11yStatus = () => {
    KickKey.isAccessibilityEnabled()
      .then((ok) => setA11yEnabled(ok))
      .catch(() => {});
  };

  useEffect(() => {
    checkA11yStatus();
    // Re-check when returning to the app after toggling in system Settings
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkA11yStatus();
    });
    return () => sub.remove();
  }, []);
  const hapticEnabled    = useSettingsStore((s) => s.hapticEnabled);
  const soundEnabled      = useSettingsStore((s) => s.soundEnabled);
  const autoCorrect        = useSettingsStore((s) => s.autoCorrect);
  const showSuggestions    = useSettingsStore((s) => s.showSuggestions);
  const toggleHaptic        = useSettingsStore((s) => s.toggleHaptic);
  const toggleSound          = useSettingsStore((s) => s.toggleSound);
  const toggleAutoCorrect     = useSettingsStore((s) => s.toggleAutoCorrect);
  const toggleShowSuggestions  = useSettingsStore((s) => s.toggleShowSuggestions);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Settings</Text>

        <Text style={styles.sectionLabel}>Feedback</Text>
        <View style={styles.card}>
          <ToggleRow
            label="Haptic Feedback"
            description="Vibrate on every key press"
            value={hapticEnabled}
            onValueChange={toggleHaptic}
          />
          <ToggleRow
            label="Key Sounds"
            description="Play a click sound on key press"
            value={soundEnabled}
            onValueChange={toggleSound}
          />
        </View>

        <Text style={styles.sectionLabel}>Typing</Text>
        <View style={styles.card}>
          <ToggleRow
            label="Auto-correct"
            description="Automatically fix typos when you press space"
            value={autoCorrect}
            onValueChange={toggleAutoCorrect}
          />
          <ToggleRow
            label="Show Suggestions"
            description="Display word suggestions above the keyboard"
            value={showSuggestions}
            onValueChange={toggleShowSuggestions}
          />
        </View>

        <Text style={styles.sectionLabel}>Accessibility</Text>
        <View style={styles.card}>
          <View style={styles.a11yRow}>
            <Text style={styles.a11yLabel}>Accessibility Service</Text>
            <Text style={[styles.a11yValue, { color: a11yEnabled ? '#4caf50' : '#f44336' }]}>
              {a11yEnabled === null ? 'Checking…' : a11yEnabled ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
          <Pressable
            style={styles.a11yButton}
            onPress={() => KickKey.openAccessibilitySettings()}
          >
            <Text style={styles.a11yButtonText}>Open Accessibility Settings</Text>
          </Pressable>
          {a11yEnabled === false && (
            <Text style={styles.a11yHint}>
              Enable “KickKey Accessibility”, then assign it to the Accessibility
              button or shortcut to open the floating panel anywhere — no input
              field needed.
            </Text>
          )}
        </View>

        <Text style={styles.footnote}>
          Changes apply automatically the next time you open the keyboard.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  scroll: { padding: 20, paddingTop: 12 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  sectionLabel: {
    color: '#888', fontSize: 12, textTransform: 'uppercase',
    marginBottom: 8, marginTop: 16, letterSpacing: 0.5,
  },
  card: { backgroundColor: '#13132a', borderRadius: 12, paddingHorizontal: 16 },
  a11yRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  a11yLabel: { color: '#fff', fontSize: 15 },
  a11yValue: { fontSize: 13, fontWeight: '600' },
  a11yButton: {
    backgroundColor: '#1e2a5a',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  a11yButtonText: { color: '#8ab4f8', fontSize: 14, fontWeight: '700' },
  a11yHint: { color: '#888', fontSize: 12, lineHeight: 17, paddingBottom: 12 },
  footnote: { color: '#555', fontSize: 12, textAlign: 'center', marginTop: 24 },
});

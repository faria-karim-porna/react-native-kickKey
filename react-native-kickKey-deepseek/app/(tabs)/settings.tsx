import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, Pressable, AppState } from 'react-native';
import { useSettingsStore } from '../../store/settingsStore';
import { useKickKeyBridge } from '../../hooks/useKickKeyBridge';
import ToggleRow from '../../components/ToggleRow';

export default function SettingsScreen() {
  const hapticEnabled    = useSettingsStore((s) => s.hapticEnabled);
  const soundEnabled      = useSettingsStore((s) => s.soundEnabled);
  const autoCorrect        = useSettingsStore((s) => s.autoCorrect);
  const showSuggestions    = useSettingsStore((s) => s.showSuggestions);
  const toggleHaptic        = useSettingsStore((s) => s.toggleHaptic);
  const toggleSound          = useSettingsStore((s) => s.toggleSound);
  const toggleAutoCorrect     = useSettingsStore((s) => s.toggleAutoCorrect);
  const toggleShowSuggestions  = useSettingsStore((s) => s.toggleShowSuggestions);

  const { isMouseConnected, openAccessibilitySettings } = useKickKeyBridge();
  const [mouseEnabled, setMouseEnabled] = useState(false);

  const refreshMouseStatus = useCallback(async () => {
    setMouseEnabled(await isMouseConnected());
  }, [isMouseConnected]);

  useEffect(() => {
    refreshMouseStatus();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshMouseStatus();
    });
    return () => sub.remove();
  }, [refreshMouseStatus]);

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

        <Text style={styles.sectionLabel}>Mouse Control</Text>
        <View style={styles.card}>
          <View style={styles.mouseRow}>
            <View style={styles.mouseTextContainer}>
              <Text style={styles.mouseLabel}>Touchpad cursor</Text>
              <Text style={styles.mouseDescription}>
                {mouseEnabled
                  ? 'Enabled — drag on the keyboard touchpad to move the cursor'
                  : 'Needs one-time setup — enable the accessibility service to use the touchpad'}
              </Text>
            </View>
            <Pressable
              style={[styles.mouseBtn, mouseEnabled && styles.mouseBtnEnabled]}
              onPress={openAccessibilitySettings}
            >
              <Text style={[styles.mouseBtnText, mouseEnabled && styles.mouseBtnTextEnabled]}>
                {mouseEnabled ? 'Open Settings' : 'Enable'}
              </Text>
            </Pressable>
          </View>
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
  mouseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    gap: 12,
  },
  mouseTextContainer: { flex: 1 },
  mouseLabel: { color: '#fff', fontSize: 15, fontWeight: '500' },
  mouseDescription: { color: '#888', fontSize: 12, marginTop: 2, lineHeight: 16 },
  mouseBtn: {
    backgroundColor: '#00BCD4',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  mouseBtnEnabled: { backgroundColor: '#2a2a40' },
  mouseBtnText: { color: '#000', fontSize: 13, fontWeight: '700' },
  mouseBtnTextEnabled: { color: '#fff' },
  footnote: { color: '#555', fontSize: 12, textAlign: 'center', marginTop: 24 },
});

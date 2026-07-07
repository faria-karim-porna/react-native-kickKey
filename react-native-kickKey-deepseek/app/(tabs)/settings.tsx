import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useSettingsStore } from '../../store/settingsStore';
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
  footnote: { color: '#555', fontSize: 12, textAlign: 'center', marginTop: 24 },
});

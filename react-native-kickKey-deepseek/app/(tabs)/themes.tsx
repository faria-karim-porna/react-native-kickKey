import React from 'react';
import { Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useSettingsStore } from '../../store/settingsStore';
import { THEME_PRESETS } from '../../constants/Themes';
import ThemeCard from '../../components/ThemeCard';

export default function ThemesScreen() {
  const theme              = useSettingsStore((s) => s.theme);
  const setTheme            = useSettingsStore((s) => s.setTheme);
  const setThemeColors       = useSettingsStore((s) => s.setThemeColors);

  const handleSelectPreset = (preset: typeof THEME_PRESETS[number]) => {
    setTheme(preset.name);
    setThemeColors(preset.colors);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Themes</Text>

        <Text style={styles.sectionLabel}>Color Theme</Text>
        {THEME_PRESETS.map((preset) => (
          <ThemeCard
            key={preset.name}
            preset={preset}
            isSelected={theme === preset.name}
            onPress={() => handleSelectPreset(preset)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scroll: { padding: 20, paddingTop: 12, paddingBottom: 100 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#444', marginBottom: 20 },
  sectionLabel: {
    color: '#888', fontSize: 12, textTransform: 'uppercase',
    marginBottom: 10, marginTop: 8, letterSpacing: 0.5,
  },
});

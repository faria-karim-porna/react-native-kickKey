import React from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore } from '../../store/settingsStore';
import { THEME_PRESETS } from '../../constants/Themes';
import ThemeCard from '../../components/ThemeCard';
import { useAppColors } from '../../hooks/useAppColors';
import { useTranslation } from '../../hooks/useTranslation';

export default function ThemesScreen() {
  const theme              = useSettingsStore((s) => s.theme);
  const setTheme            = useSettingsStore((s) => s.setTheme);
  const setThemeColors       = useSettingsStore((s) => s.setThemeColors);
  const colors = useAppColors();
  const t = useTranslation();

  const handleSelectPreset = (preset: typeof THEME_PRESETS[number]) => {
    setTheme(preset.name);
    setThemeColors(preset.colors);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t.themesTitle}</Text>
        <Text style={[styles.sectionLabel, { color: colors.sectionLabel }]}>{t.colorTheme}</Text>
        {THEME_PRESETS.map((preset) => (
          <ThemeCard key={preset.name} preset={preset} isSelected={theme === preset.name} onPress={() => handleSelectPreset(preset)} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scroll: { padding: 20, paddingTop: 12 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20 },
  sectionLabel: { fontSize: 12, textTransform: 'uppercase', marginBottom: 10, marginTop: 8, letterSpacing: 0.5 },
});

import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import Slider from '@react-native-community/slider';
import { useSettingsStore } from '../../store/settingsStore';
import { THEME_PRESETS } from '../../constants/Themes';
import ThemeCard from '../../components/ThemeCard';

export default function ThemesScreen() {
  const theme              = useSettingsStore((s) => s.theme);
  const setTheme            = useSettingsStore((s) => s.setTheme);
  const setThemeColors       = useSettingsStore((s) => s.setThemeColors);
  const keyHeight             = useSettingsStore((s) => s.keyHeight);
  const setKeyHeight           = useSettingsStore((s) => s.setKeyHeight);
  const keyBorderRadius         = useSettingsStore((s) => s.keyBorderRadius);
  const setKeyBorderRadius       = useSettingsStore((s) => s.setKeyBorderRadius);
  const fontSize                   = useSettingsStore((s) => s.fontSize);
  const setFontSize                 = useSettingsStore((s) => s.setFontSize);

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

        <Text style={styles.sectionLabel}>Key Size</Text>
        <View style={styles.card}>
          <SliderRow
            label="Key Height"
            value={keyHeight}
            min={40}
            max={60}
            onChange={setKeyHeight}
            unit="dp"
          />
          <SliderRow
            label="Corner Radius"
            value={keyBorderRadius}
            min={0}
            max={16}
            onChange={setKeyBorderRadius}
            unit="dp"
          />
          <SliderRow
            label="Font Size"
            value={fontSize}
            min={12}
            max={22}
            onChange={setFontSize}
            unit="sp"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SliderRow({
  label, value, min, max, onChange, unit,
}: {
  label: string; value: number; min: number; max: number;
  onChange: (v: number) => void; unit: string;
}) {
  return (
    <View style={styles.sliderRow}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={styles.sliderValue}>{Math.round(value)}{unit}</Text>
      </View>
      <Slider
        style={{ width: '100%', height: 32 }}
        minimumValue={min}
        maximumValue={max}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor="#00BCD4"
        maximumTrackTintColor="#2a2a40"
        thumbTintColor="#00BCD4"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  scroll: { padding: 20, paddingTop: 12 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  sectionLabel: {
    color: '#888', fontSize: 12, textTransform: 'uppercase',
    marginBottom: 10, marginTop: 8, letterSpacing: 0.5,
  },
  card: { backgroundColor: '#13132a', borderRadius: 12, padding: 16 },
  sliderRow: { marginBottom: 16 },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  sliderLabel: { color: '#ccc', fontSize: 13 },
  sliderValue: { color: '#00BCD4', fontSize: 13, fontWeight: '600' },
});

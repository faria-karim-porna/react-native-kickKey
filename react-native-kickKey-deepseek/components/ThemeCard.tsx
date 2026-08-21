import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import type { ThemePreset } from '../constants/Themes';

interface ThemeCardProps {
  preset: ThemePreset;
  isSelected: boolean;
  onPress: () => void;
}

export default function ThemeCard({ preset, isSelected, onPress }: ThemeCardProps) {
  const { colors } = preset;
  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Mini keyboard preview */}
      <View style={[styles.preview, { backgroundColor: colors.keyboardBg }]}>
        <View style={styles.previewRow}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.previewKey, { backgroundColor: colors.keyBg }]} />
          ))}
        </View>
        <View style={styles.previewRow}>
          <View style={[styles.previewKey, { backgroundColor: colors.specialKeyBg, flex: 2 }]} />
          <View style={[styles.previewKey, { backgroundColor: colors.themePrimary }]} />
        </View>
      </View>

      <Text style={styles.label}>{preset.label}</Text>
      {isSelected && <Text style={styles.checkmark}>✓</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(224,229,236,0.92)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    // Neumorphic raised effect
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: 'rgba(0,0,0,0.15)',
    borderLeftColor: 'rgba(0,0,0,0.15)',
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomColor: 'rgba(255,255,255,0.8)',
    borderRightColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#000',
    shadowOffset: { width: -3, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  cardSelected: { borderColor: '#8594aa' },
  preview: { borderRadius: 8, padding: 8, marginBottom: 10 },
  previewRow: { flexDirection: 'row', gap: 4, marginBottom: 4 },
  previewKey: { flex: 1, height: 18, borderRadius: 3 },
  label: { color: '#444', fontSize: 14, fontWeight: '600' },
  checkmark: { position: 'absolute', top: 12, right: 12, color: '#8594aa', fontSize: 16, fontWeight: 'bold' },
});

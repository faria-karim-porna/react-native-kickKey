import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Circuit } from '../../src/keyboard/qykey/circuit/Circuit';
import { useSettingsStore } from '../../store/settingsStore';
import LanguageTag from '../../components/LanguageTag';

const LANGUAGES: Array<{ code: 'en' | 'bn'; label: string; native: string }> = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'bn', label: 'Bangla',  native: 'বাংলা' },
];

export default function LanguageScreen() {
  const language    = useSettingsStore((s) => s.language);
  const setLanguage  = useSettingsStore((s) => s.setLanguage);

  return (
    <View style={styles.root}>
      <Circuit animated />
      <View style={styles.overlay} />
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Language</Text>
        <Text style={styles.subtitle}>
          Choose your default typing language. You can always switch
          languages from the keyboard's globe button while typing.
        </Text>

        {LANGUAGES.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[styles.row, language === lang.code && styles.rowSelected]}
            onPress={() => setLanguage(lang.code)}
            activeOpacity={0.8}
          >
            <View>
              <Text style={styles.rowLabel}>{lang.label}</Text>
              <Text style={styles.rowNative}>{lang.native}</Text>
            </View>
            <LanguageTag code={lang.code} active={language === lang.code} />
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: '#e0e5ecac' },
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 20, paddingTop: 12, paddingBottom: 100 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#444', marginBottom: 8 },
  subtitle: { color: '#888', fontSize: 13, lineHeight: 18, marginBottom: 24 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(224,229,236,0.92)',
    borderRadius: 12, padding: 18, marginBottom: 12,
    borderWidth: 2, borderColor: 'transparent',
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
  rowSelected: { borderColor: '#8594aa' },
  rowLabel: { color: '#444', fontSize: 16, fontWeight: '600' },
  rowNative: { color: '#888', fontSize: 13, marginTop: 2 },
});

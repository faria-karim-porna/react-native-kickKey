import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  content: { padding: 20, paddingTop: 12 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { color: '#888', fontSize: 13, lineHeight: 18, marginBottom: 24 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#13132a', borderRadius: 12, padding: 18, marginBottom: 12,
    borderWidth: 2, borderColor: 'transparent',
  },
  rowSelected: { borderColor: '#00BCD4' },
  rowLabel: { color: '#fff', fontSize: 16, fontWeight: '600' },
  rowNative: { color: '#888', fontSize: 13, marginTop: 2 },
});

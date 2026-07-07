import React from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, SafeAreaView,
} from 'react-native';
import { useSetupStatus } from '../../hooks/useSetupStatus';
import { useSettingsStore } from '../../store/settingsStore';

export default function HomeScreen() {
  const { isEnabled, isDefault, isFullySetUp } = useSetupStatus();
  const language = useSettingsStore((s) => s.language);
  const [testText, setTestText] = React.useState('');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>KickKey</Text>
        <Text style={styles.subtitle}>Your custom keyboard</Text>

        <View style={styles.statusCard}>
          <StatusRow label="Keyboard Enabled" value={isEnabled} />
          <StatusRow label="Set as Default" value={isDefault} />
          <StatusRow label="Active Language" value={language === 'en' ? 'English' : 'বাংলা'} isText />
        </View>

        {isFullySetUp && (
          <>
            <Text style={styles.sectionLabel}>Try it out</Text>
            <TextInput
              style={styles.testInput}
              placeholder="Tap here and start typing..."
              placeholderTextColor="#555"
              value={testText}
              onChangeText={setTestText}
              multiline
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusRow({
  label, value, isText = false,
}: { label: string; value: boolean | string; isText?: boolean }) {
  return (
    <View style={styles.statusRow}>
      <Text style={styles.statusLabel}>{label}</Text>
      {isText ? (
        <Text style={styles.statusTextValue}>{value as string}</Text>
      ) : (
        <Text style={[styles.statusValue, { color: value ? '#4CAF50' : '#f44336' }]}>
          {value ? '✅ Yes' : '❌ No'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  scroll: { padding: 20, paddingTop: 12 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#00BCD4' },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 24 },
  statusCard: { backgroundColor: '#13132a', borderRadius: 12, padding: 18, marginBottom: 28 },
  statusRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1f1f3a',
  },
  statusLabel: { color: '#ccc', fontSize: 14 },
  statusValue: { fontSize: 14, fontWeight: '600' },
  statusTextValue: { color: '#00BCD4', fontSize: 14, fontWeight: '600' },
  sectionLabel: { color: '#888', fontSize: 12, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
  testInput: {
    backgroundColor: '#13132a', borderRadius: 12, padding: 16,
    color: '#fff', fontSize: 16, minHeight: 100, textAlignVertical: 'top',
  },
});

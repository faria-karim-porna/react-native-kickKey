import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSettingsStore } from '../../store/settingsStore';
import { useKickKeyBridge } from '../../hooks/useKickKeyBridge';

export default function DictionaryScreen() {
  const customWords     = useSettingsStore((s) => s.customWords);
  const addCustomWord     = useSettingsStore((s) => s.addCustomWord);
  const removeCustomWord    = useSettingsStore((s) => s.removeCustomWord);
  const { setDictionaryWords } = useKickKeyBridge();

  const [input, setInput] = useState('');

  // Sync custom words to the native dictionary whenever the list changes.
  useEffect(() => {
    setDictionaryWords(customWords).catch(() => {});
  }, [customWords]);

  const handleAdd = () => {
    const trimmed = input.trim();
    if (trimmed.length === 0) return;
    addCustomWord(trimmed);
    setInput('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Custom Dictionary</Text>
          <Text style={styles.subtitle}>
            Add names, slang, or technical terms so KickKey suggests them.
          </Text>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Add a word..."
            placeholderTextColor="#555"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleAdd}
            autoCapitalize="none"
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={customWords}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No custom words yet. Add one above.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.wordRow}>
              <Text style={styles.wordText}>{item}</Text>
              <TouchableOpacity onPress={() => removeCustomWord(item)}>
                <Text style={styles.removeText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  flex: { flex: 1 },
  header: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 6 },
  subtitle: { color: '#888', fontSize: 13, lineHeight: 18 },
  inputRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, gap: 10 },
  input: {
    flex: 1, backgroundColor: '#13132a', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 15,
  },
  addButton: {
    backgroundColor: '#00BCD4', borderRadius: 10,
    paddingHorizontal: 18, justifyContent: 'center',
  },
  addButtonText: { color: '#000', fontWeight: '700', fontSize: 14 },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  wordRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#13132a', borderRadius: 10, padding: 14, marginBottom: 8,
  },
  wordText: { color: '#fff', fontSize: 15 },
  removeText: { color: '#f44336', fontSize: 16, fontWeight: '700', paddingHorizontal: 8 },
  empty: { color: '#555', textAlign: 'center', marginTop: 40, fontSize: 14 },
});

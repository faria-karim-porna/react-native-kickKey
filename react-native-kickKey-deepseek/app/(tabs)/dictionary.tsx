import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
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
            placeholderTextColor="#999"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleAdd}
            autoCapitalize="none"
            returnKeyType="done"
          />
          <Pressable
            style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
            onPress={handleAdd}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
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
                <Svg width={18} height={18} viewBox="0 0 24 24">
                  <Path
                    d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                    fill="#999"
                  />
                </Svg>
              </TouchableOpacity>
            </View>
          )}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e0e5ec' },
  flex: { flex: 1 },
  header: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  subtitle: { color: '#777', fontSize: 13, lineHeight: 18 },
  inputRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, gap: 10 },
  input: {
    flex: 1,
    backgroundColor: '#d1d9e6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#333',
    fontSize: 15,
    // Neumorphic inset effect
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopColor: 'rgba(0,0,0,0.15)',
    borderLeftColor: 'rgba(0,0,0,0.15)',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.7)',
    borderRightColor: 'rgba(255,255,255,0.7)',
  },
  addButton: {
    backgroundColor: '#8594aa',
    borderRadius: 10,
    paddingHorizontal: 18,
    justifyContent: 'center',
    // Neumorphic raised effect
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: 'rgba(0,0,0,0.1)',
    borderLeftColor: 'rgba(0,0,0,0.1)',
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomColor: 'rgba(255,255,255,0.6)',
    borderRightColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  addButtonPressed: {
    backgroundColor: '#707f9a',
    transform: [{ translateY: 1 }],
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopColor: 'rgba(0,0,0,0.25)',
    borderLeftColor: 'rgba(0,0,0,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  wordRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(224,229,236,0.92)',
    borderRadius: 10, padding: 14, marginBottom: 8,
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
  wordText: { color: '#333', fontSize: 15 },
  empty: { color: '#999', textAlign: 'center', marginTop: 40, fontSize: 14 },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LanguageTagProps {
  code: 'en' | 'bn';
  active: boolean;
}

export default function LanguageTag({ code, active }: LanguageTagProps) {
  return (
    <View style={[styles.tag, active && styles.tagActive]}>
      <Text style={[styles.text, active && styles.textActive]}>
        {code.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#2a2a40',
  },
  tagActive: { backgroundColor: '#00BCD4' },
  text: { color: '#888', fontSize: 11, fontWeight: '700' },
  textActive: { color: '#000' },
});

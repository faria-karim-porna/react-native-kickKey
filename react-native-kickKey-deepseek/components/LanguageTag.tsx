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
    backgroundColor: '#c8ccd0',
    // Neumorphic inset effect
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.12)',
    borderLeftColor: 'rgba(0,0,0,0.12)',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.6)',
    borderRightColor: 'rgba(255,255,255,0.6)',
  },
  tagActive: { backgroundColor: '#8594aa' },
  text: { color: '#888', fontSize: 11, fontWeight: '700' },
  textActive: { color: '#fff' },
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Theme } from './types';

interface BottomRowProps {
  theme: Theme;
  language: 'en' | 'bn';
  isSymbol: boolean;
  imeAction: string;                // ← NEW Phase 7
  onSpace: () => void;
  onEnter: () => void;
  onLanguageSwitch: () => void;
  onSymbolToggle: () => void;
  onEmojiToggle: () => void;
  onClipboardToggle: () => void;
}

export default function BottomRow({
  theme, language, isSymbol, imeAction,
  onSpace, onEnter, onLanguageSwitch, onSymbolToggle, onEmojiToggle, onClipboardToggle,
}: BottomRowProps) {
  const special = {
    backgroundColor: theme.specialKeyBg,
    borderRadius: theme.keyBorderRadius,
    marginHorizontal: theme.keyMargin,
    height: theme.keyHeight,
  };

  const langLabel  = language === 'en' ? '🌐 EN' : '🌐 বাং';
  const spaceLabel = language === 'en' ? 'space' : 'স্পেস';

  const enterLabel = imeAction === 'search' ? '🔍'
    : imeAction === 'send'   ? '➤'
    : imeAction === 'done'   ? '✓'
    : imeAction === 'next'   ? '→'
    : imeAction === 'go'     ? 'Go'
    : '↵';

  return (
    <View style={styles.row}>
      <TouchableOpacity style={[styles.key, special, { flex: 1.3 }]} onPress={onSymbolToggle} activeOpacity={0.55}>
        <Text style={[styles.label, { color: theme.specialKeyText, fontSize: 13 }]}>
          {isSymbol ? 'ABC' : '!#1'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.key, special, { flex: 1.1 }]}
        onPress={onLanguageSwitch}
        onLongPress={onLanguageSwitch}
        delayLongPress={600}
        activeOpacity={0.55}
      >
        <Text style={[styles.label, { color: theme.specialKeyText, fontSize: 10 }]}
          numberOfLines={1} adjustsFontSizeToFit>
          {langLabel}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.key, {
          flex: 3.6,
          backgroundColor: theme.keyBg,
          borderRadius: theme.keyBorderRadius,
          marginHorizontal: theme.keyMargin,
          height: theme.keyHeight,
        }]}
        onPress={onSpace}
        activeOpacity={0.7}
      >
        <Text style={[styles.spaceLabel, { color: theme.altText }]}>{spaceLabel}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.key, special, { flex: 1 }]} onPress={onClipboardToggle} activeOpacity={0.55}>
        <Text style={styles.iconEmoji}>📋</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.key, special, { flex: 1 }]} onPress={onEmojiToggle} activeOpacity={0.55}>
        <Text style={styles.iconEmoji}>😊</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.key, special, { flex: 1.3 }]} onPress={onEnter} activeOpacity={0.55}>
        <Text style={[styles.label, { color: theme.specialKeyText, fontSize: imeAction === 'return' ? 18 : 11 }]}>
          {enterLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row:        { flexDirection: 'row', paddingHorizontal: 4, justifyContent: 'center', marginVertical: 4 },
  key:        { justifyContent: 'center', alignItems: 'center', elevation: 2 },
  label:      { fontWeight: '500', textAlign: 'center' },
  spaceLabel: { fontSize: 12 },
  iconEmoji:  { fontSize: 18 },
});

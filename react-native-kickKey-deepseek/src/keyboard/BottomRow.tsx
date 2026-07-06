import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Theme } from './types';

interface BottomRowProps {
  theme: Theme;
  language: 'en' | 'bn';
  isSymbol: boolean;
  onSpace: () => void;
  onEnter: () => void;
  onLanguageSwitch: () => void;
  onSymbolToggle: () => void;
  onEmojiToggle: () => void;
}

export default function BottomRow({
  theme,
  language,
  isSymbol,
  onSpace,
  onEnter,
  onLanguageSwitch,
  onSymbolToggle,
  onEmojiToggle,
}: BottomRowProps) {
  const specialStyle = {
    backgroundColor: theme.specialKeyBg,
    borderRadius: theme.keyBorderRadius,
    marginHorizontal: theme.keyMargin,
    height: theme.keyHeight,
  };

  const spaceStyle = {
    backgroundColor: theme.keyBg,
    borderRadius: theme.keyBorderRadius,
    marginHorizontal: theme.keyMargin,
    height: theme.keyHeight,
  };

  return (
    <View style={styles.row}>
      {/* Symbols toggle */}
      <TouchableOpacity
        style={[styles.specialKey, specialStyle, { flex: 1.5 }]}
        onPress={onSymbolToggle}
        activeOpacity={0.55}
      >
        <Text style={[styles.specialLabel, { color: theme.specialKeyText, fontSize: 13 }]}>
          {isSymbol ? 'ABC' : '!#1'}
        </Text>
      </TouchableOpacity>

      {/* Language switch */}
      <TouchableOpacity
        style={[styles.specialKey, specialStyle, { flex: 1 }]}
        onPress={onLanguageSwitch}
        activeOpacity={0.55}
      >
        <Text style={[styles.specialLabel, { color: theme.specialKeyText, fontSize: 12 }]}>
          {language === 'en' ? '🌐 EN' : '🌐 বাং'}
        </Text>
      </TouchableOpacity>

      {/* Spacebar */}
      <TouchableOpacity
        style={[styles.spaceKey, spaceStyle, { flex: 5 }]}
        onPress={onSpace}
        activeOpacity={0.7}
      >
        <Text style={[styles.spaceLabel, { color: theme.altText }]}>
          space
        </Text>
      </TouchableOpacity>

      {/* Emoji toggle */}
      <TouchableOpacity
        style={[styles.specialKey, specialStyle, { flex: 1 }]}
        onPress={onEmojiToggle}
        activeOpacity={0.55}
      >
        <Text style={styles.emojiLabel}>😊</Text>
      </TouchableOpacity>

      {/* Enter */}
      <TouchableOpacity
        style={[styles.specialKey, specialStyle, { flex: 1.5 }]}
        onPress={onEnter}
        activeOpacity={0.55}
      >
        <Text style={[styles.specialLabel, { color: theme.specialKeyText, fontSize: 18 }]}>
          ↵
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    justifyContent: 'center',
    marginVertical: 4,
  },
  specialKey: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  spaceKey: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  specialLabel: {
    fontWeight: '500',
    textAlign: 'center',
  },
  spaceLabel: {
    fontSize: 13,
  },
  emojiLabel: {
    fontSize: 20,
  },
});

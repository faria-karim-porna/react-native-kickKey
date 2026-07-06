import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Theme } from './types';

interface KeyboardHeaderProps {
  language: 'en' | 'bn';
  theme: Theme;
  composingText?: string;
}

export default function KeyboardHeader({
  language,
  theme,
  composingText = '',
}: KeyboardHeaderProps) {
  const langLabel  = language === 'en' ? 'English' : 'বাংলা';
  const langBadge  = language === 'en' ? 'EN' : 'বাং';
  const isComposing = composingText.length > 0;

  return (
    <View style={[styles.header, { backgroundColor: theme.suggestionBg }]}>
      {/* Language badge */}
      <View style={[styles.badge, { backgroundColor: theme.specialKeyBg }]}>
        <Text style={[styles.badgeText, { color: theme.suggestionText }]}>
          {langBadge}
        </Text>
      </View>

      {/* Language name */}
      <Text style={[styles.langName, { color: theme.altText }]}>
        {langLabel}
      </Text>

      {/* Composing text indicator (shows Roman chars being buffered) */}
      {isComposing && (
        <View style={styles.composingContainer}>
          <Text style={[styles.composingLabel, { color: theme.altText }]}>
            composing:{' '}
          </Text>
          <Text style={[styles.composingText, { color: theme.keyText }]}>
            {composingText}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2a2a3e',
  },
  badge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  langName: {
    fontSize: 11,
    flex: 1,
  },
  composingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  composingLabel: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  composingText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

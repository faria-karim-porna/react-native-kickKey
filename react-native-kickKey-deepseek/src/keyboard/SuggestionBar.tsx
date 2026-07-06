import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import type { Theme } from './types';

interface SuggestionBarProps {
  suggestions: string[];
  onSelect: (word: string) => void;
  theme: Theme;
}

function SuggestionBar({ suggestions, onSelect, theme }: SuggestionBarProps) {
  return (
    <View style={[styles.bar, { backgroundColor: theme.suggestionBg }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {suggestions.length === 0 ? (
          <Text style={[styles.placeholder, { color: theme.altText }]}>
            {/* Empty in Phase 2 — suggestions wired in Phase 4 */}
          </Text>
        ) : (
          suggestions.map((word, i) => (
            <React.Fragment key={word}>
              {i > 0 && (
                <View style={[styles.divider, { backgroundColor: theme.suggestionDivider }]} />
              )}
              <TouchableOpacity
                style={styles.chip}
                onPress={() => onSelect(word)}
              >
                <Text style={[styles.chipText, { color: theme.suggestionText }]}>
                  {word}
                </Text>
              </TouchableOpacity>
            </React.Fragment>
          ))
        )}
      </ScrollView>
    </View>
  );
}

export default React.memo(SuggestionBar, (prev, next) =>
  JSON.stringify(prev.suggestions) === JSON.stringify(next.suggestions) &&
  prev.theme === next.theme
);

const styles = StyleSheet.create({
  bar: {
    height: 40,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2a2a3e',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    minHeight: 40,
  },
  placeholder: {
    fontSize: 12,
    paddingHorizontal: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
    alignSelf: 'center',
  },
});

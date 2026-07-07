import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import type { Theme } from './types';

interface SuggestionBarProps {
  suggestions: string[];
  currentWord: string;
  onSelect: (word: string) => void;
  theme: Theme;
}

function SuggestionBar({ suggestions, currentWord, onSelect, theme }: SuggestionBarProps) {
  const handleSelect = useCallback(
    (word: string) => () => onSelect(word),
    [onSelect]
  );

  if (suggestions.length === 0) {
    return (
      <View style={[styles.bar, { backgroundColor: theme.suggestionBg }]}>
        {currentWord.length > 0 && (
          <View style={styles.content}>
            <Text
              style={[styles.echoText, { color: theme.altText }]}
              numberOfLines={1}
            >
              {currentWord}
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.bar, { backgroundColor: theme.suggestionBg }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="always"
      >
        {suggestions.map((word, idx) => {
          // First chip is the autocorrect candidate
          const isAutoCorrect = idx === 0;

          return (
            <React.Fragment key={word + idx}>
              {idx > 0 && (
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: theme.suggestionDivider },
                  ]}
                />
              )}
              <TouchableOpacity
                style={[
                  styles.chip,
                  isAutoCorrect && styles.chipHighlighted,
                ]}
                onPress={handleSelect(word)}
                activeOpacity={0.65}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: isAutoCorrect
                        ? theme.suggestionText
                        : theme.keyText,
                      fontWeight: isAutoCorrect ? '600' : '400',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {word}
                </Text>
              </TouchableOpacity>
            </React.Fragment>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default React.memo(SuggestionBar, (prev, next) =>
  prev.suggestions.length === next.suggestions.length &&
  prev.suggestions.every((s, i) => s === next.suggestions[i]) &&
  prev.currentWord === next.currentWord &&
  prev.theme       === next.theme      &&
  prev.onSelect    === next.onSelect
);

const styles = StyleSheet.create({
  bar: {
    height: 40,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2a2a3e',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  scroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    minHeight: 40,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipHighlighted: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#00BCD4',
  },
  chipText: {
    fontSize: 14,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 20,
    alignSelf: 'center',
  },
  echoText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
});

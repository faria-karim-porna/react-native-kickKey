// ============================================================
// KeyboardTopKeys.tsx — ported from qykey.
//   - Suggestion strip fed by the NATIVE suggestion engine
//     (onSuggestionsUpdated) instead of qykey's local engine.
//   - Mic key uses the speechRecognition stub (RECORD_AUDIO is
//     blocked in this app; see speechRecognition.ts).
//   - Vector icons replaced with unicode glyphs.
// ============================================================

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from './styles';
import { Key } from './Key';
import type { AppLanguage } from './QykeyKeyboard';

type KeyboardTopKeysProps = {
  emojiModeHandler?: () => void;
  symHandler?: () => void;
  language: AppLanguage;
  suggestions?: string[];
  onSuggestionPress?: (word: string) => void;
};

const KeyboardTopKeysComponent = (props: KeyboardTopKeysProps) => {
  const {
    emojiModeHandler,
    symHandler,
    language,
    suggestions = [],
    onSuggestionPress,
  } = props;

  const handleVoicePress = useCallback(() => {
    console.warn('Speech recognition is not available in this build.');
  }, []);

  const renderSuggestionsBar = () => {
    if (suggestions.length > 0) {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {suggestions.slice(0, 3).map((word, index) => (
            <React.Fragment key={word + index}>
              {index > 0 && <View style={styles.suggestionSeparator} />}
              <TouchableOpacity
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                }}
                onPress={() => onSuggestionPress?.(word)}
                activeOpacity={0.6}
              >
                <Text style={styles.suggestionText} numberOfLines={1} ellipsizeMode="tail">
                  {word}
                </Text>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>
      );
    }
    return (
      <Text style={styles.suggestionText}>
        {language === 'banglish' ? 'Type to see Bangla...' : 'Suggestions...'}
      </Text>
    );
  };

  return (
    <>
      <Key special style={{ width: 35 }} hasActiveState onPressHandler={() => emojiModeHandler?.()}>
        🙂
      </Key>
      <View style={styles.suggestionsContainer}>{renderSuggestionsBar()}</View>
      <Key special style={{ width: 40 }} hasActiveState onPressHandler={() => symHandler?.()}>
        SYM
      </Key>
      <Key
        special
        isIcon
        style={{ width: 35 }}
        hasActiveState
        onPressHandler={handleVoicePress}
      >
        <Text style={styles.keyIconText}>🎤</Text>
      </Key>
    </>
  );
};

export const KeyboardTopKeys = React.memo(KeyboardTopKeysComponent);

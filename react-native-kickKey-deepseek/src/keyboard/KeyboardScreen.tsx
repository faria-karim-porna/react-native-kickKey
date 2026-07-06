/**
 * PHASE 3 — Adds Bangla phonetic input.
 *
 * Changes from Phase 2:
 *   - KeyboardHeader shows current language
 *   - BANGLA_ROWS imported and used when language === 'bn'
 *   - Emoji/clipboard stubs remain (Phase 6)
 *
 * ⚠️ Do NOT import from companion app bundles (expo-router, zustand, AsyncStorage).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useKeyboardTheme }          from './hooks/useKeyboardTheme';
import { useKeyboardState }          from './hooks/useKeyboardState';
import KeyboardHeader                from './KeyboardHeader';
import KeyRow                        from './KeyRow';
import SuggestionBar                 from './SuggestionBar';
import BottomRow                     from './BottomRow';
import { ENGLISH_ROWS, BANGLA_ROWS, SYMBOL_ROWS } from './layouts';

export default function KeyboardScreen() {
  const theme = useKeyboardTheme();
  const {
    language, isShift, isCapsLock, isSymbol, isEmoji, isClipboard,
    suggestions, composingText, currentWord,
    handleKeyPress, handleBackspace, handleBackspaceLongPress,
    handleBackspaceLongPressEnd,
    handleSpace, handleEnter, handleShift, handleLanguageSwitch,
    handleSymbolToggle, handleEmojiToggle, handleClipboardToggle,
    handleSuggestionSelect,
  } = useKeyboardState();

  // Pick active layout
  const rows = isSymbol
    ? SYMBOL_ROWS
    : language === 'bn'
    ? BANGLA_ROWS
    : ENGLISH_ROWS;

  if (isEmoji) {
    return (
      <View style={[styles.keyboard, { backgroundColor: theme.keyboardBg }]}>
        <Text style={[styles.stub, { color: theme.altText }]}>
          😊 Emoji panel — Phase 6
        </Text>
        <Text style={[styles.stubClose, { color: theme.suggestionText }]}
          onPress={handleEmojiToggle}>Close</Text>
      </View>
    );
  }

  if (isClipboard) {
    return (
      <View style={[styles.keyboard, { backgroundColor: theme.keyboardBg }]}>
        <Text style={[styles.stub, { color: theme.altText }]}>
          📋 Clipboard panel — Phase 6
        </Text>
        <Text style={[styles.stubClose, { color: theme.suggestionText }]}
          onPress={handleClipboardToggle}>Close</Text>
      </View>
    );
  }

  return (
    <View style={[styles.keyboard, { backgroundColor: theme.keyboardBg }]}>
      {/* Language indicator — NEW in Phase 3 */}
      <KeyboardHeader
        language={language}
        theme={theme}
        composingText={composingText}
      />

      {/* Suggestion bar — Phase 4: real suggestion chips */}
      <SuggestionBar
        suggestions={suggestions}
        currentWord={currentWord}
        onSelect={handleSuggestionSelect}
        theme={theme}
      />

      {/* Key rows — QWERTY, Bangla, or Symbols */}
      {rows.map((row, i) => (
        <KeyRow
          key={i}
          keys={row}
          theme={theme}
          isShift={isShift}
          isCapsLock={isCapsLock}
          onKeyPress={handleKeyPress}
          onBackspace={handleBackspace}
          onBackspaceLongPress={handleBackspaceLongPress}
          onBackspaceLongPressEnd={handleBackspaceLongPressEnd}
          onShift={handleShift}
        />
      ))}

      <BottomRow
        theme={theme}
        language={language}
        isSymbol={isSymbol}
        onSpace={handleSpace}
        onEnter={handleEnter}
        onLanguageSwitch={handleLanguageSwitch}
        onSymbolToggle={handleSymbolToggle}
        onEmojiToggle={handleEmojiToggle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  keyboard:   { width: '100%', paddingBottom: 6 },
  stub:       { textAlign: 'center', padding: 40, fontSize: 14 },
  stubClose:  { textAlign: 'center', paddingBottom: 16, fontSize: 14, fontWeight: '600' },
});

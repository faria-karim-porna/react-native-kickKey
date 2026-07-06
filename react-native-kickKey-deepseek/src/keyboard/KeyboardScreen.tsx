/**
 * PHASE 2 — Full English keyboard.
 *
 * - Real QWERTY keys committed via NativeModules.KickKey.commitKey()
 * - Shift / Caps Lock state managed in useKeyboardState
 * - Symbol panel (numbers + punctuation)
 * - Long-press alt characters popup
 * - Haptic feedback on every key (via Kotlin HapticManager)
 * - Suggestion bar placeholder (wired in Phase 4)
 * - Emoji and clipboard panels are stubs (wired in Phase 6)
 *
 * ⚠️ Do NOT import from companion app bundles (expo-router, zustand, AsyncStorage).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useKeyboardTheme }  from './hooks/useKeyboardTheme';
import { useKeyboardState }  from './hooks/useKeyboardState';
import KeyRow                from './KeyRow';
import SuggestionBar         from './SuggestionBar';
import BottomRow             from './BottomRow';
import { ENGLISH_ROWS, SYMBOL_ROWS } from './layouts';

export default function KeyboardScreen() {
  const theme = useKeyboardTheme();
  const {
    language, isShift, isCapsLock, isSymbol, isEmoji, isClipboard,
    suggestions,
    handleKeyPress,
    handleBackspace,
    handleBackspaceLongPress,
    handleBackspaceLongPressEnd,
    handleSpace,
    handleEnter,
    handleShift,
    handleLanguageSwitch,
    handleSymbolToggle,
    handleEmojiToggle,
    handleClipboardToggle,
    handleSuggestionSelect,
  } = useKeyboardState();

  const rows = isSymbol ? SYMBOL_ROWS : ENGLISH_ROWS;

  // Emoji and clipboard panels are stubs in Phase 2 — wired fully in Phase 6
  if (isEmoji) {
    return (
      <View style={[styles.keyboard, { backgroundColor: theme.keyboardBg }]}>
        <Text style={[styles.stubText, { color: theme.altText }]}>
          😊 Emoji panel coming in Phase 6
        </Text>
        <Text style={[styles.stubClose, { color: theme.suggestionText }]}
          onPress={handleEmojiToggle}
        >
          Close
        </Text>
      </View>
    );
  }

  if (isClipboard) {
    return (
      <View style={[styles.keyboard, { backgroundColor: theme.keyboardBg }]}>
        <Text style={[styles.stubText, { color: theme.altText }]}>
          📋 Clipboard panel coming in Phase 6
        </Text>
        <Text style={[styles.stubClose, { color: theme.suggestionText }]}
          onPress={handleClipboardToggle}
        >
          Close
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.keyboard, { backgroundColor: theme.keyboardBg }]}>
      {/* Suggestion bar — placeholder in Phase 2, functional in Phase 4 */}
      <SuggestionBar
        suggestions={suggestions}
        onSelect={handleSuggestionSelect}
        theme={theme}
      />

      {/* Key rows (QWERTY or Symbols) */}
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

      {/* Bottom row: symbols, language, space, emoji, enter */}
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
  keyboard: {
    width: '100%',
    paddingBottom: 6,
  },
  stubText: {
    textAlign: 'center',
    padding: 40,
    fontSize: 14,
  },
  stubClose: {
    textAlign: 'center',
    paddingBottom: 16,
    fontSize: 14,
    fontWeight: '600',
  },
});

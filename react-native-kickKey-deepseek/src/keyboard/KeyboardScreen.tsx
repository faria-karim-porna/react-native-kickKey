/**
 * PHASE 6 — Real emoji and clipboard panels replace the Phase 2 stubs.
 *
 * Changes from Phase 5:
 *   - isEmoji renders <EmojiPanel /> instead of a placeholder Text block
 *   - isClipboard renders <ClipboardPanel /> instead of a placeholder Text block
 *   - Both panels' onClose props route back to setIsEmoji(false) / setIsClipboard(false)
 *     via the existing handleEmojiToggle / handleClipboardToggle from useKeyboardState
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useKeyboardTheme }          from './hooks/useKeyboardTheme';
import { useKeyboardState }          from './hooks/useKeyboardState';
import KeyboardHeader                from './KeyboardHeader';
import KeyRow                        from './KeyRow';
import SuggestionBar                 from './SuggestionBar';
import BottomRow                     from './BottomRow';
import EmojiPanel                    from './EmojiPanel';
import ClipboardPanel                from './ClipboardPanel';
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

  const rows = isSymbol
    ? SYMBOL_ROWS
    : language === 'bn'
    ? BANGLA_ROWS
    : ENGLISH_ROWS;

  // ── Emoji panel (real, replaces Phase 2 stub) ──────────────────────────────
  if (isEmoji) {
    return (
      <View style={[styles.keyboard, { backgroundColor: theme.keyboardBg }]}>
        <EmojiPanel
          theme={theme}
          onEmojiSelect={(emoji) => handleKeyPress({ label: emoji, code: emoji })}
          onClose={handleEmojiToggle}
        />
      </View>
    );
  }

  // ── Clipboard panel (real, replaces Phase 2 stub) ──────────────────────────
  if (isClipboard) {
    return (
      <View style={[styles.keyboard, { backgroundColor: theme.keyboardBg }]}>
        <ClipboardPanel
          theme={theme}
          onPaste={(text) => handleKeyPress({ label: text, code: text })}
          onClose={handleClipboardToggle}
        />
      </View>
    );
  }

  // ── Standard QWERTY / Bangla / Symbols layout (unchanged from Phase 5) ────
  return (
    <View style={[styles.keyboard, { backgroundColor: theme.keyboardBg }]}>
      <KeyboardHeader
        language={language}
        theme={theme}
        composingText={composingText}
      />

      <SuggestionBar
        suggestions={suggestions}
        currentWord={currentWord}
        onSelect={handleSuggestionSelect}
        theme={theme}
      />

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
        onClipboardToggle={handleClipboardToggle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  keyboard: { width: '100%', paddingBottom: 6 },
});

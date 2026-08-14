/**
 * PHASE 7 — Input type adaptation, number layouts, performance polish.
 *
 * Changes from Phase 6:
 *   - Renders NUMBER_ROWS or PHONE_ROWS based on input field type
 *   - Hides SuggestionBar in password fields
 *   - Passes imeAction to BottomRow for dynamic Enter key label
 *   - Wraps callbacks with useCallback for React.memo compatibility
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
import ErrorBoundary                 from './ErrorBoundary';
import { ENGLISH_ROWS, BANGLA_ROWS, SYMBOL_ROWS, NUMBER_ROWS, PHONE_ROWS } from './layouts';

export default function KeyboardScreen() {

  const theme = useKeyboardTheme();

  const {
    language, isShift, isCapsLock, isSymbol, isEmoji, isClipboard,
    suggestions, composingText, currentWord,
    isPassword, isNumber, isPhone, imeAction,
    handleKeyPress, handleBackspace, handleBackspaceLongPress,
    handleBackspaceLongPressEnd,
    handleSpace, handleEnter, handleShift, handleLanguageSwitch,
    handleSymbolToggle, handleEmojiToggle, handleClipboardToggle,
    handleSuggestionSelect,
  } = useKeyboardState();

  // Phase 7: pick the active row set based on input type
  const rows = (() => {
    if (isPhone)  return PHONE_ROWS;
    if (isNumber) return NUMBER_ROWS;
    if (isSymbol) return SYMBOL_ROWS;
    if (language === 'bn') return BANGLA_ROWS;
    return ENGLISH_ROWS;
  })();

  // ── Emoji panel ──────────────────────────────────────────────────────────
  if (isEmoji) {
    return (
      <ErrorBoundary theme={theme}>
        <View style={[styles.keyboard, { backgroundColor: theme.keyboardBg }]}>
          <EmojiPanel
            theme={theme}
            onEmojiSelect={(emoji) => handleKeyPress({ label: emoji, code: emoji })}
            onClose={handleEmojiToggle}
          />
        </View>
      </ErrorBoundary>
    );
  }

  // ── Clipboard panel ──────────────────────────────────────────────────────
  if (isClipboard) {
    return (
      <ErrorBoundary theme={theme}>
        <View style={[styles.keyboard, { backgroundColor: theme.keyboardBg }]}>
          <ClipboardPanel
            theme={theme}
            onPaste={(text) => handleKeyPress({ label: text, code: text })}
            onClose={handleClipboardToggle}
          />
        </View>
      </ErrorBoundary>
    );
  }

  // ── Standard keyboard layout ─────────────────────────────────────────────
  return (
    <ErrorBoundary theme={theme}>
      <View style={[styles.keyboard, { backgroundColor: theme.keyboardBg }]}>
        <KeyboardHeader
          language={language}
          theme={theme}
          composingText={composingText}
        />

        {/* Phase 7: hide suggestions in password fields */}
        {!isPassword && (
          <SuggestionBar
            suggestions={suggestions}
            currentWord={currentWord}
            onSelect={handleSuggestionSelect}
            theme={theme}
          />
        )}

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
          imeAction={imeAction}
          onSpace={handleSpace}
          onEnter={handleEnter}
          onLanguageSwitch={handleLanguageSwitch}
          onSymbolToggle={handleSymbolToggle}
          onEmojiToggle={handleEmojiToggle}
          onClipboardToggle={handleClipboardToggle}
        />
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    width: '100%',
    flex: 1,
    paddingBottom: 6,
  },
});

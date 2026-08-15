// ============================================================
// QykeyKeyboard.tsx — ported from qykey/components/Keyboard/Keyboard.tsx.
//
// Structure is identical to qykey (slider + top keys, arrows row,
// main keys / symbol pages / emoji board, touchpad mode). The
// difference: every key press goes through the NATIVE KickKey
// module (InputConnection) instead of qykey's local input state.
//
// Language modes:
//   en-US     → English QWERTY, committed directly
//   bn-BD     → Bangla glyph layout, committed directly
//   banglish  → English keys, native Avro-style phonetic engine
//               converts them to Bangla (commitKey(code, 'bn'))
// ============================================================

import React from 'react';
import { View } from 'react-native';
import styles from './styles';
import Touchpad from './Touchpad';
import SymbolKeys from './SymbolKeys';
import SystemKeysMore from './SymbolKeysMore';
import { FeatheredArrowKey } from './FeatheredArrowKey';
import { KeyboardSlider } from './KeyboardSlider';
import { MainKeys } from './MainKeys';
import { Key } from './Key';
import { KeyboardTopKeys } from './KeyboardTopKeys';
import { EmojiBoard } from './EmojiBoard';
import { Circuit } from './circuit/Circuit';
import { useKeyboardState } from '../hooks/useKeyboardState';

export type AppLanguage = 'en-US' | 'bn-BD' | 'banglish';

export default function QykeyKeyboard() {
  const {
    language,
    toggleMode,
    symbolModeStatus,
    isEmojiMode,
    suggestions,
    setToggleMode,
    handleKeyPress,
    handleBackspace,
    handleBackspaceRepeatStart,
    handleBackspaceRepeatEnd,
    handleSpace,
    handleEnter,
    handleLanguageChange,
    handleSymbolToggle,
    handleSymbolNext,
    handleSymbolPrev,
    handleEmojiToggle,
    handleEmojiSelect,
    handleSuggestionSelect,
  } = useKeyboardState();

  const symHandler = () => handleSymbolToggle();
  const sliderHandler = () => setToggleMode(!toggleMode);
  const emojiModeHandler = () => handleEmojiToggle();

  return (
    <View style={styles.keyboardContainer}>
      {/* Circuit board behind the translucent keyboard shell */}
      <Circuit />

      <View style={styles.base}>
        {/* Top Row */}
        <View style={[styles.line, { justifyContent: 'flex-start' }]}>
          <KeyboardSlider toggleMode={toggleMode} sliderHandler={sliderHandler} />
          {!toggleMode ? (
            <KeyboardTopKeys
              symHandler={symHandler}
              emojiModeHandler={emojiModeHandler}
              language={language}
              suggestions={suggestions}
              onSuggestionPress={handleSuggestionSelect}
            />
          ) : null}
        </View>

        <View style={styles.mainKeysContainer}>
          {!toggleMode ? (
            <>
              {isEmojiMode ? (
                <EmojiBoard onEmojiSelect={handleEmojiSelect} />
              ) : (
                <View style={styles.line}>
                  {['"', ':', ','].map((k) => (
                    <Key key={k} onPressHandler={() => handleKeyPress(k)}>
                      {k}
                    </Key>
                  ))}
                  <Key functionKey isIcon>
                    <FeatheredArrowKey direction="left" color="#f2f2f2" />
                  </Key>
                  <Key functionKey isIcon>
                    <FeatheredArrowKey direction="up" color="#f2f2f2" />
                  </Key>
                  <Key functionKey isIcon>
                    <FeatheredArrowKey direction="down" color="#f2f2f2" />
                  </Key>
                  <Key functionKey isIcon>
                    <FeatheredArrowKey direction="right" color="#f2f2f2" />
                  </Key>
                  {['.', ';', '?'].map((k) => (
                    <Key key={k} onPressHandler={() => handleKeyPress(k)}>
                      {k}
                    </Key>
                  ))}
                </View>
              )}

              {!isEmojiMode ? (
                symbolModeStatus === 0 ? (
                  <MainKeys
                    onKeyPress={handleKeyPress}
                    onBackspace={handleBackspace}
                    onBackspaceRepeatStart={handleBackspaceRepeatStart}
                    onBackspaceRepeatEnd={handleBackspaceRepeatEnd}
                    onSpace={handleSpace}
                    onEnter={handleEnter}
                    language={language}
                    onLanguageChange={handleLanguageChange}
                  />
                ) : symbolModeStatus === 1 ? (
                  <SymbolKeys
                    onNext={handleSymbolNext}
                    onKeyPress={handleKeyPress}
                    onBackspace={handleBackspace}
                    onEnter={handleEnter}
                  />
                ) : (
                  <SystemKeysMore
                    onPrev={handleSymbolPrev}
                    onBackspace={handleBackspace}
                    onEnter={handleEnter}
                  />
                )
              ) : null}
            </>
          ) : (
            <View style={styles.touchpadArea}>
              <Touchpad />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

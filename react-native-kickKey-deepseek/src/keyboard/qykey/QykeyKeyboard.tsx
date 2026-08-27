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

import React, { useEffect, useRef, useCallback } from 'react';
import { View, PixelRatio } from 'react-native';
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
import KickKey from '../../../modules/kickkey-module';

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
    handleTranscriptComplete,
    handleScrollPage,
    handleScrollRepeatStart,
    handleScrollRepeatEnd,
    handleNavigateHistory,
    handleMouseClick,
    handleDragStart,
    handleDragEnd,
    tapToClick,
    handlePointerShow,
    handlePointerHide,
    handlePointerMove,
    handleRequestPointerPermission,
  } = useKeyboardState();

  const symHandler = () => handleSymbolToggle();
  const sliderHandler = () => setToggleMode(!toggleMode);

  // ── Overlay top-Y measurement ──────────────────────────────────────────────
  // We measure the on-screen Y of the `base` shell (the visible keyboard
  // chrome — slider, top keys, main keys) so the red cursor overlay ends
  // exactly at the top of the base, NOT above it at the Circuit background.
  const keyboardContainerRef = useRef<View>(null);
  const baseRef = useRef<View>(null);
  const overlayMeasureTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const reportOverlayTopY = useCallback(() => {
    // Prefer the `base` ref (the visible keyboard shell) so the overlay
    // stops at the top of the slider / key rows.
    const view = baseRef.current ?? keyboardContainerRef.current;
    if (!view) return;
    view.measureInWindow((_x, y, _w, _h) => {
      if (y > 0) {
        // Convert DP to physical pixels for native WindowManager layout
        const yPx = Math.round(y * PixelRatio.get());
        KickKey.pointerSetOverlayTopY?.(yPx).catch(() => {});
      }
    });
  }, []);

  // The IME window slides up into its final position over ~300ms.
  // Re-measure periodically until the animation settles completely.
  const scheduleOverlayMeasures = useCallback(() => {
    overlayMeasureTimersRef.current.forEach(clearTimeout);
    overlayMeasureTimersRef.current = [50, 150, 300, 500, 800].map((delay) =>
      setTimeout(reportOverlayTopY, delay)
    );
  }, [reportOverlayTopY]);

  useEffect(() => {
    return () => overlayMeasureTimersRef.current.forEach(clearTimeout);
  }, []);

  // Re-measure when entering/leaving touchpad mode — the pointer overlay is
  // (re)shown around this transition, so its bounds must be freshly snapped.
  useEffect(() => {
    if (toggleMode) scheduleOverlayMeasures();
  }, [toggleMode, scheduleOverlayMeasures]);

  const onKeyboardContainerLayout = useCallback(() => {
    reportOverlayTopY();
    scheduleOverlayMeasures();
  }, [reportOverlayTopY, scheduleOverlayMeasures]);
  const emojiModeHandler = () => handleEmojiToggle();

  return (
    <View
      ref={keyboardContainerRef}
      style={styles.keyboardContainer}
      onLayout={onKeyboardContainerLayout}
    >
      {/* Circuit board behind the translucent keyboard shell.
          Frozen while the emoji board is open: its per-frame SVG redraw
          would compete with the emoji FlatList scroll on the UI thread. */}
      <Circuit animated={!isEmojiMode} />

      <View ref={baseRef} style={styles.base}>
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
              onTranscriptComplete={handleTranscriptComplete}
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
              <Touchpad
                onScrollPage={handleScrollPage}
                onScrollRepeatStart={handleScrollRepeatStart}
                onScrollRepeatEnd={handleScrollRepeatEnd}
                onNavigateHistory={handleNavigateHistory}
                onMouseClick={handleMouseClick}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                tapToClick={tapToClick}
                onPointerShow={handlePointerShow}
                onPointerHide={handlePointerHide}
                onPointerMove={handlePointerMove}
                onRequestPointerPermission={handleRequestPointerPermission}
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

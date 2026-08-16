import React, { useState, useCallback } from "react";
import { View } from "react-native";
import Touchpad from "./Touchpad";
import SymbolKeys from "./SymbolKeys";
import SystemKeysMore from "./SymbolKeysMore";
import styles from "../../assets/styles/styles";
import { FeatheredArrowKey } from "./FeatheredArrowKey";
import { KeyboardSlider } from "./KeyboardSlider";
import { MainKeys } from "./MainKeys";
import { Key } from "./Key";
import { KeyboardTopKeys } from "./KeyboardTopKeys";
import { EmojiBoard } from "./EmojiBoard";
import { useKeyboardSuggestions } from "../../keyboard/hooks/useKeyboardSuggestions";
import { useBanglish } from "../../keyboard/banglish/useBanglish";
import { removeLastGrapheme } from "../../helper/grapheme";

export type AppLanguage = "en-US" | "bn-BD" | "banglish";

export default function Keyboard() {
  const [toggleMode, setToggleMode] = useState(false);
  const [symbolModeStatus, setSymbolModeStatus] = useState<0 | 1 | 2>(0);
  const [isEmojiMode, setIsEmojiMode] = useState(false);
  const [language, setLanguage] = useState<AppLanguage>("en-US");
  const [inputValue, setInputValue] = useState<string>("");

  const isBanglish = language === "banglish";

  const symHandler = () => (symbolModeStatus === 0 ? setSymbolModeStatus(1) : setSymbolModeStatus(0));
  const sliderHandler = () => setToggleMode(!toggleMode);
  const emojiModeHandler = () => setIsEmojiMode(!isEmojiMode);

  // ─── Suggestions hook ─────────────────────────────────────────────────────
  const { suggestions, getImmediateCorrection, isReady } = useKeyboardSuggestions(
    isBanglish ? "" : inputValue,
    isBanglish ? "en-US" : (language as "en-US" | "bn-BD"),
  );

  // ─── Simple key press — no autocorrect interception needed ────────────────
  const handleKeyPress = useCallback((key: string) => {
    setInputValue((prev) => prev + key);
  }, []);

  const handleBackspace = useCallback(() => {
    setInputValue((prev) => removeLastGrapheme(prev));
  }, []);

  const handleTextChange = useCallback((newText: string) => {
    setInputValue(newText);
  }, []);

  const onTranscriptComplete = useCallback((text: string) => {
    setInputValue((prev) => (prev ? prev + " " + text : text));
  }, []);

  const cycleLanguage = useCallback((lang: AppLanguage) => {
    setLanguage(lang);
    setInputValue("");
  }, []);

  // ─── Banglish hook ────────────────────────────────────────────────────────
  const { suggestions: banglishSuggestions, commitSuggestion } = useBanglish(isBanglish ? inputValue : "", setInputValue);

  return (
    <View style={styles.base}>
      {/* Top Row */}
      <View style={[styles.line, { justifyContent: "flex-start" }]}>
        <KeyboardSlider toggleMode={toggleMode} sliderHandler={sliderHandler} />
        {!toggleMode ? (
          <KeyboardTopKeys
            symHandler={symHandler}
            emojiModeHandler={emojiModeHandler}
            language={language}
            onTranscriptComplete={onTranscriptComplete}
            currentInput={inputValue}
            onTextChange={handleTextChange}
            banglishSuggestions={isBanglish ? banglishSuggestions : []}
            onBanglishSuggestionPress={commitSuggestion}
            suggestions={isBanglish ? [] : suggestions}
            isReady={isReady}
          />
        ) : null}
      </View>

      <View style={styles.mainKeysContainer}>
        {!toggleMode ? (
          <>
            {isEmojiMode ? (
              <EmojiBoard
                onEmojiSelect={handleKeyPress}
                onBackspace={handleBackspace}
                onClose={() => setIsEmojiMode(false)}
              />
            ) : (
              <View style={styles.line}>
                {['""', ":", ","].map((k) => (
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
                {[".", ";", "?"].map((k) => (
                  <Key key={k} onPressHandler={() => handleKeyPress(k)}>
                    {k}
                  </Key>
                ))}
              </View>
            )}

            {!isEmojiMode ? (
              symbolModeStatus === 0 ? (
                <MainKeys onKeyPress={handleKeyPress} onBackspace={handleBackspace} language={language} setLanguage={cycleLanguage} />
              ) : symbolModeStatus === 1 ? (
                <SymbolKeys onNext={() => setSymbolModeStatus(2)} />
              ) : (
                <SystemKeysMore onPrev={() => setSymbolModeStatus(1)} />
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
  );
}

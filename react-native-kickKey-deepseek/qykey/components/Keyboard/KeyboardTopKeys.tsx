import React, { useState, useCallback, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import styles from "../../assets/styles/styles";
import { Key } from "./Key";
import Constants from "expo-constants";

const isExpoGo = Constants.appOwnership === "expo";

const { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } = isExpoGo
  ? require("../../keyboard/mocks/expo-speech-recognition.mock")
  : require("expo-speech-recognition");

export type AppLanguage = "en-US" | "bn-BD" | "banglish";

type KeyboardTopKeysProps = {
  symHandler?: () => void;
  emojiModeHandler?: () => void;
  language: AppLanguage;
  onTranscriptComplete?: (text: string) => void;
  currentInput: string;
  onTextChange?: (newText: string) => void;
  banglishSuggestions?: string[];
  onBanglishSuggestionPress?: (word: string) => void;
  // ── now received from Keyboard.tsx instead of computed here ──
  suggestions?: string[];
  isReady?: boolean;
};

const KeyboardTopKeysComponent = (props: KeyboardTopKeysProps) => {
  const {
    symHandler,
    emojiModeHandler,
    language,
    onTranscriptComplete,
    currentInput,
    onTextChange,
    banglishSuggestions = [],
    onBanglishSuggestionPress,
    suggestions = [],
    isReady = false,
  } = props;

  const [recognizing, setRecognizing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [dots, setDots] = useState("");
  const [isMicrophoneActive, setIsMicrophoneActive] = useState(false);

  const isBanglish = language === "banglish";

  // ─── Dot animation ────────────────────────────────────────────────────────
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (recognizing && !transcript) {
      interval = setInterval(() => {
        setDots((prev) => (prev.length < 3 ? prev + "." : "."));
      }, 400);
    } else {
      setDots("");
    }
    return () => clearInterval(interval);
  }, [recognizing, transcript]);

  // ─── Speech Recognition Events ────────────────────────────────────────────
  useSpeechRecognitionEvent("start", () => {
    setRecognizing(true);
    setIsMicrophoneActive(true);
  });

  useSpeechRecognitionEvent("result", (event: any) => {
    setTranscript(event.results[0]?.transcript || "");
    setIsMicrophoneActive(false);
  });

  useSpeechRecognitionEvent("error", () => {
    setRecognizing(false);
    setIsMicrophoneActive(false);
  });

  useSpeechRecognitionEvent("end", () => {
    setRecognizing(false);
    setIsMicrophoneActive(false);
    if (transcript) {
      onTranscriptComplete?.(transcript);
      setTranscript("");
    }
  });

  // ─── Mic Handler ──────────────────────────────────────────────────────────
  const handleVoicePress = async () => {
    if (isExpoGo) {
      console.warn("Speech recognition is not available in Expo Go.");
      return;
    }
    if (recognizing) {
      ExpoSpeechRecognitionModule.stop();
    } else {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) return;
      setTranscript("");
      try {
        ExpoSpeechRecognitionModule.start({
          lang: isBanglish ? "en-US" : language,
          interimResults: true,
          requiresOnDeviceRecognition: false,
        });
      } catch (e) {
        console.error("Speech recognition error:", e);
        setRecognizing(false);
        setIsMicrophoneActive(false);
      }
    }
  };

  // ─── Suggestion tap ───────────────────────────────────────────────────────
  const handleSuggestionPress = useCallback(
    (word: string) => {
      const replaced = currentInput.replace(/[\p{L}\p{M}]+$/u, word + " ");
      onTextChange?.(replaced);
    },
    [currentInput, onTextChange],
  );

  const activeSuggestions = isBanglish ? banglishSuggestions : suggestions;
  const handleActiveSuggestionPress = isBanglish ? (word: string) => onBanglishSuggestionPress?.(word) : handleSuggestionPress;

  const isListening = recognizing;
  const listeningText = transcript ? transcript : `${language === "bn-BD" ? "শুনছি" : "Listening"}${dots}`;

  const renderSuggestionsBar = () => {
    if (isListening) {
      return (
        <Text style={styles.suggestionText} numberOfLines={1}>
          {listeningText}
        </Text>
      );
    }
    if (!isBanglish && !isReady) {
      return <Text style={styles.suggestionText}>Loading...</Text>;
    }
    if (activeSuggestions.length > 0) {
      return (
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          {activeSuggestions.slice(0, 3).map((word, index) => (
            <React.Fragment key={word}>
              {index > 0 && <View style={styles.suggestionSeparator} />}
              <TouchableOpacity
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                }}
                onPress={() => handleActiveSuggestionPress(word)}
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
    return <Text style={styles.suggestionText}>{isBanglish ? "Type to see Bangla..." : "Suggestions..."}</Text>;
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
        iconType="fontawesome"
        iconName="microphone"
        iconColor="#444"
        onPressHandler={handleVoicePress}
        isStatusActive={isMicrophoneActive}
      />
    </>
  );
};

export const KeyboardTopKeys = React.memo(KeyboardTopKeysComponent);

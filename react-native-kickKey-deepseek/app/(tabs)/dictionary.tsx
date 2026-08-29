import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useSettingsStore } from "../../store/settingsStore";
import { useKickKeyBridge } from "../../hooks/useKickKeyBridge";
import { useAppColors } from "../../hooks/useAppColors";
import { useTranslation } from "../../hooks/useTranslation";

export default function DictionaryScreen() {
  const customWords = useSettingsStore((s) => s.customWords);
  const addCustomWord = useSettingsStore((s) => s.addCustomWord);
  const removeCustomWord = useSettingsStore((s) => s.removeCustomWord);
  const { setDictionaryWords } = useKickKeyBridge();
  const colors = useAppColors();
  const t = useTranslation();

  const [input, setInput] = useState("");

  useEffect(() => {
    setDictionaryWords(customWords).catch(() => {});
  }, [customWords]);

  const handleAdd = () => {
    const trimmed = input.trim();
    if (trimmed.length === 0) return;
    addCustomWord(trimmed);
    setInput("");
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{t.dictionaryTitle}</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {t.dictionaryDescription}
            </Text>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.inputText, borderTopColor: colors.cardBorderTL, borderLeftColor: colors.cardBorderTL, borderBottomColor: colors.cardBorderBR, borderRightColor: colors.cardBorderBR }]}
              placeholder={t.addWordPlaceholder}
              placeholderTextColor={colors.textMuted}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleAdd}
              autoCapitalize="none"
              returnKeyType="done"
            />
            <Pressable
              style={({ pressed }) => [styles.addButton, { backgroundColor: colors.accent, borderTopColor: colors.cardBorderTL, borderLeftColor: colors.cardBorderTL, borderBottomColor: colors.cardBorderBR, borderRightColor: colors.cardBorderBR, shadowColor: colors.cardShadow }, pressed && styles.addButtonPressed]}
              onPress={handleAdd}
            >
              <Text style={[styles.addButtonText, { color: colors.buttonText }]}>{t.add}</Text>
            </Pressable>
          </View>

          <FlatList
            data={customWords}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: colors.textMuted }]}>
                {t.emptyDictionary}
              </Text>
            }
            renderItem={({ item }) => (
              <View style={[styles.wordRow, { backgroundColor: colors.card, borderTopColor: colors.cardBorderTL, borderLeftColor: colors.cardBorderTL, borderBottomColor: colors.cardBorderBR, borderRightColor: colors.cardBorderBR, shadowColor: colors.cardShadow }]}>
                <Text style={[styles.wordText, { color: colors.textSecondary }]}>{item}</Text>
                <TouchableOpacity onPress={() => removeCustomWord(item)}>
                  <Svg width={18} height={18} viewBox="0 0 24 24">
                    <Path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill={colors.textMuted} />
                  </Svg>
                </TouchableOpacity>
              </View>
            )}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  flex: { flex: 1 },
  header: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 6 },
  subtitle: { fontSize: 13, lineHeight: 18 },
  inputRow: { flexDirection: "row", paddingHorizontal: 20, paddingVertical: 12, gap: 10 },
  input: { flex: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, borderTopWidth: 2, borderLeftWidth: 2, borderBottomWidth: 1, borderRightWidth: 1 },
  addButton: { borderRadius: 10, paddingHorizontal: 18, justifyContent: "center", borderTopWidth: 1.5, borderLeftWidth: 1.5, borderBottomWidth: 2, borderRightWidth: 2, shadowOffset: { width: -2, height: -2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 5 },
  addButtonPressed: { transform: [{ translateY: 1 }], borderTopWidth: 2, borderLeftWidth: 2, borderBottomWidth: 0, borderRightWidth: 0, shadowOffset: { width: 1, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1, elevation: 2 },
  addButtonText: { fontWeight: "700", fontSize: 14 },
  list: { paddingHorizontal: 20 },
  wordRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 10, padding: 14, marginBottom: 8, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderBottomWidth: 2, borderRightWidth: 2, shadowOffset: { width: -3, height: -3 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 6 },
  wordText: { fontSize: 15 },
  empty: { textAlign: "center", marginTop: 40, fontSize: 14 },
});

import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Circuit } from "../../src/keyboard/qykey/circuit/Circuit";
import Svg, { Path } from "react-native-svg";
import { useSetupStatus } from "../../hooks/useSetupStatus";
import { useSettingsStore } from "../../store/settingsStore";

export default function HomeScreen() {
  const { isEnabled, isDefault, isFullySetUp } = useSetupStatus();
  const language = useSettingsStore((s) => s.language);
  const [testText, setTestText] = React.useState("");

  return (
    <View style={styles.root}>
      <Circuit animated />
      <View style={styles.overlay} />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>KickKey</Text>
          <Text style={styles.subtitle}>Your custom keyboard</Text>

          <View style={styles.statusCard}>
            <StatusRow label="Keyboard Enabled" value={isEnabled} />
            <StatusRow label="Set as Default" value={isDefault} />
            <StatusRow
              label="Active Language"
              value={language === "en" ? "English" : "বাংলা"}
              isText
            />
          </View>

          {isFullySetUp && (
            <>
              <Text style={styles.sectionLabel}>Try it out</Text>
              <TextInput
                style={styles.testInput}
                placeholder="Tap here and start typing..."
                placeholderTextColor="#8a8a8a"
                value={testText}
                onChangeText={setTestText}
                multiline
              />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function StatusRow({
  label,
  value,
  isText = false,
}: {
  label: string;
  value: boolean | string;
  isText?: boolean;
}) {
  return (
    <View style={styles.statusRow}>
      <Text style={styles.statusLabel}>{label}</Text>
      {isText ? (
        <Text style={styles.statusTextValue}>{value as string}</Text>
      ) : (
        <View style={styles.statusValueRow}>
          <Svg width={16} height={16} viewBox="0 0 24 24">
            {value ? (
              <Path
                d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
                fill="#8594aa"
              />
            ) : (
              <Path
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                fill="#8a8a8a"
              />
            )}
          </Svg>
          <Text
            style={[
              styles.statusValue,
              { color: value ? "#8594aa" : "#8a8a8a" },
            ]}
          >
            {value ? "Yes" : "No"}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: "#e0e5ecac" },
  container: { flex: 1, backgroundColor: "transparent" },
  scroll: { padding: 20, paddingTop: 12, paddingBottom: 100 },
  title: { fontSize: 32, fontWeight: "bold", color: "#444" },
  subtitle: { fontSize: 14, color: "#888", marginBottom: 24 },
  statusCard: {
    backgroundColor: "rgba(224,229,236,0.92)",
    borderRadius: 12,
    padding: 18,
    marginBottom: 28,
    // Neumorphic raised effect
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: "rgba(0,0,0,0.15)",
    borderLeftColor: "rgba(0,0,0,0.15)",
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomColor: "rgba(255,255,255,0.8)",
    borderRightColor: "rgba(255,255,255,0.8)",
    shadowColor: "#000",
    shadowOffset: { width: -3, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  statusLabel: { color: "#444", fontSize: 14 },
  statusValueRow: { flexDirection: "row", alignItems: "center" },
  statusValue: { fontSize: 14, fontWeight: "600", marginLeft: 6 },
  statusTextValue: { color: "#8594aa", fontSize: 14, fontWeight: "600" },
  sectionLabel: {
    color: "#888",
    fontSize: 12,
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  testInput: {
    backgroundColor: "#d1d9e6",
    borderRadius: 12,
    padding: 16,
    color: "#444",
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
    // Neumorphic inset effect
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopColor: "rgba(0,0,0,0.15)",
    borderLeftColor: "rgba(0,0,0,0.15)",
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.7)",
    borderRightColor: "rgba(255,255,255,0.7)",
  },
});

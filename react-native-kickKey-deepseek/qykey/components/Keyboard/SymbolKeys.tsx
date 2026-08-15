import React from "react";
import { View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import styles from "../../assets/styles/styles";
import { Key } from "./Key";

type SymbolKeysProps = {
  onNext?: () => void;
};

export default function SymbolKeys({ onNext }: SymbolKeysProps) {
  return (
    <View style={styles.container}>
      {/* 1. Number / Symbol Row */}
      <View style={styles.line}>
        {["@", "#"].map((s, i) => (
          <React.Fragment key={s}>
            <Key>{s}</Key>
            {i === 0 && (
              <>
                <Key special>(</Key>
                <Key special>)</Key>
                <Key functionKey>+</Key>
                <Key functionKey>-</Key>
                <Key functionKey>*</Key>
                <Key functionKey>/</Key>
                <Key special>{"{"}</Key>
                <Key special>{"}"}</Key>
              </>
            )}
          </React.Fragment>
        ))}
      </View>

      {/* 2. Q Row Symbols */}
      <View style={styles.line}>
        <Key>%</Key>
        <Key special>[</Key>
        <Key special>]</Key>
        {["!", "$", "^"].map((s) => (
          <Key key={s}>{s}</Key>
        ))}
        <Key special>{"<"}</Key>
        <Key special>{">"}</Key>
        <Key>&</Key>
      </View>

      {/* 3. A Row Symbols */}
      <View style={[styles.line, styles.symNextLine]}>
        <View style={styles.symNextLineInner}>
          {["=", "`", "'", "_", "~", "\\", "|"].map((s) => (
            <Key key={s}>{s}</Key>
          ))}
        </View>
        <Key
          functionKey
          style={styles.moreWider}
          onPressHandler={() => onNext?.()}
        >
          Next
        </Key>
      </View>

      {/* 4. Z Row (Shift + F1-F7 + Backspace) */}
      <View style={styles.line}>
        <Key special style={styles.wider} isIcon>
          <MaterialCommunityIcons
            name="arrow-up-bold-outline"
            size={14}
            color="#2c2b2b"
          />
        </Key>
        {["F1", "F2", "F3", "F4", "F5", "F6", "F7"].map((f) => (
          <Key key={f} functionKey>
            {f}
          </Key>
        ))}
        <Key special style={styles.wider} isIcon>
          <MaterialCommunityIcons
            name="backspace-outline"
            size={14}
            color="#2c2b2b"
          />
        </Key>
      </View>

      {/* 5. Bottom Row (Ctrl + F8-F12 + Enter) */}
      <View style={[styles.line, styles.lastLine]}>
        <Key special style={styles.wider}>
          Ctrl
        </Key>
        <View style={styles.lastLineInner}>
          {["F8", "F9", "F10", "F11", "F12"].map((f) => (
            <Key key={f} functionKey>
              {f}
            </Key>
          ))}
        </View>
        <Key special style={styles.wider} isIcon>
          <MaterialCommunityIcons
            name="keyboard-return"
            size={14}
            color="#2c2b2b"
          />
        </Key>
      </View>
    </View>
  );
}

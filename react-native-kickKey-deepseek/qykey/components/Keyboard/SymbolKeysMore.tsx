import React from "react";
import { View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import styles from "../../assets/styles/styles";
import { Key } from "./Key";

type SystemKeysMoreProps = {
  onPrev?: () => void;
};

export default function SystemKeysMore({ onPrev }: SystemKeysMoreProps) {
  return (
    <View style={styles.container}>
      {/* 1. PrintScreen Row */}
      <View style={[styles.line, styles.largeKeyLine]}>
        <Key style={styles.extraWider}>PrtSc</Key>
        <Key style={styles.extraWider}>ScrLck</Key>
        <Key style={styles.extraWider}>Pause</Key>
      </View>

      {/* 2. Navigation Row 1 */}
      <View style={[styles.line, styles.largeKeyLine]}>
        <Key style={styles.extraWider}>Insert</Key>
        <Key style={styles.extraWider}>Home</Key>
        <Key style={styles.extraWider}>Pg Up</Key>
      </View>

      {/* 3. Navigation Row 2 + Prev Toggle */}
      <View style={[styles.line, styles.largeKeyLine]}>
        <Key style={styles.extraWider}>Del</Key>
        <Key style={styles.extraWider}>End</Key>
        <Key style={styles.extraWider}>Pg Dn</Key>
        <Key
          functionKey
          style={styles.pageBtn}
          onPressHandler={() => onPrev?.()}
        >
          Prev
        </Key>
      </View>

      {/* 4. Utility Icons Row */}
      <View style={[styles.line, styles.utilityLine]}>
        <Key special style={styles.wider} isIcon>
          <MaterialCommunityIcons
            name="arrow-up-bold-outline"
            size={14}
            color="#2c2b2b"
          />
        </Key>
        <View style={styles.utilityLineInner}>
          <Key functionKey isIcon iconType="fontawesome" iconName="sun" />
          <Key functionKey isIcon iconType="fontawesome" iconName="search" />
          <Key functionKey isIcon iconType="fontawesome" iconName="cog" />
          <Key functionKey isIcon iconType="fontawesome" iconName="power-off" />
        </View>
        <Key special style={styles.wider} isIcon>
          <MaterialCommunityIcons
            name="backspace-outline"
            size={14}
            color="#2c2b2b"
          />
        </Key>
      </View>

      {/* 5. Audio Row */}
      <View style={[styles.line, styles.lastLine]}>
        <Key special style={styles.wider}>
          Ctrl
        </Key>
        <View style={styles.lastLineInner}>
          <Key
            functionKey
            isIcon
            iconType="fontawesome"
            iconName="volume-mute"
          />
          <Key
            functionKey
            isIcon
            iconType="fontawesome"
            iconName="volume-down"
          />
          <Key functionKey isIcon iconType="fontawesome" iconName="volume-up" />
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

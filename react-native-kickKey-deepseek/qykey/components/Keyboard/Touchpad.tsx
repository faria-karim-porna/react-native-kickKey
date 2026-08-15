import React from "react";
import { View, Text } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import styles from "../../assets/styles/styles";
import { Key } from "./Key";

export default function Touchpad() {
  return (
    <View style={styles.touchpadContainer}>
      {/* Surface: Recessed / Carved out look */}
      <View style={styles.touchpadSurface}></View>

      <View style={styles.touchpadButtons}>
        {/* Nav Buttons Row */}
        <View style={styles.touchpadButtonArea}>
          <Key variant="nav" isIcon type="mouse">
            <FontAwesome5 name="chevron-left" size={12} color="#888" />
          </Key>

          <Key variant="mouse" type="mouse">
            <Text style={styles.btnText}>L</Text>
          </Key>
        </View>

        {/* Scroll Stack (Middle Column) */}
        <View style={styles.scrollStack}>
          <Key variant="scroll" isIcon type="mouse">
            <FontAwesome5 name="caret-up" size={14} color="#f2f2f2" />
          </Key>
          <Key variant="scroll" isIcon type="mouse">
            <FontAwesome5 name="caret-down" size={14} color="#f2f2f2" />
          </Key>
        </View>

        <View style={styles.touchpadButtonArea}>
          <Key variant="nav" isIcon type="mouse">
            <FontAwesome5 name="chevron-right" size={12} color="#888" />
          </Key>

          <Key variant="mouse" type="mouse">
            <Text style={styles.btnText}>R</Text>
          </Key>
        </View>
      </View>
    </View>
  );
}

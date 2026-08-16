// ============================================================
// Touchpad.tsx — ported from qykey (mouse mode surface).
// Cursor control is not implemented natively yet (same as qykey,
// whose touchpad is also visual-only). Nav / scroll arrows are
// the exact FontAwesome5 chevron / caret glyphs qykey draws
// (via icons.tsx).
// ============================================================

import React from 'react';
import { View, Text } from 'react-native';
import styles from './styles';
import { Key } from './Key';
import { FA5Icon } from './icons';

export default function Touchpad() {
  return (
    <View style={styles.touchpadContainer}>
      {/* Surface: Recessed / Carved out look */}
      <View style={styles.touchpadSurface}></View>

      <View style={styles.touchpadButtons}>
        {/* Nav Buttons Row */}
        <View style={styles.touchpadButtonArea}>
          <Key variant="nav" isIcon type="mouse">
            <FA5Icon name="chevron-left" size={12} color="#888" />
          </Key>

          <Key variant="mouse" type="mouse">
            <Text style={styles.btnText}>L</Text>
          </Key>
        </View>

        {/* Scroll Stack (Middle Column) */}
        <View style={styles.scrollStack}>
          <Key variant="scroll" isIcon type="mouse">
            <FA5Icon name="caret-up" size={14} color="#f2f2f2" />
          </Key>
          <Key variant="scroll" isIcon type="mouse">
            <FA5Icon name="caret-down" size={14} color="#f2f2f2" />
          </Key>
        </View>

        <View style={styles.touchpadButtonArea}>
          <Key variant="nav" isIcon type="mouse">
            <FA5Icon name="chevron-right" size={12} color="#888" />
          </Key>

          <Key variant="mouse" type="mouse">
            <Text style={styles.btnText}>R</Text>
          </Key>
        </View>
      </View>
    </View>
  );
}

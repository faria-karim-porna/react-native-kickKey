// ============================================================
// Touchpad.tsx — ported from qykey (mouse mode surface).
// Cursor control is not implemented natively yet (same as qykey,
// whose touchpad is also visual-only). FontAwesome5 icons are
// replaced with unicode glyphs.
// ============================================================

import React from 'react';
import { View, Text } from 'react-native';
import styles from './styles';
import { Key } from './Key';

export default function Touchpad() {
  return (
    <View style={styles.touchpadContainer}>
      {/* Surface: Recessed / Carved out look */}
      <View style={styles.touchpadSurface}></View>

      <View style={styles.touchpadButtons}>
        {/* Nav Buttons Row */}
        <View style={styles.touchpadButtonArea}>
          <Key variant="nav" isIcon type="mouse">
            <Text style={{ color: '#888', fontSize: 14, fontWeight: '700' }}>‹</Text>
          </Key>

          <Key variant="mouse" type="mouse">
            <Text style={styles.btnText}>L</Text>
          </Key>
        </View>

        {/* Scroll Stack (Middle Column) */}
        <View style={styles.scrollStack}>
          <Key variant="scroll" isIcon type="mouse">
            <Text style={{ color: '#f2f2f2', fontSize: 10, fontWeight: '700' }}>▲</Text>
          </Key>
          <Key variant="scroll" isIcon type="mouse">
            <Text style={{ color: '#f2f2f2', fontSize: 10, fontWeight: '700' }}>▼</Text>
          </Key>
        </View>

        <View style={styles.touchpadButtonArea}>
          <Key variant="nav" isIcon type="mouse">
            <Text style={{ color: '#888', fontSize: 14, fontWeight: '700' }}>›</Text>
          </Key>

          <Key variant="mouse" type="mouse">
            <Text style={styles.btnText}>R</Text>
          </Key>
        </View>
      </View>
    </View>
  );
}

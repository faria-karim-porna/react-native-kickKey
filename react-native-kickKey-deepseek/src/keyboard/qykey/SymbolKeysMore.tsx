// ============================================================
// SymbolKeysMore.tsx — ported from qykey (system keys page).
// Utility keys (sun/search/cog/power/volume, F-keys, nav keys)
// are display-only, exactly like qykey. Backspace / Enter / Prev
// are wired to the native module.
// ============================================================

import React from 'react';
import { View, Text } from 'react-native';
import styles from './styles';
import { Key } from './Key';

type SystemKeysMoreProps = {
  onPrev?: () => void;
  onBackspace?: () => void;
  onEnter?: () => void;
};

export default function SystemKeysMore({ onPrev, onBackspace, onEnter }: SystemKeysMoreProps) {
  const darkIcon = { color: '#2c2b2b' };

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
          <Text style={[styles.keyIconText, darkIcon]}>▲</Text>
        </Key>
        <View style={styles.utilityLineInner}>
          <Key functionKey isIcon><Text style={styles.keyIconText}>☀️</Text></Key>
          <Key functionKey isIcon><Text style={styles.keyIconText}>🔍</Text></Key>
          <Key functionKey isIcon><Text style={styles.keyIconText}>⚙️</Text></Key>
          <Key functionKey isIcon><Text style={styles.keyIconText}>⏻</Text></Key>
        </View>
        <Key special style={styles.wider} isIcon onPressHandler={onBackspace}>
          <Text style={[styles.keyIconText, darkIcon]}>⌫</Text>
        </Key>
      </View>

      {/* 5. Audio Row */}
      <View style={[styles.line, styles.lastLine]}>
        <Key special style={styles.wider}>
          Ctrl
        </Key>
        <View style={styles.lastLineInner}>
          <Key functionKey isIcon><Text style={styles.keyIconText}>🔇</Text></Key>
          <Key functionKey isIcon><Text style={styles.keyIconText}>🔉</Text></Key>
          <Key functionKey isIcon><Text style={styles.keyIconText}>🔊</Text></Key>
        </View>
        <Key special style={styles.wider} isIcon onPressHandler={onEnter}>
          <Text style={[styles.keyIconText, darkIcon]}>↵</Text>
        </Key>
      </View>
    </View>
  );
}

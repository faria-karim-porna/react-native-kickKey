// ============================================================
// SymbolKeysMore.tsx — ported from qykey (system keys page).
// Now accepts themeColors for dynamic styling.
// ============================================================

import React, { useMemo } from 'react';
import { View } from 'react-native';
import { createKeyboardStyles } from './dynamicStyles';
import { Key } from './Key';
import { FA5Icon, MDIIcon } from './icons';
import type { KeyboardThemeColors } from '../hooks/useKeyboardTheme';

type SystemKeysMoreProps = {
  onPrev?: () => void;
  onBackspace?: () => void;
  onEnter?: () => void;
  themeColors: KeyboardThemeColors;
};

export default function SystemKeysMore({ onPrev, onBackspace, onEnter, themeColors }: SystemKeysMoreProps) {
  const styles = useMemo(() => createKeyboardStyles(themeColors), [themeColors]);

  return (
    <View style={styles.container}>
      <View style={[styles.line, styles.largeKeyLine]}>
        <Key style={styles.extraWider} themeColors={themeColors}>PrtSc</Key>
        <Key style={styles.extraWider} themeColors={themeColors}>ScrLck</Key>
        <Key style={styles.extraWider} themeColors={themeColors}>Pause</Key>
      </View>

      <View style={[styles.line, styles.largeKeyLine]}>
        <Key style={styles.extraWider} themeColors={themeColors}>Insert</Key>
        <Key style={styles.extraWider} themeColors={themeColors}>Home</Key>
        <Key style={styles.extraWider} themeColors={themeColors}>Pg Up</Key>
      </View>

      <View style={[styles.line, styles.largeKeyLine]}>
        <Key style={styles.extraWider} themeColors={themeColors}>Del</Key>
        <Key style={styles.extraWider} themeColors={themeColors}>End</Key>
        <Key style={styles.extraWider} themeColors={themeColors}>Pg Dn</Key>
        <Key functionKey style={styles.pageBtn} onPressHandler={() => onPrev?.()} themeColors={themeColors}>
          Prev
        </Key>
      </View>

      <View style={[styles.line, styles.utilityLine]}>
        <Key special style={styles.wider} isIcon themeColors={themeColors}>
          <MDIIcon name="arrow-up-bold-outline" size={16} color={themeColors.keyText} />
        </Key>
        <View style={styles.utilityLineInner}>
          <Key functionKey isIcon themeColors={themeColors}><FA5Icon name="sun" size={14} color={themeColors.keyText} /></Key>
          <Key functionKey isIcon themeColors={themeColors}><FA5Icon name="search" size={14} color={themeColors.keyText} /></Key>
          <Key functionKey isIcon themeColors={themeColors}><FA5Icon name="cog" size={14} color={themeColors.keyText} /></Key>
          <Key functionKey isIcon themeColors={themeColors}><FA5Icon name="power-off" size={14} color={themeColors.keyText} /></Key>
        </View>
        <Key special style={styles.wider} isIcon onPressHandler={onBackspace} themeColors={themeColors}>
          <MDIIcon name="backspace-outline" size={16} color={themeColors.keyText} />
        </Key>
      </View>

      <View style={[styles.line, styles.lastLine]}>
        <Key special style={styles.wider} themeColors={themeColors}>Ctrl</Key>
        <View style={styles.lastLineInner}>
          <Key functionKey isIcon themeColors={themeColors}><FA5Icon name="volume-mute" size={14} color={themeColors.keyText} /></Key>
          <Key functionKey isIcon themeColors={themeColors}><FA5Icon name="volume-down" size={14} color={themeColors.keyText} /></Key>
          <Key functionKey isIcon themeColors={themeColors}><FA5Icon name="volume-up" size={14} color={themeColors.keyText} /></Key>
        </View>
        <Key special style={styles.wider} isIcon onPressHandler={onEnter} themeColors={themeColors}>
          <MDIIcon name="keyboard-return" size={16} color={themeColors.keyText} />
        </Key>
      </View>
    </View>
  );
}

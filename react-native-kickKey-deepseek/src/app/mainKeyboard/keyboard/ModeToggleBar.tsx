// ============================================================
// ModeToggleBar.tsx — ported from qykey (keyboard ⇄ touchpad).
// Now accepts themeColors for dynamic styling.
// ============================================================

import React, { useRef, useMemo } from 'react';
import { View, Pressable, Animated, Easing } from 'react-native';
import { createKeyboardStyles } from '../../../../assets/styles/dynamicStyles';
import { FA5Icon } from './KeyIcons';
import type { KeyboardThemeColors } from '../../../hooks/useKeyboardTheme';

type ModeToggleBarProps = {
  toggleMode?: boolean;
  onToggleMode?: () => void;
  themeColors: KeyboardThemeColors;
};

const ModeToggleBarComponent = (props: ModeToggleBarProps) => {
  const { toggleMode, onToggleMode, themeColors } = props;
  const styles = useMemo(() => createKeyboardStyles(themeColors), [themeColors]);
  const knobAnim = useRef(new Animated.Value(0)).current;

  const handleToggle = () => {
    const toValue = toggleMode ? 0 : 1;
    onToggleMode?.();
    Animated.timing(knobAnim, {
      toValue,
      duration: 350,
      useNativeDriver: false,
      easing: Easing.out(Easing.back(1.2)),
    }).start();
  };

  const knobTranslate = knobAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 40],
  });

  return (
    <Pressable style={styles.toggleContainer} onPress={handleToggle}>
      <View style={styles.slider}>
        <Animated.View style={[styles.knob, { left: knobTranslate }]} />
        <View style={styles.iconLayer}>
          <FA5Icon name="keyboard" size={14} color={!toggleMode ? themeColors.keyText : themeColors.specialKeyText} />
          <FA5Icon name="mouse-pointer" size={14} color={toggleMode ? themeColors.keyText : themeColors.specialKeyText} />
        </View>
      </View>
    </Pressable>
  );
};

export const ModeToggleBar = React.memo(ModeToggleBarComponent);

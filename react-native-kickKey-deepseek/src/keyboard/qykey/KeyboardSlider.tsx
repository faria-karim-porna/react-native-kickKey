// ============================================================
// KeyboardSlider.tsx — ported from qykey (keyboard ⇄ touchpad).
// Now accepts themeColors for dynamic styling.
// ============================================================

import React, { useRef, useMemo } from 'react';
import { View, Pressable, Animated, Easing } from 'react-native';
import { createKeyboardStyles } from './dynamicStyles';
import { FA5Icon } from './icons';
import type { KeyboardThemeColors } from '../hooks/useKeyboardTheme';

type KeyboardSliderProps = {
  toggleMode?: boolean;
  sliderHandler?: () => void;
  themeColors: KeyboardThemeColors;
};

const KeyboardSliderComponent = (props: KeyboardSliderProps) => {
  const { toggleMode, sliderHandler, themeColors } = props;
  const styles = useMemo(() => createKeyboardStyles(themeColors), [themeColors]);
  const knobAnim = useRef(new Animated.Value(0)).current;

  const handleToggle = () => {
    const toValue = toggleMode ? 0 : 1;
    sliderHandler?.();
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

export const KeyboardSlider = React.memo(KeyboardSliderComponent);

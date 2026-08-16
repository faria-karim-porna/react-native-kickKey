// ============================================================
// KeyboardSlider.tsx — ported from qykey (keyboard ⇄ touchpad).
// Renders the exact FontAwesome5 "keyboard" / "mouse-pointer"
// glyphs qykey draws (via icons.tsx).
// ============================================================

import React, { useRef } from 'react';
import { View, Pressable, Animated, Easing } from 'react-native';
import styles from './styles';
import { FA5Icon } from './icons';

type KeyboardSliderProps = {
  toggleMode?: boolean;
  sliderHandler?: () => void;
};

const KeyboardSliderComponent = (props: KeyboardSliderProps) => {
  const { toggleMode, sliderHandler } = props;
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
    outputRange: [0, 28], // Perfectly aligned for 60px track and 28px knob
  });

  return (
    <Pressable style={styles.toggleContainer} onPress={handleToggle}>
      <View style={styles.slider}>
        <Animated.View style={[styles.knob, { left: knobTranslate }]} />
        <View style={styles.iconLayer}>
          <FA5Icon name="keyboard" size={10} color={!toggleMode ? '#444' : '#888'} />
          <FA5Icon name="mouse-pointer" size={10} color={toggleMode ? '#444' : '#888'} />
        </View>
      </View>
    </Pressable>
  );
};

export const KeyboardSlider = React.memo(KeyboardSliderComponent);

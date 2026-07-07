import React, { useCallback, useRef } from 'react';
import {
  Animated,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import type { KeyDef, Theme } from './types';

interface KeyProps {
  keyDef: KeyDef;
  theme: Theme;
  isShift: boolean;
  isCapsLock: boolean;
  onPress: (key: KeyDef) => void;
  onLongPress?: (key: KeyDef) => void;
  onLongPressEnd?: () => void;
}

const PRESS_SCALE = 0.88;
const ANIMATION_DURATION = 80;

function Key({
  keyDef, theme, isShift, isCapsLock, onPress, onLongPress, onLongPressEnd,
}: KeyProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const active = isShift || isCapsLock;

  const label = active && keyDef.shiftLabel
    ? keyDef.shiftLabel
    : active && keyDef.code.length === 1
    ? keyDef.code.toUpperCase()
    : keyDef.label;

  const codeToSend = active && keyDef.code.length === 1
    ? keyDef.code.toUpperCase()
    : keyDef.code;

  const effectiveKey: KeyDef = { ...keyDef, code: codeToSend };

  const animatePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: PRESS_SCALE,
        duration: ANIMATION_DURATION / 2,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: ANIMATION_DURATION / 2,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale]);

  const handlePress = useCallback(() => {
    onPress(effectiveKey);
    animatePress();
  }, [effectiveKey, onPress, animatePress]);

  const handleLongPress = useCallback(() => {
    onLongPress?.(keyDef);
  }, [keyDef, onLongPress]);

  const isSpecial = !!keyDef.isSpecial;
  const bgColor = isSpecial ? theme.specialKeyBg : theme.keyBg;
  const textColor = isSpecial ? theme.specialKeyText : theme.keyText;

  return (
    <Animated.View
      style={[
        styles.keyWrapper,
        {
          flex: keyDef.width ?? 1,
          transform: [{ scale }],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.key,
          {
            height: theme.keyHeight,
            backgroundColor: bgColor,
            borderRadius: theme.keyBorderRadius,
            marginHorizontal: theme.keyMargin,
            shadowColor: theme.keyShadow,
          },
        ]}
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressOut={onLongPressEnd}
        delayLongPress={300}
        activeOpacity={0.75}
      >
        {keyDef.icon === 'shift' && (
          <Text style={[styles.iconText, { color: textColor }]}>
            {isCapsLock ? '⇪' : '⇧'}
          </Text>
        )}
        {keyDef.icon === 'backspace' && (
          <Text style={[styles.iconText, { color: textColor }]}>⌫</Text>
        )}
        {keyDef.icon === 'enter' && (
          <Text style={[styles.iconText, { color: textColor }]}>↵</Text>
        )}
        {!keyDef.icon && (
          <Text
            style={[styles.keyLabel, { color: textColor, fontSize: theme.keyFontSize }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {label}
          </Text>
        )}
        {keyDef.altChars && keyDef.altChars.length > 0 && !keyDef.icon && (
          <Text style={[styles.altHint, { color: theme.altText }]} numberOfLines={1}>
            {keyDef.altChars[0]}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default React.memo(Key, (prev, next) =>
  prev.keyDef         === next.keyDef         &&
  prev.isShift        === next.isShift        &&
  prev.isCapsLock     === next.isCapsLock     &&
  prev.theme          === next.theme          &&
  prev.onPress        === next.onPress        &&
  prev.onLongPress    === next.onLongPress    &&
  prev.onLongPressEnd === next.onLongPressEnd
);

const styles = StyleSheet.create({
  keyWrapper: {
    marginVertical: 4,
  },
  key: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
  },
  keyLabel: {
    fontWeight: '500',
    textAlign: 'center',
  },
  iconText: {
    fontSize: 18,
    fontWeight: '400',
  },
  altHint: {
    position: 'absolute',
    top: 3,
    right: 4,
    fontSize: 9,
    opacity: 0.65,
  },
});

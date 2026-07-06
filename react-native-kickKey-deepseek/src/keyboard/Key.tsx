import React, { useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
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

function Key({
  keyDef,
  theme,
  isShift,
  isCapsLock,
  onPress,
  onLongPress,
  onLongPressEnd,
}: KeyProps) {
  // Determine displayed label
  const active = isShift || isCapsLock;
  const label = active && keyDef.shiftLabel
    ? keyDef.shiftLabel
    : active && keyDef.code.length === 1
    ? keyDef.code.toUpperCase()
    : keyDef.label;

  // The code actually committed shifts to uppercase when shift is active
  const codeToSend = active && keyDef.code.length === 1
    ? keyDef.code.toUpperCase()
    : keyDef.code;

  const effectiveKey: KeyDef = { ...keyDef, code: codeToSend };

  const handlePress = useCallback(() => {
    onPress(effectiveKey);
  }, [effectiveKey, onPress]);

  const handleLongPress = useCallback(() => {
    onLongPress?.(keyDef);
  }, [keyDef, onLongPress]);

  const isSpecial = !!keyDef.isSpecial;

  return (
    <TouchableOpacity
      style={[
        styles.key,
        {
          flex: keyDef.width ?? 1,
          height: theme.keyHeight,
          backgroundColor: isSpecial ? theme.specialKeyBg : theme.keyBg,
          borderRadius: theme.keyBorderRadius,
          marginHorizontal: theme.keyMargin,
          elevation: 2,
          shadowColor: theme.keyShadow,
        },
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      onPressOut={onLongPressEnd}
      delayLongPress={300}
      activeOpacity={0.55}
    >
      {/* Icon-only keys (shift arrow, backspace arrow, enter arrow) */}
      {keyDef.icon === 'shift' && (
        <Text style={[styles.iconText, { color: isSpecial ? theme.specialKeyText : theme.keyText }]}>
          {isCapsLock ? '⇪' : '⇧'}
        </Text>
      )}
      {keyDef.icon === 'backspace' && (
        <Text style={[styles.iconText, { color: isSpecial ? theme.specialKeyText : theme.keyText }]}>
          ⌫
        </Text>
      )}
      {keyDef.icon === 'enter' && (
        <Text style={[styles.iconText, { color: isSpecial ? theme.specialKeyText : theme.keyText }]}>
          ↵
        </Text>
      )}

      {/* Standard text key */}
      {!keyDef.icon && (
        <Text
          style={[
            styles.keyLabel,
            {
              color: isSpecial ? theme.specialKeyText : theme.keyText,
              fontSize: theme.keyFontSize,
            },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {label}
        </Text>
      )}

      {/* Alt character hint (top-right corner) */}
      {keyDef.altChars && keyDef.altChars.length > 0 && !keyDef.icon && (
        <Text
          style={[styles.altHint, { color: theme.altText }]}
          numberOfLines={1}
        >
          {keyDef.altChars[0]}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export default React.memo(Key, (prev, next) => {
  return (
    prev.keyDef  === next.keyDef  &&
    prev.isShift === next.isShift &&
    prev.isCapsLock === next.isCapsLock &&
    prev.theme   === next.theme
  );
});

const styles = StyleSheet.create({
  key: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 4,
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

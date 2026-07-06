import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import Key from './Key';
import AltCharsPopup from './AltCharsPopup';
import type { KeyDef, Theme } from './types';

interface KeyRowProps {
  keys: KeyDef[];
  theme: Theme;
  isShift: boolean;
  isCapsLock: boolean;
  onKeyPress: (key: KeyDef) => void;
  onBackspace: () => void;
  onBackspaceLongPress: () => void;
  onBackspaceLongPressEnd: () => void;
  onShift: () => void;
}

interface PopupState {
  chars: string[];
  anchorX: number;
  anchorY: number;
}

function KeyRow({
  keys,
  theme,
  isShift,
  isCapsLock,
  onKeyPress,
  onBackspace,
  onBackspaceLongPress,
  onBackspaceLongPressEnd,
  onShift,
}: KeyRowProps) {
  const [popup, setPopup] = useState<PopupState | null>(null);

  const handleKeyPress = useCallback((key: KeyDef) => {
    if (key.action === 'backspace') { onBackspace(); return; }
    if (key.action === 'shift')     { onShift();    return; }
    onKeyPress(key);
  }, [onKeyPress, onBackspace, onShift]);

  const handleLongPress = useCallback((key: KeyDef) => {
    if (key.action === 'backspace') {
      onBackspaceLongPress();
      return;
    }
    // Show alt chars popup if the key has them
    if (key.altChars && key.altChars.length > 0) {
      // Use approximate coordinates — a precise implementation would use
      // onLayout + ref.measure() on each Key
      setPopup({
        chars: key.altChars,
        anchorX: 80,
        anchorY: 200,
      });
    }
  }, [onBackspaceLongPress]);

  const handleLongPressEnd = useCallback((key: KeyDef) => {
    if (key.action === 'backspace') {
      onBackspaceLongPressEnd();
    }
  }, [onBackspaceLongPressEnd]);

  const handlePopupSelect = useCallback((char: string) => {
    onKeyPress({ label: char, code: char });
  }, [onKeyPress]);

  return (
    <View style={styles.row}>
      {keys.map((key, idx) => (
        <Key
          key={`${key.label}-${idx}`}
          keyDef={key}
          theme={theme}
          isShift={isShift}
          isCapsLock={isCapsLock}
          onPress={handleKeyPress}
          onLongPress={handleLongPress}
          onLongPressEnd={() => handleLongPressEnd(key)}
        />
      ))}

      {popup && (
        <AltCharsPopup
          chars={popup.chars}
          theme={theme}
          anchorX={popup.anchorX}
          anchorY={popup.anchorY}
          onSelect={handlePopupSelect}
          onClose={() => setPopup(null)}
        />
      )}
    </View>
  );
}

export default React.memo(KeyRow, (prev, next) =>
  prev.keys       === next.keys    &&
  prev.isShift    === next.isShift &&
  prev.isCapsLock === next.isCapsLock &&
  prev.theme      === next.theme
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
});

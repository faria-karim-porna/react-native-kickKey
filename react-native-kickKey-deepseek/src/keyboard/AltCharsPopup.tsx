import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import type { Theme } from './types';

interface AltCharsPopupProps {
  chars: string[];
  theme: Theme;
  anchorX: number;
  anchorY: number;
  onSelect: (char: string) => void;
  onClose: () => void;
}

const POPUP_ITEM_SIZE = 44;

export default function AltCharsPopup({
  chars,
  theme,
  anchorX,
  anchorY,
  onSelect,
  onClose,
}: AltCharsPopupProps) {
  const popupWidth = chars.length * POPUP_ITEM_SIZE;
  const screenWidth = Dimensions.get('window').width;

  // Clamp so the popup never goes off-screen right edge
  const left = Math.min(anchorX, screenWidth - popupWidth - 8);

  const handleSelect = useCallback((char: string) => {
    onSelect(char);
    onClose();
  }, [onSelect, onClose]);

  return (
    <Modal
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Invisible full-screen backdrop — tap anywhere to dismiss */}
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1}>
        <View
          style={[
            styles.popup,
            {
              left,
              top: anchorY - POPUP_ITEM_SIZE - 8,
              backgroundColor: theme.popupBg,
              borderRadius: theme.keyBorderRadius + 2,
            },
          ]}
        >
          {chars.map((char) => (
            <TouchableOpacity
              key={char}
              style={[styles.popupItem, { width: POPUP_ITEM_SIZE }]}
              onPress={() => handleSelect(char)}
            >
              <Text style={[styles.popupChar, { color: theme.popupText, fontSize: theme.keyFontSize }]}>
                {char}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  popup: {
    position: 'absolute',
    flexDirection: 'row',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    paddingHorizontal: 4,
  },
  popupItem: {
    height: POPUP_ITEM_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupChar: {
    fontWeight: '500',
  },
});

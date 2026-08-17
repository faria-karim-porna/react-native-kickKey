// ============================================================
// Touchpad.tsx — ported from qykey (mouse mode surface).
// Provides an interactive surface with visual cursor tracking,
// scroll up/down buttons, nav backward/forward buttons, and
// mouse left/right buttons.
// ============================================================

import React, { useRef, useState, useEffect } from 'react';
import { View, Text, PanResponder } from 'react-native';
import styles from './styles';
import { Key } from './Key';
import { FA5Icon } from './icons';

export interface TouchpadProps {
  onMoveCursor?: (direction: 'left' | 'right' | 'up' | 'down') => void;
  onScrollPage?: (direction: 'up' | 'down') => void;
  onNavigateHistory?: (direction: 'backward' | 'forward') => void;
  onMouseClick?: (button: 'left' | 'right') => void;
}

export default function Touchpad({
  onMoveCursor,
  onScrollPage,
  onNavigateHistory,
  onMouseClick,
}: TouchpadProps) {
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  const onMoveCursorRef = useRef(onMoveCursor);
  useEffect(() => {
    onMoveCursorRef.current = onMoveCursor;
  }, [onMoveCursor]);

  const accX = useRef(0);
  const accY = useRef(0);
  const lastDx = useRef(0);
  const lastDy = useRef(0);

  const STEP_THRESHOLD = 14;

  const surfacePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCursor({ x: locationX, y: locationY });
        accX.current = 0;
        accY.current = 0;
        lastDx.current = 0;
        lastDy.current = 0;
      },

      onPanResponderMove: (evt, gestureState) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCursor({ x: locationX, y: locationY });

        const deltaX = gestureState.dx - lastDx.current;
        const deltaY = gestureState.dy - lastDy.current;
        lastDx.current = gestureState.dx;
        lastDy.current = gestureState.dy;

        accX.current += deltaX;
        accY.current += deltaY;

        while (accX.current >= STEP_THRESHOLD) {
          onMoveCursorRef.current?.('right');
          accX.current -= STEP_THRESHOLD;
        }
        while (accX.current <= -STEP_THRESHOLD) {
          onMoveCursorRef.current?.('left');
          accX.current += STEP_THRESHOLD;
        }
        while (accY.current >= STEP_THRESHOLD) {
          onMoveCursorRef.current?.('down');
          accY.current -= STEP_THRESHOLD;
        }
        while (accY.current <= -STEP_THRESHOLD) {
          onMoveCursorRef.current?.('up');
          accY.current += STEP_THRESHOLD;
        }
      },

      onPanResponderRelease: () => {
        setCursor(null);
        accX.current = 0;
        accY.current = 0;
        lastDx.current = 0;
        lastDy.current = 0;
      },

      onPanResponderTerminate: () => {
        setCursor(null);
        accX.current = 0;
        accY.current = 0;
        lastDx.current = 0;
        lastDy.current = 0;
      },
    }),
  ).current;

  return (
    <View style={styles.touchpadContainer}>
      {/* Surface: Recessed / Carved out look with dynamic visual cursor */}
      <View
        style={[styles.touchpadSurface, { overflow: 'hidden', position: 'relative' }]}
        {...surfacePanResponder.panHandlers}
      >
        {cursor && (
          <View
            style={{
              position: 'absolute',
              left: cursor.x - 7,
              top: cursor.y - 7,
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: 'rgba(0, 188, 212, 0.5)',
              borderWidth: 2,
              borderColor: '#00BCD4',
              shadowColor: '#00BCD4',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 4,
              elevation: 4,
              pointerEvents: 'none',
            }}
          />
        )}
      </View>

      <View style={styles.touchpadButtons}>
        {/* Nav Buttons Row */}
        <View style={styles.touchpadButtonArea}>
          <Key
            variant="nav"
            isIcon
            type="mouse"
            onPressHandler={() => onNavigateHistory?.('backward')}
          >
            <FA5Icon name="chevron-left" size={12} color="#888" />
          </Key>

          <Key
            variant="mouse"
            type="mouse"
            onPressHandler={() => onMouseClick?.('left')}
          >
            <Text style={styles.btnText}>L</Text>
          </Key>
        </View>

        {/* Scroll Stack (Middle Column) */}
        <View style={styles.scrollStack}>
          <Key
            variant="scroll"
            isIcon
            type="mouse"
            onPressHandler={() => onScrollPage?.('up')}
          >
            <FA5Icon name="caret-up" size={14} color="#f2f2f2" />
          </Key>
          <Key
            variant="scroll"
            isIcon
            type="mouse"
            onPressHandler={() => onScrollPage?.('down')}
          >
            <FA5Icon name="caret-down" size={14} color="#f2f2f2" />
          </Key>
        </View>

        <View style={styles.touchpadButtonArea}>
          <Key
            variant="nav"
            isIcon
            type="mouse"
            onPressHandler={() => onNavigateHistory?.('forward')}
          >
            <FA5Icon name="chevron-right" size={12} color="#888" />
          </Key>

          <Key
            variant="mouse"
            type="mouse"
            onPressHandler={() => onMouseClick?.('right')}
          >
            <Text style={styles.btnText}>R</Text>
          </Key>
        </View>
      </View>
    </View>
  );
}


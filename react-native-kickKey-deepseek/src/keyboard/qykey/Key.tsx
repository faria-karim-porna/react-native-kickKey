// ============================================================
// Key.tsx — "Chocolate bar" key, ported from qykey.
//
// Differences from the qykey original:
//   - Vector-icon rendering (iconType/iconName/iconColor) removed —
//     icon fonts are unavailable in the IME process, so icons are
//     passed as children (Text glyphs).
//   - Optional onRepeatStart/onRepeatEnd added for backspace
//     long-press repeat (invisible UI, preserves the existing
//     backspace-repeat feature).
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, PanResponder } from 'react-native';
import styles from './styles';
import type { AppLanguage } from './QykeyKeyboard';

const variantStyles: any = {
  nav: styles.navBtn,
  scroll: styles.scrollBtn,
  mouse: styles.mouseBtn,
};

interface KeyProps {
  children?: React.ReactNode;
  style?: any;
  special?: boolean;
  functionKey?: boolean;
  flex?: number;
  isIcon?: boolean;
  hasActiveState?: boolean;
  onPressHandler?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  type?: 'keyboard' | 'mouse';
  variant?: any;
  isStatusActive?: boolean;
  language?: AppLanguage;
  /** Start repeating (e.g. backspace long-press). Called on press-in. */
  onRepeatStart?: () => void;
  /** Stop repeating. Called on press-out. */
  onRepeatEnd?: () => void;
}

const KeyComponent = ({
  children,
  style,
  special = false,
  functionKey = false,
  flex = 0,
  isIcon = false,
  hasActiveState = false,
  onPressHandler,
  onSwipeLeft,
  onSwipeRight,
  type = 'keyboard',
  variant,
  isStatusActive,
  language = 'en-US',
  onRepeatStart,
  onRepeatEnd,
}: KeyProps) => {
  const [pressed, setPressed] = useState(false);
  const [isActive, setIsActive] = useState(isStatusActive || false);

  useEffect(() => {
    if (!isStatusActive) setIsActive(false);
  }, [isStatusActive]);

  const isSwipeable = !!(onSwipeLeft || onSwipeRight);

  // Keep latest callbacks in refs so the PanResponder never goes stale
  const onSwipeLeftRef = useRef(onSwipeLeft);
  const onSwipeRightRef = useRef(onSwipeRight);
  const onPressHandlerRef = useRef(onPressHandler);

  useEffect(() => {
    onSwipeLeftRef.current = onSwipeLeft;
    onSwipeRightRef.current = onSwipeRight;
    onPressHandlerRef.current = onPressHandler;
  }, [onSwipeLeft, onSwipeRight, onPressHandler]);

  // ─── PanResponder — only for swipeable keys ──────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      // Claim responder immediately on touch
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        setPressed(true);
      },

      onPanResponderMove: () => {
        // just track — no action mid-swipe
      },

      onPanResponderRelease: (_, g) => {
        setPressed(false);
        if (g.dx < -30) {
          onSwipeLeftRef.current?.();
        } else if (g.dx > 30) {
          onSwipeRightRef.current?.();
        } else {
          if (hasActiveState) setIsActive((prev) => !prev);
          onPressHandlerRef.current?.();
        }
      },

      onPanResponderTerminate: () => {
        setPressed(false);
      },
    }),
  ).current;

  const keyStyles = [
    styles.key,
    special && styles.specialKey,
    functionKey && styles.functionKey,
    type === 'mouse' && variantStyles[variant],
    pressed && styles.keyPressed,
    type !== 'mouse' && (flex > 0 ? { flex } : language === 'bn-BD' ? { width: 25.65 } : { width: 33.75 }),
    style,
  ];

  const keyContent = (
    <>
      {isIcon ? (
        children
      ) : type === 'mouse' ? (
        <Text style={[styles.btnText, variant === 'scroll' && { color: '#ffffff', opacity: 0.8 }, pressed && { opacity: 0.6 }]}>
          {children}
        </Text>
      ) : (
        <Text
          numberOfLines={1}
          style={[
            styles.keyText,
            hasActiveState && isActive && styles.keyActive,
            functionKey && { color: '#f2f2f2' },
            pressed && { color: '#999' },
          ]}
        >
          {children}
        </Text>
      )}

      {hasActiveState && isActive && <View style={[styles.activeIndicator, { borderColor: '#444' }]} />}
    </>
  );

  // ─── Swipeable: use View + PanResponder (Pressable blocks swipe) ─────────────
  if (isSwipeable) {
    return (
      <View style={keyStyles} {...panResponder.panHandlers}>
        {keyContent}
      </View>
    );
  }

  // ─── Normal: use Pressable ───────────────────────────────────────────────────
  return (
    <Pressable
      onPressIn={() => {
        setPressed(true);
        if (hasActiveState) setIsActive((prev) => !prev);
        onPressHandler?.();
        onRepeatStart?.();
      }}
      onPressOut={() => {
        setPressed(false);
        onRepeatEnd?.();
      }}
      style={keyStyles}
    >
      {keyContent}
    </Pressable>
  );
};

export const Key = React.memo(KeyComponent);

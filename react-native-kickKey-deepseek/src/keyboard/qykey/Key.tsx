// ============================================================
// Key.tsx -- "Chocolate bar" key, ported from qykey.
//
// Differences from the qykey original:
//   - Vector-icon rendering (iconType/iconName/iconColor) removed --
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

  // Ref to the swipeable View -- zero-re-render press visual via setNativeProps
  const swipeViewRef = useRef<View>(null);

  // Pan responder only for swipeable keys
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        // Imperatively dim -- NO setState, NO JS re-render
        swipeViewRef.current?.setNativeProps({ opacity: 0.5 });
      },

      onPanResponderMove: () => {
        // just track -- no action mid-swipe
      },

      onPanResponderRelease: (_, g) => {
        swipeViewRef.current?.setNativeProps({ opacity: 1 });
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
        swipeViewRef.current?.setNativeProps({ opacity: 1 });
      },
    }),
  ).current;

  const baseStyle = [
    styles.key,
    special && styles.specialKey,
    functionKey && styles.functionKey,
    type === 'mouse' && variantStyles[variant],
    type !== 'mouse' && (flex > 0 ? { flex } : language === 'bn-BD' ? { width: 25.65 } : { width: 33.75 }),
    style,
  ];

  const renderContent = (isPressed: boolean) => (
    <>
      {isIcon ? (
        children
      ) : type === 'mouse' ? (
        <Text style={[styles.btnText, variant === 'scroll' && { color: '#ffffff', opacity: 0.8 }, isPressed && { opacity: 0.6 }]}>
          {children}
        </Text>
      ) : (
        <Text
          numberOfLines={1}
          style={[
            styles.keyText,
            hasActiveState && isActive && styles.keyActive,
            functionKey && { color: '#f2f2f2' },
            isPressed && { color: '#999' },
          ]}
        >
          {children}
        </Text>
      )}

      {hasActiveState && isActive && <View style={[styles.activeIndicator, { borderColor: '#444' }]} />}
    </>
  );

  // Swipeable: View + PanResponder (Pressable blocks swipe gestures)
  // Press visual handled by setNativeProps -- zero re-renders during fast typing
  if (isSwipeable) {
    return (
      <View ref={swipeViewRef} style={baseStyle} {...panResponder.panHandlers}>
        {renderContent(false)}
      </View>
    );
  }

  // Normal keys: use Pressable with native press state and zero delay
  return (
    <Pressable
      unstable_pressDelay={0}
      // Vertical hitSlop compensates for the compact (26dp) keys so the
      // effective tap target stays finger-friendly (~32dp touch area).
      hitSlop={{ top: 3, bottom: 3, left: 1, right: 1 }}
      onPressIn={() => {
        if (hasActiveState) setIsActive((prev) => !prev);
        onPressHandler?.();
        onRepeatStart?.();
      }}
      onPressOut={() => {
        onRepeatEnd?.();
      }}
      style={({ pressed }) => [baseStyle, pressed && styles.keyPressed]}
    >
      {({ pressed }) => renderContent(pressed)}
    </Pressable>
  );
};

export const Key = React.memo(KeyComponent);
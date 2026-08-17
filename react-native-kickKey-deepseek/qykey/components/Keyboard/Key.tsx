import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, PanResponder } from "react-native";
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import styles from "../../assets/styles/styles";
import { AppLanguage } from "./Keyboard";

const variantStyles: any = {
  nav: styles.navBtn,
  scroll: styles.scrollBtn,
  mouse: styles.mouseBtn,
};

const KeyComponent = ({
  children,
  style,
  special = false,
  functionKey = false,
  flex = 0,
  isIcon = false,
  hasActiveState = false,
  iconType = "default",
  iconName,
  iconColor,
  onPressHandler,
  onSwipeLeft,
  onSwipeRight,
  type = "keyboard",
  variant,
  isStatusActive,
  language = "en-US",
}: {
  children?: React.ReactNode;
  style?: any;
  special?: boolean;
  functionKey?: boolean;
  flex?: number;
  isIcon?: boolean;
  hasActiveState?: boolean;
  iconType?: "default" | "material" | "fontawesome";
  iconName?: string;
  iconColor?: string;
  onPressHandler?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  type?: "keyboard" | "mouse";
  variant?: any;
  isStatusActive?: boolean;
  language?: AppLanguage;
}) => {
  const [isActive, setIsActive] = useState(isStatusActive || false);

  useEffect(() => {
    if (!isStatusActive) setIsActive(false);
  }, [isStatusActive]);

  const isSwipeable = !!(onSwipeLeft || onSwipeRight);

  const onSwipeLeftRef = useRef(onSwipeLeft);
  const onSwipeRightRef = useRef(onSwipeRight);
  const onPressHandlerRef = useRef(onPressHandler);

  useEffect(() => {
    onSwipeLeftRef.current = onSwipeLeft;
    onSwipeRightRef.current = onSwipeRight;
    onPressHandlerRef.current = onPressHandler;
  }, [onSwipeLeft, onSwipeRight, onPressHandler]);

  // Ref to the swipeable View -- used for zero-re-render press visual via setNativeProps
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
    type === "mouse" && variantStyles[variant],
    type !== "mouse" && (flex > 0 ? { flex } : language === "bn-BD" ? { width: 25.65 } : { width: 33.75 }),
    style,
  ];

  const renderContent = (isPressed: boolean) => (
    <>
      {isIcon ? (
        iconType === "material" && iconName ? (
          <MaterialCommunityIcons name={iconName as any} size={14} color={iconColor || "#444"} />
        ) : iconType === "fontawesome" && iconName ? (
          <FontAwesome5 name={iconName as any} size={14} color={iconColor || "#444"} />
        ) : (
          children
        )
      ) : type === "mouse" ? (
        <Text style={[styles.btnText, variant === "scroll" && { color: "#ffffff", opacity: 0.8 }, isPressed && { opacity: 0.6 }]}>
          {children}
        </Text>
      ) : (
        <Text
          numberOfLines={1}
          style={[
            styles.keyText,
            hasActiveState && isActive && styles.keyActive,
            functionKey && { color: "#f2f2f2" },
            isPressed && { color: "#999" },
          ]}
        >
          {children}
        </Text>
      )}

      {hasActiveState && isActive && <View style={[styles.activeIndicator, { borderColor: iconColor || "#444" }]} />}
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

  // Normal keys: Pressable with native press state, zero extra re-renders
  return (
    <Pressable
      unstable_pressDelay={0}
      hitSlop={1}
      onPressIn={() => {
        if (hasActiveState) setIsActive((prev) => !prev);
        onPressHandler?.();
      }}
      style={({ pressed }) => [baseStyle, pressed && styles.keyPressed]}
    >
      {({ pressed }) => renderContent(pressed)}
    </Pressable>
  );
};

export const Key = React.memo(KeyComponent);
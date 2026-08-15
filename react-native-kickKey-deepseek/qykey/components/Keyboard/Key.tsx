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
  const [pressed, setPressed] = useState(false);
  const [isActive, setIsActive] = useState(isStatusActive || false);

  useEffect(() => {
    if (!isStatusActive) setIsActive(false);
  }, [isStatusActive]);

  const isSwipeable = !!(onSwipeLeft || onSwipeRight);

  // Add these refs inside KeyComponent, before panResponder:
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
          onSwipeLeftRef.current?.(); // ← was onSwipeLeft?.()
        } else if (g.dx > 30) {
          onSwipeRightRef.current?.(); // ← was onSwipeRight?.()
        } else {
          if (hasActiveState) setIsActive((prev) => !prev);
          onPressHandlerRef.current?.(); // ← was onPressHandler?.()
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
    type === "mouse" && variantStyles[variant],
    pressed && styles.keyPressed,
    type !== "mouse" && (flex > 0 ? { flex } : language === "bn-BD" ? { width: 25.65 } : { width: 33.75 }),
    style,
  ];

  const keyContent = (
    <>
      {isIcon ? (
        iconType === "material" ? (
          <MaterialCommunityIcons
            name={(iconName as any) || "access-point"}
            size={hasActiveState && isActive ? 12 : 14}
            color={iconColor || "#444"}
          />
        ) : iconType === "fontawesome" ? (
          <FontAwesome5 name={iconName || "question"} size={hasActiveState && isActive ? 10 : 12} color={iconColor || "#444"} />
        ) : (
          children
        )
      ) : type === "mouse" ? (
        <Text style={[styles.btnText, variant === "scroll" && { color: "#ffffff", opacity: 0.8 }, pressed && { opacity: 0.6 }]}>
          {children}
        </Text>
      ) : (
        <Text
          numberOfLines={1}
          style={[
            styles.keyText,
            hasActiveState && isActive && styles.keyActive,
            functionKey && { color: "#f2f2f2" },
            pressed && { color: "#999" },
          ]}
        >
          {children}
        </Text>
      )}

      {hasActiveState && isActive && <View style={[styles.activeIndicator, { borderColor: iconColor || "#444" }]} />}
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
      }}
      onPressOut={() => setPressed(false)}
      style={keyStyles}
    >
      {keyContent}
    </Pressable>
  );
};

export const Key = React.memo(KeyComponent);

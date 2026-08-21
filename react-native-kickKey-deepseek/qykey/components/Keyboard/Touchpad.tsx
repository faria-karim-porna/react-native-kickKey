import React, { useRef, useState, useEffect, useCallback } from "react";
import { View, Text, PanResponder, Pressable } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import styles from "../../assets/styles/styles";
import { Key } from "./Key";

export interface TouchpadProps {
  onMoveCursor?: (direction: "left" | "right" | "up" | "down") => void;
  onScrollPage?: (direction: "up" | "down") => void;
  onNavigateHistory?: (direction: "backward" | "forward") => void;
  onMouseClick?: (button: "left" | "right") => void;
  /**
   * Shows the desktop-style pointer over the app screen.
   * Resolves true when the pointer is visible, false when the
   * "Display over other apps" permission is missing.
   */
  onPointerShow?: () => Promise<boolean> | boolean;
  /** Hides the desktop-style pointer overlay. */
  onPointerHide?: () => void;
  /** Moves the pointer by a relative (dx, dy) delta (trackpad-style). */
  onPointerMove?: (dx: number, dy: number) => void;
  /** Opens the system "Display over other apps" settings. */
  onRequestPointerPermission?: () => void;
}

export default function Touchpad({
  onMoveCursor,
  onScrollPage,
  onNavigateHistory,
  onMouseClick,
  onPointerShow,
  onPointerHide,
  onPointerMove,
  onRequestPointerPermission,
}: TouchpadProps) {
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  // True while the on-screen pointer is hidden because the user hasn't granted
  // "Display over other apps" — shows a small banner on the touchpad surface.
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);

  const onMoveCursorRef = useRef(onMoveCursor);
  const onPointerMoveRef = useRef(onPointerMove);
  const onPointerShowRef = useRef(onPointerShow);
  const onPointerHideRef = useRef(onPointerHide);
  const onRequestPointerPermissionRef = useRef(onRequestPointerPermission);

  useEffect(() => {
    onMoveCursorRef.current = onMoveCursor;
    onPointerMoveRef.current = onPointerMove;
    onPointerShowRef.current = onPointerShow;
    onPointerHideRef.current = onPointerHide;
    onRequestPointerPermissionRef.current = onRequestPointerPermission;
  }, [onMoveCursor, onPointerMove, onPointerShow, onPointerHide, onRequestPointerPermission]);

  const accX = useRef(0);
  const accY = useRef(0);
  const lastDx = useRef(0);
  const lastDy = useRef(0);

  const STEP_THRESHOLD = 14;

  // Show the desktop-style pointer while touchpad mode is active.
  // If the overlay permission is missing, show a banner instead (the touchpad
  // still works for caret movement / scrolling / clicks on the focused view).
  const showPointerAndCheck = useCallback(() => {
    const result = onPointerShowRef.current?.();
    Promise.resolve(result)
      .then((ok) => setShowPermissionBanner(ok === false))
      .catch(() => setShowPermissionBanner(false));
  }, []);

  useEffect(() => {
    showPointerAndCheck();
    return () => onPointerHideRef.current?.();
  }, [showPointerAndCheck]);

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

        // Move the on-screen desktop pointer (relative, trackpad-style)
        onPointerMoveRef.current?.(deltaX, deltaY);

        accX.current += deltaX;
        accY.current += deltaY;

        while (accX.current >= STEP_THRESHOLD) {
          onMoveCursorRef.current?.("right");
          accX.current -= STEP_THRESHOLD;
        }
        while (accX.current <= -STEP_THRESHOLD) {
          onMoveCursorRef.current?.("left");
          accX.current += STEP_THRESHOLD;
        }
        while (accY.current >= STEP_THRESHOLD) {
          onMoveCursorRef.current?.("down");
          accY.current -= STEP_THRESHOLD;
        }
        while (accY.current <= -STEP_THRESHOLD) {
          onMoveCursorRef.current?.("up");
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
        style={[styles.touchpadSurface, { overflow: "hidden", position: "relative" }]}
        {...surfacePanResponder.panHandlers}
      >
        {cursor && (
          <View
            style={{
              position: "absolute",
              left: cursor.x - 7,
              top: cursor.y - 7,
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: "rgba(133, 148, 170, 0.5)",
              borderWidth: 2,
              borderColor: "#8594aa",
              shadowColor: "#8594aa",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 4,
              elevation: 4,
              pointerEvents: "none",
            }}
          />
        )}
      </View>

      {/* Permission banner — only when the overlay permission is missing */}
      {showPermissionBanner && (
        <View
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            right: 12,
            zIndex: 10,
            backgroundColor: "rgba(0, 0, 0, 0.78)",
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 6,
          }}
        >
          <Pressable onPress={showPointerAndCheck}>
            <Text style={{ color: "#fff", fontSize: 9, textAlign: "center" }}>
              Mouse pointer hidden — enable “Display over other apps”
            </Text>
          </Pressable>
          <Pressable onPress={() => onRequestPointerPermissionRef.current?.()}>
            <Text
              style={{
                color: "#8594aa",
                fontSize: 9,
                fontWeight: "bold",
                textAlign: "center",
                marginTop: 4,
              }}
            >
              GRANT →
            </Text>
          </Pressable>
        </View>
      )}

      <View style={styles.touchpadButtons}>
        {/* Nav Buttons Row */}
        <View style={styles.touchpadButtonArea}>
          <Key
            variant="nav"
            isIcon
            type="mouse"
            onPressHandler={() => onNavigateHistory?.("backward")}
          >
            <FontAwesome5 name="chevron-left" size={12} color="#888" />
          </Key>

          <Key
            variant="mouse"
            type="mouse"
            onPressHandler={() => onMouseClick?.("left")}
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
            onPressHandler={() => onScrollPage?.("up")}
          >
            <FontAwesome5 name="caret-up" size={14} color="#f2f2f2" />
          </Key>
          <Key
            variant="scroll"
            isIcon
            type="mouse"
            onPressHandler={() => onScrollPage?.("down")}
          >
            <FontAwesome5 name="caret-down" size={14} color="#f2f2f2" />
          </Key>
        </View>

        <View style={styles.touchpadButtonArea}>
          <Key
            variant="nav"
            isIcon
            type="mouse"
            onPressHandler={() => onNavigateHistory?.("forward")}
          >
            <FontAwesome5 name="chevron-right" size={12} color="#888" />
          </Key>

          <Key
            variant="mouse"
            type="mouse"
            onPressHandler={() => onMouseClick?.("right")}
          >
            <Text style={styles.btnText}>R</Text>
          </Key>
        </View>
      </View>
    </View>
  );
}

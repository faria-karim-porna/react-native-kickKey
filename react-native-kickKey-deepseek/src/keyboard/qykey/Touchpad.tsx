// ============================================================
// Touchpad.tsx — mouse mode surface, wired to real cursor control.
//
// The qykey original was visual-only. Here the pad controls a real
// on-screen mouse cursor through the native MouseAccessibilityService
// (an Android accessibility service + overlay cursor — the only
// non-root way to control other apps):
//   - drag on the surface  → moves the cursor (relative movement)
//   - tap on the surface   → left click at the cursor
//   - L / R buttons        → left / right click
//   - caret buttons        → scroll (hold to repeat)
//
// The accessibility service must be enabled once in Settings →
// Accessibility. If it isn't connected, the pad shows an enable notice
// instead.
// ============================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, NativeModules, PanResponder, Pressable } from 'react-native';
import styles from './styles';
import { Key } from './Key';
import { FA5Icon } from './icons';

const getKickKey = () => NativeModules.KickKey;

// Movement below this total (dp) counts as a tap, not a drag.
const TAP_THRESHOLD = 12;
// dp of cursor movement per dp of finger movement (1:1 ≈ natural touchpad).
const SENSITIVITY = 1.0;
// Scroll gesture distance per caret press (dp). Positive = swipe down.
const SCROLL_DISTANCE = 60;
const SCROLL_REPEAT_MS = 120;
const CONNECT_POLL_MS = 1500;

export default function Touchpad() {
  // null = not checked yet; true/false = connected state
  const [connected, setConnected] = useState<boolean | null>(null);
  const lastMove = useRef({ dx: 0, dy: 0 });
  const didMove = useRef(false);
  const scrollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkConnected = useCallback(() => {
    getKickKey()
      ?.isMouseConnected()
      ?.then?.((ok: boolean) => setConnected(!!ok));
  }, []);

  useEffect(() => {
    // Show the cursor overlay while the touchpad is open.
    getKickKey()?.mouseShowCursor?.();
    checkConnected();
    const poll = setInterval(checkConnected, CONNECT_POLL_MS);
    return () => {
      clearInterval(poll);
      if (scrollInterval.current) clearInterval(scrollInterval.current);
      getKickKey()?.mouseHideCursor?.();
    };
  }, [checkConnected]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastMove.current = { dx: 0, dy: 0 };
        didMove.current = false;
      },
      onPanResponderMove: (_evt, g) => {
        // Relative movement from the previous event → move the cursor.
        const dx = g.dx - lastMove.current.dx;
        const dy = g.dy - lastMove.current.dy;
        lastMove.current = { dx: g.dx, dy: g.dy };
        if (Math.abs(g.dx) + Math.abs(g.dy) > TAP_THRESHOLD) didMove.current = true;
        if (dx !== 0 || dy !== 0) {
          getKickKey()?.mouseMove?.(dx * SENSITIVITY, dy * SENSITIVITY);
        }
      },
      onPanResponderRelease: () => {
        // A press without real movement = left click at the cursor.
        if (!didMove.current) getKickKey()?.mouseClick?.();
      },
      onPanResponderTerminate: () => {},
    }),
  ).current;

  const startScroll = useCallback((dir: 1 | -1) => {
    const fire = () => getKickKey()?.mouseScroll?.(dir * SCROLL_DISTANCE);
    fire();
    if (scrollInterval.current) return;
    scrollInterval.current = setInterval(fire, SCROLL_REPEAT_MS);
  }, []);

  const stopScroll = useCallback(() => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    }
  }, []);

  const openAccessibilitySettings = () => getKickKey()?.openAccessibilitySettings?.();

  if (connected === false) {
    return (
      <View style={styles.touchpadContainer}>
        <View style={styles.touchpadNotice}>
          <FA5Icon name="mouse-pointer" size={22} color="#888" />
          <Text style={styles.touchpadNoticeTitle}>Mouse control needs a permission</Text>
          <Text style={styles.touchpadNoticeText}>
            Enable "KickKey Mouse Control" in Settings → Accessibility so the
            touchpad can move the cursor and click for you.
          </Text>
          <Pressable style={styles.touchpadNoticeBtn} onPress={openAccessibilitySettings}>
            <Text style={styles.touchpadNoticeBtnText}>Enable</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.touchpadContainer}>
      {/* Surface: drag to move the cursor, tap to click */}
      <View style={styles.touchpadSurface} {...panResponder.panHandlers} />

      <View style={styles.touchpadButtons}>
        {/* Nav Buttons Row */}
        <View style={styles.touchpadButtonArea}>
          <Key variant="nav" isIcon type="mouse">
            <FA5Icon name="chevron-left" size={12} color="#888" />
          </Key>

          <Key variant="mouse" type="mouse" onPressHandler={() => getKickKey()?.mouseClick?.()}>
            <Text style={styles.btnText}>L</Text>
          </Key>
        </View>

        {/* Scroll Stack (Middle Column) */}
        <View style={styles.scrollStack}>
          <Key
            variant="scroll"
            isIcon
            type="mouse"
            onRepeatStart={() => startScroll(1)}
            onRepeatEnd={stopScroll}
          >
            <FA5Icon name="caret-up" size={14} color="#f2f2f2" />
          </Key>
          <Key
            variant="scroll"
            isIcon
            type="mouse"
            onRepeatStart={() => startScroll(-1)}
            onRepeatEnd={stopScroll}
          >
            <FA5Icon name="caret-down" size={14} color="#f2f2f2" />
          </Key>
        </View>

        <View style={styles.touchpadButtonArea}>
          <Key variant="nav" isIcon type="mouse">
            <FA5Icon name="chevron-right" size={12} color="#888" />
          </Key>

          <Key variant="mouse" type="mouse" onPressHandler={() => getKickKey()?.mouseRightClick?.()}>
            <Text style={styles.btnText}>R</Text>
          </Key>
        </View>
      </View>
    </View>
  );
}

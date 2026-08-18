// ============================================================
// Touchpad.tsx — ported from qykey (mouse mode surface).
// Provides an interactive surface with visual cursor tracking,
// scroll up/down buttons, nav backward/forward buttons, mouse
// left/right buttons, and a desktop-style pointer overlay that
// moves over the app screen with the drag (trackpad behavior).
//
// M3: DPAD caret stepping removed — native a11y service handles
// cross-app clicks/scroll/back. Tap-to-click, L-drag, scroll
// repeat, and forward-hint added.
// ============================================================

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, PanResponder, Pressable } from 'react-native';
import styles from './styles';
import { Key } from './Key';
import { FA5Icon } from './icons';

export interface TouchpadProps {
  onScrollPage?: (direction: 'up' | 'down') => void;
  /** Start/stop held-button scroll repeat (carets). */
  onScrollRepeatStart?: (direction: 'up' | 'down') => void;
  onScrollRepeatEnd?: () => void;
  /** Resolves false when Forward is unsupported (JS shows a hint). */
  onNavigateHistory?: (direction: 'backward' | 'forward') => Promise<boolean> | boolean;
  onMouseClick?: (button: 'left' | 'right') => void;
  /** L button press-in / press-out (native decides tap vs drag). */
  onDragStart?: () => void;
  onDragEnd?: () => void;
  /** Quick lift on the surface = left click (default on). */
  tapToClick?: boolean;
  onPointerShow?: () => Promise<boolean> | boolean;
  onPointerHide?: () => void;
  onPointerMove?: (dx: number, dy: number) => void;
  onRequestPointerPermission?: () => void;
}

export default function Touchpad({
  onScrollPage,
  onScrollRepeatStart,
  onScrollRepeatEnd,
  onNavigateHistory,
  onMouseClick,
  onDragStart,
  onDragEnd,
  tapToClick = true,
  onPointerShow,
  onPointerHide,
  onPointerMove,
  onRequestPointerPermission,
}: TouchpadProps) {
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);
  const [forwardHint, setForwardHint] = useState(false);

  const onScrollPageRef = useRef(onScrollPage);
  const onNavigateHistoryRef = useRef(onNavigateHistory);
  const onMouseClickRef = useRef(onMouseClick);
  const onDragStartRef = useRef(onDragStart);
  const onDragEndRef = useRef(onDragEnd);
  const onPointerMoveRef = useRef(onPointerMove);
  const onPointerShowRef = useRef(onPointerShow);
  const onPointerHideRef = useRef(onPointerHide);
  const onRequestPointerPermissionRef = useRef(onRequestPointerPermission);
  const tapToClickRef = useRef(tapToClick);

  useEffect(() => {
    onScrollPageRef.current = onScrollPage;
    onNavigateHistoryRef.current = onNavigateHistory;
    onMouseClickRef.current = onMouseClick;
    onDragStartRef.current = onDragStart;
    onDragEndRef.current = onDragEnd;
    onPointerMoveRef.current = onPointerMove;
    onPointerShowRef.current = onPointerShow;
    onPointerHideRef.current = onPointerHide;
    onRequestPointerPermissionRef.current = onRequestPointerPermission;
    tapToClickRef.current = tapToClick;
  }, [onScrollPage, onScrollRepeatStart, onScrollRepeatEnd, onNavigateHistory,
      onMouseClick, onDragStart, onDragEnd, tapToClick,
      onPointerMove, onPointerShow, onPointerHide, onRequestPointerPermission]);

  const lastDx = useRef(0);
  const lastDy = useRef(0);
  // ── Per-frame pointer-move throttle (plan §17) ──
  const pendingDelta = useRef({ x: 0, y: 0 });
  const rafPending = useRef(false);

  // ── Tap-to-click detection ──
  const grantTimeRef = useRef(0);
  const maxDisplacementRef = useRef(0);
  const TAP_TO_CLICK_MAX_MS = 300;
  const TAP_TO_CLICK_MAX_PX = 14;

  // Flushes accumulated deltas to native at most once per animation frame.
  const flushPointerMove = useCallback(() => {
    rafPending.current = false;
    const { x, y } = pendingDelta.current;
    pendingDelta.current = { x: 0, y: 0 };
    if (x !== 0 || y !== 0) {
      onPointerMoveRef.current?.(x, y);
    }
  }, []);

  // Show the desktop-style pointer while touchpad mode is active.
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
        grantTimeRef.current = Date.now();
        maxDisplacementRef.current = 0;
        pendingDelta.current = { x: 0, y: 0 };
        rafPending.current = false;
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

        // Track peak displacement for tap-to-click detection.
        maxDisplacementRef.current = Math.max(
          maxDisplacementRef.current,
          Math.hypot(gestureState.dx, gestureState.dy),
        );

        // Move the on-screen desktop pointer (relative, trackpad-style),
        // batched and flushed once per animation frame (60Hz cap).
        pendingDelta.current.x += deltaX;
        pendingDelta.current.y += deltaY;
        if (!rafPending.current) {
          rafPending.current = true;
          requestAnimationFrame(flushPointerMove);
        }
      },

      onPanResponderRelease: () => {
        setCursor(null);
        pendingDelta.current = { x: 0, y: 0 };
        rafPending.current = false;
        lastDx.current = 0;
        lastDy.current = 0;
        // Tap-to-click: quick lift, almost no movement → left click.
        const quick =
          Date.now() - grantTimeRef.current < TAP_TO_CLICK_MAX_MS &&
          maxDisplacementRef.current < TAP_TO_CLICK_MAX_PX;
        if (quick && tapToClickRef.current) {
          onMouseClickRef.current?.('left');
        }
      },

      onPanResponderTerminate: () => {
        setCursor(null);
        pendingDelta.current = { x: 0, y: 0 };
        rafPending.current = false;
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

      {/* Permission banner — only when the overlay permission is missing */}
      {showPermissionBanner && (
        <View
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            right: 12,
            zIndex: 10,
            backgroundColor: 'rgba(0, 0, 0, 0.78)',
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 6,
          }}
        >
          <Pressable onPress={showPointerAndCheck}>
            <Text style={{ color: '#fff', fontSize: 9, textAlign: 'center' }}>
              Mouse pointer hidden — enable "Display over other apps"
            </Text>
          </Pressable>
          <Pressable onPress={() => onRequestPointerPermissionRef.current?.()}>
            <Text
              style={{
                color: '#00BCD4',
                fontSize: 9,
                fontWeight: 'bold',
                textAlign: 'center',
                marginTop: 4,
              }}
            >
              GRANT →
            </Text>
          </Pressable>
        </View>
      )}

      {/* Forward not supported hint */}
      {forwardHint && (
        <View
          style={{
            position: 'absolute',
            bottom: 78,
            alignSelf: 'center',
            zIndex: 10,
            backgroundColor: 'rgba(0, 0, 0, 0.78)',
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 5,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 9, textAlign: 'center' }}>
            Forward is not supported on this Android version
          </Text>
        </View>
      )}

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
            onPressHandler={() => onDragStartRef.current?.()}
            onRepeatEnd={() => onDragEndRef.current?.()}
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
            onPressHandler={() => onScrollPageRef.current?.('up')}
            onRepeatStart={() => onScrollRepeatStart?.('up')}
            onRepeatEnd={() => onScrollRepeatEnd?.()}
          >
            <FA5Icon name="caret-up" size={14} color="#f2f2f2" />
          </Key>
          <Key
            variant="scroll"
            isIcon
            type="mouse"
            onPressHandler={() => onScrollPageRef.current?.('down')}
            onRepeatStart={() => onScrollRepeatStart?.('down')}
            onRepeatEnd={() => onScrollRepeatEnd?.()}
          >
            <FA5Icon name="caret-down" size={14} color="#f2f2f2" />
          </Key>
        </View>

        <View style={styles.touchpadButtonArea}>
          <Key
            variant="nav"
            isIcon
            type="mouse"
            onPressHandler={() => {
              const result = onNavigateHistoryRef.current?.('forward');
              Promise.resolve(result).then((handled) => {
                if (handled === false) {
                  setForwardHint(true);
                  setTimeout(() => setForwardHint(false), 1500);
                }
              });
            }}
          >
            <FA5Icon name="chevron-right" size={12} color="#888" />
          </Key>

          <Key
            variant="mouse"
            type="mouse"
            onPressHandler={() => onMouseClickRef.current?.('right')}
          >
            <Text style={styles.btnText}>R</Text>
          </Key>
        </View>
      </View>
    </View>
  );
}

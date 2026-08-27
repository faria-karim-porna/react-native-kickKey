// ============================================================
// Touchpad.tsx — Multi-touch trackpad surface.
// Provides an interactive surface with:
//   - Single finger: pointer movement + tap-to-click (left click)
//   - Two fingers: scroll (vertical/horizontal pan) + two-finger tap = right click
//   - Tap-hold-drag: drag and drop
//   - Visual touch indicator on surface (no cursor - handled by native overlay)
//   - Scroll buttons, nav buttons, mouse L/R buttons
// ============================================================

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, PanResponder, Pressable, NativeSyntheticEvent, NativeTouchEvent, PixelRatio } from 'react-native';
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

interface TouchPoint {
  id: string;
  x: number;
  y: number;
  startX: number;
  startY: number;
  startTime: number;
}

// RN reports touch coordinates in dp, but the native PointerOverlay window
// positions in RAW PIXELS. Convert so finger travel maps 1:1 (in dp terms)
// to cursor travel — without this the cursor crawls at 1/density speed.
const PX_PER_DP = PixelRatio.get();

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
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);
  const [forwardHint, setForwardHint] = useState(false);
  const [touchIndicator, setTouchIndicator] = useState<{ x: number; y: number } | null>(null);

  // Backup tap detection via native onTouchEnd (more reliable than PanResponder release in IME windows)
  const touchStartRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const backupClickFiredRef = useRef(false);

  // Refs for callbacks
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

  // Multi-touch state
  const touchesRef = useRef<Map<string, TouchPoint>>(new Map());
  const lastSingleTouchPosRef = useRef<{ pageX: number; pageY: number } | null>(null);
  const lastCenterRef = useRef<{ x: number; y: number } | null>(null);
  const scrollAccumulatorRef = useRef({ x: 0, y: 0 });
  const pendingDelta = useRef({ x: 0, y: 0 });
  const rafPending = useRef(false);

  // Tap-to-click & gesture constants
  const TAP_TO_CLICK_MAX_MS = 300;
  const TAP_TO_CLICK_MAX_PX = 16;
  const SCROLL_THRESHOLD_PX = 14;
  const SENSITIVITY = 1.25;

  // Flushes accumulated pointer deltas to native at most once per animation frame.
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

  // Backup tap detection via native onTouchEnd
  const handleTouchStart = useCallback((e: any) => {
    backupClickFiredRef.current = false;
    const touch = e.nativeEvent?.touches?.[0];
    if (touch) {
      touchStartRef.current = { time: Date.now(), x: touch.pageX, y: touch.pageY };
    }
  }, []);

  const handleTouchEnd = useCallback((e: any) => {
    const start = touchStartRef.current;
    if (!start) return;
    const duration = Date.now() - start.time;
    const touch = e.nativeEvent?.changedTouches?.[0] ?? e.nativeEvent?.touches?.[0];
    if (touch && !backupClickFiredRef.current) {
      const dist = Math.hypot(touch.pageX - start.x, touch.pageY - start.y);
      if (duration < 400 && dist < 30) {
        backupClickFiredRef.current = true;
        onMouseClickRef.current?.('left');
      }
    }
    touchStartRef.current = null;
  }, []);

  const surfacePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,

      onPanResponderGrant: (evt: NativeSyntheticEvent<NativeTouchEvent>) => {
        const { touches, changedTouches } = evt.nativeEvent;
        const activeTouches = (touches && touches.length > 0)
          ? touches
          : (changedTouches && changedTouches.length > 0)
            ? changedTouches
            : [{
                identifier: 0,
                locationX: evt.nativeEvent.locationX,
                locationY: evt.nativeEvent.locationY,
                pageX: evt.nativeEvent.pageX,
                pageY: evt.nativeEvent.pageY,
              }];
        const now = Date.now();

        touchesRef.current.clear();
        activeTouches.forEach((t) => {
          const id = String(t.identifier ?? 0);
          touchesRef.current.set(id, {
            id,
            x: t.locationX,
            y: t.locationY,
            startX: t.pageX,
            startY: t.pageY,
            startTime: now,
          });
        });

        const touchCount = activeTouches.length;

        if (touchCount === 1) {
          const touch = activeTouches[0];
          setTouchIndicator({ x: touch.locationX, y: touch.locationY });
          lastSingleTouchPosRef.current = { pageX: touch.pageX, pageY: touch.pageY };
          pendingDelta.current = { x: 0, y: 0 };
          rafPending.current = false;
        } else if (touchCount === 2) {
          lastCenterRef.current = {
            x: (activeTouches[0].pageX + activeTouches[1].pageX) / 2,
            y: (activeTouches[0].pageY + activeTouches[1].pageY) / 2,
          };
          scrollAccumulatorRef.current = { x: 0, y: 0 };
          setTouchIndicator(null);
        } else {
          setTouchIndicator(null);
        }
      },

      onPanResponderMove: (evt: NativeSyntheticEvent<NativeTouchEvent>) => {
        const { touches, changedTouches } = evt.nativeEvent;
        const activeTouches = (touches && touches.length > 0)
          ? touches
          : (changedTouches && changedTouches.length > 0)
            ? changedTouches
            : [{
                identifier: 0,
                locationX: evt.nativeEvent.locationX,
                locationY: evt.nativeEvent.locationY,
                pageX: evt.nativeEvent.pageX,
                pageY: evt.nativeEvent.pageY,
              }];
        const touchCount = activeTouches.length;

        if (touchCount === 1) {
          const touch = activeTouches[0];
          setTouchIndicator({ x: touch.locationX, y: touch.locationY });

          const prev = lastSingleTouchPosRef.current;
          if (prev) {
            const dx = (touch.pageX - prev.pageX) * SENSITIVITY * PX_PER_DP;
            const dy = (touch.pageY - prev.pageY) * SENSITIVITY * PX_PER_DP;

            pendingDelta.current.x += dx;
            pendingDelta.current.y += dy;

            if (!rafPending.current) {
              rafPending.current = true;
              requestAnimationFrame(flushPointerMove);
            }
          }
          lastSingleTouchPosRef.current = { pageX: touch.pageX, pageY: touch.pageY };
        } else if (touchCount === 2) {
          setTouchIndicator(null);
          const t1 = activeTouches[0];
          const t2 = activeTouches[1];
          const center = {
            x: (t1.pageX + t2.pageX) / 2,
            y: (t1.pageY + t2.pageY) / 2,
          };

          if (lastCenterRef.current) {
            const deltaY = center.y - lastCenterRef.current.y;
            scrollAccumulatorRef.current.y += deltaY;

            while (scrollAccumulatorRef.current.y >= SCROLL_THRESHOLD_PX) {
              onScrollPageRef.current?.('down');
              scrollAccumulatorRef.current.y -= SCROLL_THRESHOLD_PX;
            }
            while (scrollAccumulatorRef.current.y <= -SCROLL_THRESHOLD_PX) {
              onScrollPageRef.current?.('up');
              scrollAccumulatorRef.current.y += SCROLL_THRESHOLD_PX;
            }
          }
          lastCenterRef.current = center;
        } else {
          setTouchIndicator(null);
        }
      },

      onPanResponderRelease: (evt: NativeSyntheticEvent<NativeTouchEvent>, gestureState) => {
        const { changedTouches, touches } = evt.nativeEvent;
        const now = Date.now();

        const endedTouches = (changedTouches && changedTouches.length > 0)
          ? changedTouches
          : (touches && touches.length > 0)
            ? touches
            : [{
                identifier: 0,
                locationX: evt.nativeEvent.locationX,
                locationY: evt.nativeEvent.locationY,
                pageX: evt.nativeEvent.pageX,
                pageY: evt.nativeEvent.pageY,
              }];

        const trackedCount = touchesRef.current.size;
        const totalGestureDist = Math.hypot(gestureState.dx, gestureState.dy);
        const id = String(endedTouches[0]?.identifier ?? 0);
        const initial = touchesRef.current.get(id);
        const touchDuration = initial ? (now - initial.startTime) : 100;
        const touchDisplacement = initial
          ? Math.hypot(endedTouches[0].pageX - initial.startX, endedTouches[0].pageY - initial.startY)
          : totalGestureDist;

        // 1. Single-finger tap to click (left click at the cursor)
        // Allow up to 28dp displacement and 400ms duration for natural tap detection
        const isTap = (
          (touchDuration < 400 && totalGestureDist < 28) ||
          (touchDuration < 400 && touchDisplacement < 28 * PX_PER_DP)
        );

        if (trackedCount <= 1 && isTap && tapToClickRef.current && !backupClickFiredRef.current) {
          backupClickFiredRef.current = true;
          onMouseClickRef.current?.('left');
        } else if (trackedCount === 2 && endedTouches.length >= 2) {
          // 2. Two-finger tap for right click
          const t1 = touchesRef.current.get(String(endedTouches[0].identifier ?? 0));
          const t2 = touchesRef.current.get(String(endedTouches[1].identifier ?? 1));
          if (t1 && t2) {
            const duration = Math.max(now - t1.startTime, now - t2.startTime);
            const disp1 = Math.hypot(endedTouches[0].pageX - t1.startX, endedTouches[0].pageY - t1.startY);
            const disp2 = Math.hypot(endedTouches[1].pageX - t2.startX, endedTouches[1].pageY - t2.startY);
            if (duration < 400 && disp1 < 28 * PX_PER_DP && disp2 < 28 * PX_PER_DP) {
              onMouseClickRef.current?.('right');
            }
          }
        }

        // Clean up
        touchesRef.current.clear();
        lastSingleTouchPosRef.current = null;
        lastCenterRef.current = null;
        scrollAccumulatorRef.current = { x: 0, y: 0 };
        setTouchIndicator(null);
      },

      onPanResponderTerminate: () => {
        touchesRef.current.clear();
        lastSingleTouchPosRef.current = null;
        lastCenterRef.current = null;
        scrollAccumulatorRef.current = { x: 0, y: 0 };
        setTouchIndicator(null);
      },
    }),
  ).current;

  return (
    <View style={styles.touchpadContainer}>
      {/* Surface: Recessed / Carved out look with subtle touch indicator */}
      <View
        style={[styles.touchpadSurface, { overflow: 'hidden', position: 'relative' }]}
        {...surfacePanResponder.panHandlers}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {touchIndicator && (
          <View
            style={{
              position: 'absolute',
              left: touchIndicator.x - 12,
              top: touchIndicator.y - 12,
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: 'rgba(133, 148, 170, 0.15)',
              borderWidth: 1,
              borderColor: 'rgba(133, 148, 170, 0.4)',
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
                color: '#8594aa',
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
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

  // ── Tap detection (single source of truth) ─────────────────────────────
  // We use the View's onTouchStart/onTouchEnd (not PanResponder) as the sole
  // tap-click authority. Reasons:
  //   1. In Android IME windows PanResponder.onPanResponderRelease can be
  //      skipped when the system terminates the gesture (e.g., home-gesture
  //      swipe steals the touch), but onTouchEnd always fires.
  //   2. gestureState.dx/dy in PanResponder accumulates from the *grant* point,
  //      not the finger-down point, so even a clean tap shows a non-zero dist
  //      and the isTap check fails.
  //   3. We use locationX/locationY (surface-local dp) not pageX/pageY (screen
  //      dp) so the IME window Y offset can't inflate the distance.
  //
  // hasMoved is set by PanResponder only when the finger travels > TAP_MAX_DP.
  // The tap handler skips the click if the finger genuinely moved.
  const touchDownRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const hasMovedRef  = useRef(false);

  // Tap constants (dp — surface-local, device-independent)
  const TAP_MAX_MS = 350;       // max duration for a tap
  const TAP_MAX_DP = 10;        // max finger travel for a tap (dp, surface-local)

  // Multi-touch state
  const touchesRef = useRef<Map<string, TouchPoint>>(new Map());
  const lastSingleTouchPosRef = useRef<{ pageX: number; pageY: number } | null>(null);
  const lastCenterRef = useRef<{ x: number; y: number } | null>(null);
  const scrollAccumulatorRef = useRef({ x: 0, y: 0 });
  const pendingDelta = useRef({ x: 0, y: 0 });
  const rafPending = useRef(false);

  // Scroll & sensitivity constants
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

  // ── Tap start/end via View onTouch* ────────────────────────────────────
  // These always fire in an IME window, unlike PanResponder release.
  const handleTouchStart = useCallback((e: any) => {
    const touch = e.nativeEvent?.touches?.[0];
    if (touch) {
      // Use locationX/locationY (surface-local dp) — consistent inside the IME
      touchDownRef.current = {
        time: Date.now(),
        x: touch.locationX ?? touch.pageX,
        y: touch.locationY ?? touch.pageY,
      };
    }
    hasMovedRef.current = false;
  }, []);

  const handleTouchEnd = useCallback((e: any) => {
    const down = touchDownRef.current;
    touchDownRef.current = null;

    if (!down) return;
    if (!tapToClickRef.current) return;
    if (hasMovedRef.current) return; // finger genuinely dragged — not a tap

    const duration = Date.now() - down.time;
    if (duration > TAP_MAX_MS) return; // held too long — not a tap

    // Count fingers that were lifted — ignore two-finger lifts (right-click is
    // handled by two-finger tap logic separately, not here).
    const changed = e.nativeEvent?.changedTouches ?? [];
    if (changed.length !== 1) return;

    const touch = changed[0];
    const dx = (touch.locationX ?? touch.pageX) - down.x;
    const dy = (touch.locationY ?? touch.pageY) - down.y;
    const dist = Math.hypot(dx, dy);

    if (dist <= TAP_MAX_DP) {
      onMouseClickRef.current?.('left');
    }
  }, [TAP_MAX_MS, TAP_MAX_DP]);

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
            startX: t.locationX, // surface-local to match tap detector
            startY: t.locationY,
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

            // Tell the tap detector the finger has genuinely moved.
            // Use the accumulated surface-local travel vs. the grant position.
            if (!hasMovedRef.current) {
              const id = String(touch.identifier ?? 0);
              const initial = touchesRef.current.get(id);
              if (initial) {
                const travelled = Math.hypot(
                  touch.locationX - initial.startX,
                  touch.locationY - initial.startY,
                );
                if (travelled > TAP_MAX_DP) hasMovedRef.current = true;
              }
            }
          }
          lastSingleTouchPosRef.current = { pageX: touch.pageX, pageY: touch.pageY };
        } else if (touchCount === 2) {
          setTouchIndicator(null);
          // Mark as moved so no accidental left-click fires on two-finger lift.
          hasMovedRef.current = true;
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

      onPanResponderRelease: (evt: NativeSyntheticEvent<NativeTouchEvent>) => {
        const { changedTouches, touches } = evt.nativeEvent;
        const now = Date.now();

        // ── Two-finger right-click ───────────────────────────────────────
        // Left-click is handled exclusively by handleTouchEnd (View onTouchEnd).
        const trackedCount = touchesRef.current.size;
        if (trackedCount === 2) {
          const endedTouches = (changedTouches && changedTouches.length > 0)
            ? changedTouches
            : (touches && touches.length > 0)
              ? touches
              : [];
          if (endedTouches.length >= 2) {
            const t1 = touchesRef.current.get(String(endedTouches[0].identifier ?? 0));
            const t2 = touchesRef.current.get(String(endedTouches[1].identifier ?? 1));
            if (t1 && t2) {
              const duration = Math.max(now - t1.startTime, now - t2.startTime);
              // surface-local displacement check
              const disp1 = Math.hypot(
                endedTouches[0].locationX - t1.startX,
                endedTouches[0].locationY - t1.startY,
              );
              const disp2 = Math.hypot(
                endedTouches[1].locationX - t2.startX,
                endedTouches[1].locationY - t2.startY,
              );
              if (duration < 400 && disp1 < TAP_MAX_DP * 2 && disp2 < TAP_MAX_DP * 2) {
                onMouseClickRef.current?.('right');
              }
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
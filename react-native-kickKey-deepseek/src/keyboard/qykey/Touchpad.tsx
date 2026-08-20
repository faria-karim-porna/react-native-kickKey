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
import { View, Text, PanResponder, Pressable, NativeSyntheticEvent, NativeTouchEvent } from 'react-native';
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

  // Multi-touch state
  const touchesRef = useRef<Map<string, TouchPoint>>(new Map());
  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const lastCenterRef = useRef<{ x: number; y: number } | null>(null);
  const lastDistanceRef = useRef(0);
  const scrollAccumulatorRef = useRef({ x: 0, y: 0 });
  const pendingDelta = useRef({ x: 0, y: 0 });
  const rafPending = useRef(false);

  // Tap-to-click constants
  const TAP_TO_CLICK_MAX_MS = 300;
  const TAP_TO_CLICK_MAX_PX = 14;
  const DRAG_THRESHOLD_PX = 10;
  const SCROLL_THRESHOLD_PX = 8;

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

  // Calculate center point of two touches
  const getTwoTouchCenter = (t1: TouchPoint, t2: TouchPoint) => ({
    x: (t1.x + t2.x) / 2,
    y: (t1.y + t2.y) / 2,
  });

  // Calculate distance between two touches
  const getTwoTouchDistance = (t1: TouchPoint, t2: TouchPoint) => 
    Math.hypot(t1.x - t2.x, t1.y - t2.y);

  // Handle single touch end - tap-to-click or drag end
  const handleSingleTouchEnd = useCallback((touch: TouchPoint) => {
    const duration = Date.now() - touch.startTime;
    const displacement = Math.hypot(touch.x - touch.startX, touch.y - touch.startY);
    
    if (isDraggingRef.current) {
      // End drag
      isDraggingRef.current = false;
      onDragEndRef.current?.();
      dragStartPosRef.current = null;
    } else if (duration < TAP_TO_CLICK_MAX_MS && displacement < TAP_TO_CLICK_MAX_PX && tapToClickRef.current) {
      // Tap-to-click
      onMouseClickRef.current?.('left');
    }
  }, []);

  // Handle two-finger tap for right click
  const handleTwoFingerTap = useCallback((t1: TouchPoint, t2: TouchPoint) => {
    const duration1 = Date.now() - t1.startTime;
    const duration2 = Date.now() - t2.startTime;
    const displacement1 = Math.hypot(t1.x - t1.startX, t1.y - t1.startY);
    const displacement2 = Math.hypot(t2.x - t2.startX, t2.y - t2.startY);
    
    if (duration1 < TAP_TO_CLICK_MAX_MS && duration2 < TAP_TO_CLICK_MAX_MS &&
        displacement1 < TAP_TO_CLICK_MAX_PX && displacement2 < TAP_TO_CLICK_MAX_PX) {
      onMouseClickRef.current?.('right');
    }
  }, []);

  const surfacePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,

      onPanResponderGrant: (evt: NativeSyntheticEvent<NativeTouchEvent>) => {
        const { touches } = evt.nativeEvent;
        const now = Date.now();
        
        // Add all new touches
        touches.forEach((t) => {
          touchesRef.current.set(t.identifier, {
            id: t.identifier,
            x: t.locationX,
            y: t.locationY,
            startX: t.locationX,
            startY: t.locationY,
            startTime: now,
          });
        });

        const touchCount = touchesRef.current.size;
        
        if (touchCount === 1) {
          // Single finger - start tracking for pointer movement
          const touch = Array.from(touchesRef.current.values())[0];
          setTouchIndicator({ x: touch.x, y: touch.y });
          dragStartPosRef.current = { x: touch.x, y: touch.y };
          pendingDelta.current = { x: 0, y: 0 };
          rafPending.current = false;
        } else if (touchCount === 2) {
          // Two fingers - initialize scroll tracking
          const touchArray = Array.from(touchesRef.current.values());
          lastCenterRef.current = getTwoTouchCenter(touchArray[0], touchArray[1]);
          lastDistanceRef.current = getTwoTouchDistance(touchArray[0], touchArray[1]);
          scrollAccumulatorRef.current = { x: 0, y: 0 };
          setTouchIndicator(null); // Hide indicator during two-finger gestures
        } else {
          // 3+ fingers - clear indicator
          setTouchIndicator(null);
        }
      },

      onPanResponderMove: (evt: NativeSyntheticEvent<NativeTouchEvent>, gestureState) => {
        const { touches } = evt.nativeEvent;
        
        // Update touch positions
        touches.forEach((t) => {
          const existing = touchesRef.current.get(t.identifier);
          if (existing) {
            touchesRef.current.set(t.identifier, {
              ...existing,
              x: t.locationX,
              y: t.locationY,
            });
          }
        });

        const touchCount = touchesRef.current.size;
        const touchArray = Array.from(touchesRef.current.values());

        if (touchCount === 1) {
          // Single finger - pointer movement
          const touch = touchArray[0];
          setTouchIndicator({ x: touch.x, y: touch.y });

          const deltaX = gestureState.dx;
          const deltaY = gestureState.dy;

          // Check if we should start dragging
          if (!isDraggingRef.current && dragStartPosRef.current) {
            const dragDist = Math.hypot(touch.x - dragStartPosRef.current.x, touch.y - dragStartPosRef.current.y);
            if (dragDist > DRAG_THRESHOLD_PX) {
              isDraggingRef.current = true;
              onDragStartRef.current?.();
            }
          }

          // Move pointer (relative, trackpad-style), batched at 60Hz
          pendingDelta.current.x += deltaX;
          pendingDelta.current.y += deltaY;
          if (!rafPending.current) {
            rafPending.current = true;
            requestAnimationFrame(flushPointerMove);
          }
        } else if (touchCount === 2) {
          // Two fingers - scroll
          setTouchIndicator(null);
          
          const center = getTwoTouchCenter(touchArray[0], touchArray[1]);
          const distance = getTwoTouchDistance(touchArray[0], touchArray[1]);

          if (lastCenterRef.current) {
            const deltaX = center.x - lastCenterRef.current.x;
            const deltaY = center.y - lastCenterRef.current.y;

            // Accumulate scroll deltas
            scrollAccumulatorRef.current.x += deltaX;
            scrollAccumulatorRef.current.y += deltaY;

            // Vertical scroll
            while (scrollAccumulatorRef.current.y >= SCROLL_THRESHOLD_PX) {
              onScrollPageRef.current?.('down');
              scrollAccumulatorRef.current.y -= SCROLL_THRESHOLD_PX;
            }
            while (scrollAccumulatorRef.current.y <= -SCROLL_THRESHOLD_PX) {
              onScrollPageRef.current?.('up');
              scrollAccumulatorRef.current.y += SCROLL_THRESHOLD_PX;
            }

            // Horizontal scroll (could map to navigate history or horizontal scroll)
            while (scrollAccumulatorRef.current.x >= SCROLL_THRESHOLD_PX) {
              // Right swipe - could be forward navigation
              scrollAccumulatorRef.current.x -= SCROLL_THRESHOLD_PX;
            }
            while (scrollAccumulatorRef.current.x <= -SCROLL_THRESHOLD_PX) {
              // Left swipe - could be backward navigation
              onNavigateHistoryRef.current?.('backward');
              scrollAccumulatorRef.current.x += SCROLL_THRESHOLD_PX;
            }
          }

          lastCenterRef.current = center;
          lastDistanceRef.current = distance;
        }
      },

      onPanResponderRelease: (evt: NativeSyntheticEvent<NativeTouchEvent>) => {
        const { touches } = evt.nativeEvent;
        const releasedIds = new Set(touches.map(t => t.identifier));
        
        // Find released touches
        const releasedTouches: TouchPoint[] = [];
        touchesRef.current.forEach((touch, id) => {
          if (!releasedIds.has(id)) {
            releasedTouches.push(touch);
          }
        });

        // Remove released touches
        releasedTouches.forEach(t => touchesRef.current.delete(t.id as string));

        const remainingCount = touchesRef.current.size;

        if (releasedTouches.length === 1 && remainingCount === 0) {
          // Single tap released - check for tap-to-click
          handleSingleTouchEnd(releasedTouches[0]);
        } else if (releasedTouches.length === 1 && remainingCount === 1) {
          // One finger lifted, one remains - transition to single finger mode
          const remaining = Array.from(touchesRef.current.values())[0];
          dragStartPosRef.current = { x: remaining.x, y: remaining.y };
          setTouchIndicator({ x: remaining.x, y: remaining.y });
        } else if (releasedTouches.length === 2 && remainingCount === 0) {
          // Two fingers released simultaneously - check for two-finger tap
          handleTwoFingerTap(releasedTouches[0], releasedTouches[1]);
        }

        // Clean up if no touches remain
        if (remainingCount === 0) {
          setTouchIndicator(null);
          pendingDelta.current = { x: 0, y: 0 };
          rafPending.current = false;
          lastCenterRef.current = null;
          lastDistanceRef.current = 0;
          scrollAccumulatorRef.current = { x: 0, y: 0 };
          isDraggingRef.current = false;
          dragStartPosRef.current = null;
        } else if (remainingCount === 1) {
          // Transitioned to single finger
          lastCenterRef.current = null;
          lastDistanceRef.current = 0;
          scrollAccumulatorRef.current = { x: 0, y: 0 };
        }
      },

      onPanResponderTerminate: () => {
        // Clean up all state
        touchesRef.current.clear();
        setTouchIndicator(null);
        pendingDelta.current = { x: 0, y: 0 };
        rafPending.current = false;
        lastCenterRef.current = null;
        lastDistanceRef.current = 0;
        scrollAccumulatorRef.current = { x: 0, y: 0 };
        isDraggingRef.current = false;
        dragStartPosRef.current = null;
      },
    }),
  ).current;

  return (
    <View style={styles.touchpadContainer}>
      {/* Surface: Recessed / Carved out look with subtle touch indicator */}
      <View
        style={[styles.touchpadSurface, { overflow: 'hidden', position: 'relative' }]}
        {...surfacePanResponder.panHandlers}
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
              backgroundColor: 'rgba(0, 188, 212, 0.15)',
              borderWidth: 1,
              borderColor: 'rgba(0, 188, 212, 0.4)',
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
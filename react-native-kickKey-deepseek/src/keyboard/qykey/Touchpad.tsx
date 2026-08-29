// ============================================================
// Touchpad.tsx — Multi-touch trackpad surface.
// Now accepts themeColors for dynamic styling.
// ============================================================

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, PanResponder, Pressable, NativeSyntheticEvent, NativeTouchEvent, PixelRatio } from 'react-native';
import { createKeyboardStyles } from './dynamicStyles';
import { Key } from './Key';
import { FA5Icon } from './icons';
import type { KeyboardThemeColors } from '../hooks/useKeyboardTheme';

export interface TouchpadProps {
  onScrollPage?: (direction: 'up' | 'down') => void;
  onScrollRepeatStart?: (direction: 'up' | 'down') => void;
  onScrollRepeatEnd?: () => void;
  onNavigateHistory?: (direction: 'backward' | 'forward') => Promise<boolean> | boolean;
  onMouseClick?: (button: 'left' | 'right') => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  tapToClick?: boolean;
  onPointerShow?: () => Promise<boolean> | boolean;
  onPointerHide?: () => void;
  onPointerMove?: (dx: number, dy: number) => void;
  onRequestPointerPermission?: () => void;
  themeColors: KeyboardThemeColors;
}

interface TouchPoint {
  id: string;
  x: number;
  y: number;
  startX: number;
  startY: number;
  startTime: number;
}

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
  themeColors,
}: TouchpadProps) {
  const styles = useMemo(() => createKeyboardStyles(themeColors), [themeColors]);
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);
  const [forwardHint, setForwardHint] = useState(false);
  const [touchIndicator, setTouchIndicator] = useState<{ x: number; y: number } | null>(null);

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

  const touchDownRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const hasMovedRef  = useRef(false);

  const TAP_MAX_MS = 350;
  const TAP_MAX_DP = 10;

  const touchesRef = useRef<Map<string, TouchPoint>>(new Map());
  const lastSingleTouchPosRef = useRef<{ pageX: number; pageY: number } | null>(null);
  const lastCenterRef = useRef<{ x: number; y: number } | null>(null);
  const scrollAccumulatorRef = useRef({ x: 0, y: 0 });
  const pendingDelta = useRef({ x: 0, y: 0 });
  const rafPending = useRef(false);

  const SCROLL_THRESHOLD_PX = 14;
  const SENSITIVITY = 1.25;

  const flushPointerMove = useCallback(() => {
    rafPending.current = false;
    const { x, y } = pendingDelta.current;
    pendingDelta.current = { x: 0, y: 0 };
    if (x !== 0 || y !== 0) {
      onPointerMoveRef.current?.(x, y);
    }
  }, []);

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

  const handleTouchStart = useCallback((e: any) => {
    const touch = e.nativeEvent?.touches?.[0];
    if (touch) {
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
    if (hasMovedRef.current) return;
    const duration = Date.now() - down.time;
    if (duration > TAP_MAX_MS) return;
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
            : [{ identifier: 0, locationX: evt.nativeEvent.locationX, locationY: evt.nativeEvent.locationY, pageX: evt.nativeEvent.pageX, pageY: evt.nativeEvent.pageY }];
        const now = Date.now();

        touchesRef.current.clear();
        activeTouches.forEach((t) => {
          const id = String(t.identifier ?? 0);
          touchesRef.current.set(id, { id, x: t.locationX, y: t.locationY, startX: t.locationX, startY: t.locationY, startTime: now });
        });

        const touchCount = activeTouches.length;

        if (touchCount === 1) {
          const touch = activeTouches[0];
          setTouchIndicator({ x: touch.locationX, y: touch.locationY });
          lastSingleTouchPosRef.current = { pageX: touch.pageX, pageY: touch.pageY };
          pendingDelta.current = { x: 0, y: 0 };
          rafPending.current = false;
        } else if (touchCount === 2) {
          lastCenterRef.current = { x: (activeTouches[0].pageX + activeTouches[1].pageX) / 2, y: (activeTouches[0].pageY + activeTouches[1].pageY) / 2 };
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
            : [{ identifier: 0, locationX: evt.nativeEvent.locationX, locationY: evt.nativeEvent.locationY, pageX: evt.nativeEvent.pageX, pageY: evt.nativeEvent.pageY }];
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

            if (!hasMovedRef.current) {
              const id = String(touch.identifier ?? 0);
              const initial = touchesRef.current.get(id);
              if (initial) {
                const travelled = Math.hypot(touch.locationX - initial.startX, touch.locationY - initial.startY);
                if (travelled > TAP_MAX_DP) hasMovedRef.current = true;
              }
            }
          }
          lastSingleTouchPosRef.current = { pageX: touch.pageX, pageY: touch.pageY };
        } else if (touchCount === 2) {
          setTouchIndicator(null);
          hasMovedRef.current = true;
          const t1 = activeTouches[0];
          const t2 = activeTouches[1];
          const center = { x: (t1.pageX + t2.pageX) / 2, y: (t1.pageY + t2.pageY) / 2 };

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

        const trackedCount = touchesRef.current.size;
        if (trackedCount === 2) {
          const endedTouches = (changedTouches && changedTouches.length > 0) ? changedTouches : (touches && touches.length > 0) ? touches : [];
          if (endedTouches.length >= 2) {
            const t1 = touchesRef.current.get(String(endedTouches[0].identifier ?? 0));
            const t2 = touchesRef.current.get(String(endedTouches[1].identifier ?? 1));
            if (t1 && t2) {
              const duration = Math.max(now - t1.startTime, now - t2.startTime);
              const disp1 = Math.hypot(endedTouches[0].locationX - t1.startX, endedTouches[0].locationY - t1.startY);
              const disp2 = Math.hypot(endedTouches[1].locationX - t2.startX, endedTouches[1].locationY - t2.startY);
              if (duration < 400 && disp1 < TAP_MAX_DP * 2 && disp2 < TAP_MAX_DP * 2) {
                onMouseClickRef.current?.('right');
              }
            }
          }
        }

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
              backgroundColor: `${themeColors.themePrimary}26`,
              borderWidth: 1,
              borderColor: `${themeColors.themePrimary}66`,
              pointerEvents: 'none',
            }}
          />
        )}
      </View>

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
            <Text style={{ color: themeColors.themePrimary, fontSize: 9, fontWeight: 'bold', textAlign: 'center', marginTop: 4 }}>
              GRANT →
            </Text>
          </Pressable>
        </View>
      )}

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
        <View style={styles.touchpadButtonArea}>
          <Key variant="nav" isIcon type="mouse" onPressHandler={() => onNavigateHistory?.('backward')} themeColors={themeColors}>
            <FA5Icon name="chevron-left" size={12} color={themeColors.keyText} />
          </Key>
          <Key variant="mouse" type="mouse" onPressHandler={() => onDragStartRef.current?.()} onRepeatEnd={() => onDragEndRef.current?.()} themeColors={themeColors}>
            <Text style={styles.btnText}>L</Text>
          </Key>
        </View>

        <View style={styles.scrollStack}>
          <Key variant="scroll" isIcon type="mouse" onPressHandler={() => onScrollPageRef.current?.('up')} onRepeatStart={() => onScrollRepeatStart?.('up')} onRepeatEnd={() => onScrollRepeatEnd?.()} themeColors={themeColors}>
            <FA5Icon name="caret-up" size={14} color={themeColors.keyText} />
          </Key>
          <Key variant="scroll" isIcon type="mouse" onPressHandler={() => onScrollPageRef.current?.('down')} onRepeatStart={() => onScrollRepeatStart?.('down')} onRepeatEnd={() => onScrollRepeatEnd?.()} themeColors={themeColors}>
            <FA5Icon name="caret-down" size={14} color={themeColors.keyText} />
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
            themeColors={themeColors}
          >
            <FA5Icon name="chevron-right" size={12} color={themeColors.keyText} />
          </Key>
          <Key variant="mouse" type="mouse" onPressHandler={() => onMouseClickRef.current?.('right')} themeColors={themeColors}>
            <Text style={styles.btnText}>R</Text>
          </Key>
        </View>
      </View>
    </View>
  );
}

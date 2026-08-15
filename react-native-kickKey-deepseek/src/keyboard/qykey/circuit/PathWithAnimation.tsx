// ============================================================
// PathWithAnimation.tsx — ported from qykey/components/Circuit/
// PathWithAnimation.tsx.
//
// qykey animates strokeDashoffset with react-native-reanimated.
// Reanimated needs a worklets plugin + a JSI module registered in
// the keyboard ReactHost delegate, which the KickKey IME process
// does not set up. Instead this uses React Native's core Animated
// (JS driver) — same visual: a bright dash travels along the wire
// for animated wires, a one-shot draw-in for static wires.
// ============================================================

import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { Path } from 'react-native-svg';
import { config } from './config';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const PathWithAnimationComponent = ({
  d,
  color,
  width,
  isAnimated,
  pathLength,
  animationTime,
}: {
  d: string;
  color: string;
  width: number;
  isAnimated: boolean;
  pathLength: number;
  animationTime: number;
}) => {
  const offset = useRef(new Animated.Value(isAnimated ? 0 : pathLength)).current;

  useEffect(() => {
    let anim: Animated.CompositeAnimation | null = null;

    if (isAnimated) {
      // Bright glow travels along the wire, looping forever.
      anim = Animated.loop(
        Animated.timing(offset, {
          toValue: -(pathLength + config().glowLength),
          duration: animationTime * 1000,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      );
      anim.start();
    } else {
      // Static wire draws itself in once.
      offset.setValue(pathLength);
      anim = Animated.sequence([
        Animated.delay(100),
        Animated.timing(offset, {
          toValue: 0,
          duration: 500,
          easing: Easing.in(Easing.ease),
          useNativeDriver: false,
        }),
      ]);
      anim.start();
    }

    return () => {
      if (anim) anim.stop();
    };
  }, [isAnimated, animationTime, pathLength, offset]);

  return (
    <AnimatedPath
      d={d}
      stroke={color}
      strokeWidth={width}
      fill="none"
      strokeDasharray={isAnimated ? [pathLength, 10] : [pathLength, pathLength]}
      strokeDashoffset={offset as unknown as number}
    />
  );
};

export const PathWithAnimation = React.memo(PathWithAnimationComponent);

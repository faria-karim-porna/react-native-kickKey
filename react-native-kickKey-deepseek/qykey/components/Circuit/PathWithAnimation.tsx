import React, { useEffect } from "react";
import { Path } from "react-native-svg";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import { config } from "../../helper/data";

const AnimatedPath = Animated.createAnimatedComponent(Path);
// Simple path length calculator component
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
  const offset = useSharedValue(isAnimated ? 0 : pathLength);

  useEffect(() => {
    if (isAnimated) {
      offset.value = withRepeat(
        withTiming(-(pathLength + config().glowLength), {
          duration: animationTime * 1000,
          easing: Easing.linear,
        }),
        -1,
        false,
      );
    } else {
      offset.value = withDelay(
        100,
        withTiming(0, {
          duration: 500,
          easing: Easing.in(Easing.ease),
        }),
      );
    }

    return () => {
      cancelAnimation(offset);
    };
  }, [isAnimated, animationTime, pathLength]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: offset.value,
  }));

  return (
    <AnimatedPath
      d={d}
      stroke={color}
      strokeWidth={width}
      fill="none"
      strokeDasharray={isAnimated ? [pathLength, 10] : [pathLength, pathLength]}
      animatedProps={animatedProps}
    />
  );
};

export const PathWithAnimation = React.memo(PathWithAnimationComponent);

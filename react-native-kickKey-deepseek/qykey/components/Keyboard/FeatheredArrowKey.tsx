import React from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

const FeatheredArrowKeyComponent = ({
  direction,
  color = "#444",
}: {
  direction: "up" | "down" | "left" | "right";
  color?: string;
}) => {
  const rotation = {
    up: "0deg",
    down: "180deg",
    left: "-90deg",
    right: "90deg",
  }[direction];

  return (
    <View style={{ transform: [{ rotate: rotation }] }}>
      <Svg width="10" height="10" viewBox="0 0 24 24">
        <Path d="M12 4L4 20L12 16L20 20L12 4Z" fill={color} />
      </Svg>
    </View>
  );
};

export const FeatheredArrowKey = React.memo(FeatheredArrowKeyComponent);

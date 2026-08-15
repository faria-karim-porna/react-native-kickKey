import React, { useEffect, useState, useRef } from "react";
import { View } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import styles from "../../assets/styles/styles";
import { config } from "../../helper/data";
import { Cell } from "../../helper/Cell";
import { Wire } from "../../helper/Wire";
import { PathWithAnimation } from "./PathWithAnimation";

const { floor, random } = Math;

const CircuitComponent = () => {
  const [wires, setWires] = useState<
    {
      pathData: string;
      startDot: { cx: number; cy: number };
      endDot: { cx: number; cy: number };
      isAnimated: boolean;
      pathLength: number;
      animationTime: number;
      radius: number;
      isFill: boolean;
    }[]
  >([]);

  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    generateWires();
  }, [dimensions]);

  const generateWires = () => {
    const { width, height } = dimensions;

    // Minimum size to generate anything
    if (width < 100 || height < 100) return;

    // Reset
    const allCells: Cell[] = [];
    const cellLookup: { [key: string]: Cell } = {};
    const allWires: Wire[] = [];

    const totalRows = floor(height / config().cellSize);
    const totalCols = floor(width / config().cellSize);

    // Ensure at least some rows and columns
    if (totalRows === 0 || totalCols === 0) return;

    let freeCellCount = totalRows * totalCols;

    // Create grid
    for (let y = 0; y < totalRows; y += 1) {
      for (let x = 0; x < totalCols; x += 1) {
        const cell = new Cell(x, y);
        allCells.push(cell);
        cellLookup[`${x},${y}`] = cell;
      }
    }

    // Generate wires
    const newWires = [];
    let attempts = 0;
    const maxAttempts = 1000; // Prevent infinite loop

    while (allWires.length < freeCellCount && attempts < maxAttempts) {
      attempts++;
      const randomIndex = floor(random() * allCells.length);
      const cell = allCells[randomIndex];
      if (!cell.isFree) continue;

      const wire = new Wire(cell);
      freeCellCount--;

      wire.grow(totalRows, totalCols, allCells, cellLookup);

      // Only add wires with at least 2 cells
      if (wire.pathCells.length >= 2) {
        const pathData = wire.getPathData(config().cellSize);
        const startDot = wire.getStartDot(config().cellSize);
        const endDot = wire.getEndDot(config().cellSize);

        // Calculate approximate path length
        let pathLength = 0;
        for (let i = 1; i < wire.pathCells.length; i++) {
          const prev = wire.pathCells[i - 1];
          const curr = wire.pathCells[i];
          const dx = Math.abs(curr.x - prev.x) * config().cellSize;
          const dy = Math.abs(curr.y - prev.y) * config().cellSize;
          pathLength += Math.sqrt(dx * dx + dy * dy);
        }

        const animationTime = pathLength / config().glowSpeed;
        const isAnimated = random() > 0.5;
        const radius =
          random() * (config().cellSize / 6) + config().cellSize / 12;
        const isFill = random() > 0.5;

        newWires.push({
          pathData,
          startDot,
          endDot,
          isAnimated,
          pathLength,
          animationTime,
          radius,
          isFill,
        });

        allWires.push(wire);
      } else {
        // If wire is too short, free the cell again
        cell.isFree = true;
        freeCellCount++;
      }
    }

    setWires(newWires);
  };

  return (
    <View
      style={[styles.circuitContainer, { backgroundColor: config().bgColor }]}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setDimensions({ width, height });
      }}
    >
      {dimensions.width > 0 && dimensions.height > 0 ? (
        <Svg
          width={dimensions.width}
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        >
          {wires.map((wire, index) => (
            <React.Fragment key={index}>
              {/* Background glow path for animated wires */}
              {wire.isAnimated && (
                <Path
                  d={wire.pathData}
                  stroke={config().wireColor}
                  strokeWidth={wire.radius * 2}
                  fill="none"
                />
              )}

              {/* Main path with animation */}
              <PathWithAnimation
                d={wire.pathData}
                color={
                  wire.isAnimated ? config().glowBgColor : config().wireColor
                }
                width={wire.radius * 2}
                isAnimated={wire.isAnimated}
                pathLength={wire.pathLength}
                animationTime={wire.animationTime}
              />

              {/* Start dot */}
              <Circle
                cx={wire.startDot.cx}
                cy={wire.startDot.cy}
                r={wire.radius}
                stroke={config().wireColor}
                strokeWidth={wire.radius / 4}
                fill={wire.isFill ? config().wireColor : config().bgColor}
              />

              {/* End dot */}
              <Circle
                cx={wire.endDot.cx}
                cy={wire.endDot.cy}
                r={wire.radius}
                stroke={config().wireColor}
                strokeWidth={wire.radius / 2}
                fill={wire.isFill ? config().wireColor : config().bgColor}
              />
            </React.Fragment>
          ))}
        </Svg>
      ) : null}
    </View>
  );
};

export const Circuit = React.memo(CircuitComponent);

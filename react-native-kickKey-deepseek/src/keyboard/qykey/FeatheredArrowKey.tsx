// ============================================================
// FeatheredArrowKey.tsx — ported from qykey.
// The qykey original draws an SVG arrow with react-native-svg;
// SVG is unavailable in the IME process, so the same arrow shape
// is rendered with a unicode glyph at matching size/color.
// ============================================================

import React from 'react';
import { Text } from 'react-native';

const GLYPH: Record<'up' | 'down' | 'left' | 'right', string> = {
  up: '▲',
  down: '▼',
  left: '◀',
  right: '▶',
};

const FeatheredArrowKeyComponent = ({
  direction,
  color = '#444',
}: {
  direction: 'up' | 'down' | 'left' | 'right';
  color?: string;
}) => {
  return (
    <Text
      style={{
        color,
        fontSize: 8,
        fontWeight: '700',
        lineHeight: 10,
        textAlign: 'center',
        includeFontPadding: false,
      }}
    >
      {GLYPH[direction]}
    </Text>
  );
};

export const FeatheredArrowKey = React.memo(FeatheredArrowKeyComponent);

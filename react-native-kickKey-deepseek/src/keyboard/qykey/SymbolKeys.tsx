// ============================================================
// SymbolKeys.tsx — ported from qykey (symbol page 1).
// qykey left most symbol keys display-only; here every symbol
// commits through the native module. F-keys / Ctrl stay visual.
// ============================================================

import React from 'react';
import { View } from 'react-native';
import styles from './styles';
import { Key } from './Key';
import { MDIIcon } from './icons';

type SymbolKeysProps = {
  onNext?: () => void;
  onKeyPress?: (key: string) => void;
  onBackspace?: () => void;
  onEnter?: () => void;
};

export default function SymbolKeys({ onNext, onKeyPress, onBackspace, onEnter }: SymbolKeysProps) {
  const press = (s: string) => () => onKeyPress?.(s);

  return (
    <View style={styles.container}>
      {/* 1. Number / Symbol Row */}
      <View style={styles.line}>
        {['@', '#'].map((s, i) => (
          <React.Fragment key={s}>
            <Key onPressHandler={press(s)}>{s}</Key>
            {i === 0 && (
              <>
                <Key special onPressHandler={press('(')}>(</Key>
                <Key special onPressHandler={press(')')}>)</Key>
                <Key functionKey onPressHandler={press('+')}>+</Key>
                <Key functionKey onPressHandler={press('-')}>-</Key>
                <Key functionKey onPressHandler={press('*')}>*</Key>
                <Key functionKey onPressHandler={press('/')}>/</Key>
                <Key special onPressHandler={press('{')}>{'{'}</Key>
                <Key special onPressHandler={press('}')}>{'}'}</Key>
              </>
            )}
          </React.Fragment>
        ))}
      </View>

      {/* 2. Q Row Symbols */}
      <View style={styles.line}>
        <Key onPressHandler={press('%')}>%</Key>
        <Key special onPressHandler={press('[')}>[</Key>
        <Key special onPressHandler={press(']')}>]</Key>
        {['!', '$', '^'].map((s) => (
          <Key key={s} onPressHandler={press(s)}>{s}</Key>
        ))}
        <Key special onPressHandler={press('<')}>{'<'}</Key>
        <Key special onPressHandler={press('>')}>{'>'}</Key>
        <Key onPressHandler={press('&')}>&</Key>
      </View>

      {/* 3. A Row Symbols */}
      <View style={[styles.line, styles.symNextLine]}>
        <View style={styles.symNextLineInner}>
          {['=', '`', "'", '_', '~', '\\', '|'].map((s) => (
            <Key key={s} onPressHandler={press(s)}>{s}</Key>
          ))}
        </View>
        <Key
          functionKey
          style={styles.moreWider}
          onPressHandler={() => onNext?.()}
        >
          Next
        </Key>
      </View>

      {/* 4. Z Row (Shift + F1-F7 + Backspace) */}
      <View style={styles.line}>
        <Key special style={styles.wider} isIcon>
          <MDIIcon name="arrow-up-bold-outline" size={16} color="#2c2b2b" />
        </Key>
        {['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7'].map((f) => (
          <Key key={f} functionKey>{f}</Key>
        ))}
        <Key special style={styles.wider} isIcon onPressHandler={onBackspace}>
          <MDIIcon name="backspace-outline" size={16} color="#2c2b2b" />
        </Key>
      </View>

      {/* 5. Bottom Row (Ctrl + F8-F12 + Enter) */}
      <View style={[styles.line, styles.lastLine]}>
        <Key special style={styles.wider}>
          Ctrl
        </Key>
        <View style={styles.lastLineInner}>
          {['F8', 'F9', 'F10', 'F11', 'F12'].map((f) => (
            <Key key={f} functionKey>{f}</Key>
          ))}
        </View>
        <Key special style={styles.wider} isIcon onPressHandler={onEnter}>
          <MDIIcon name="keyboard-return" size={16} color="#2c2b2b" />
        </Key>
      </View>
    </View>
  );
}

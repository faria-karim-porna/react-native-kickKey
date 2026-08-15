// ============================================================
// MainKeys.tsx — ported from qykey.
//   - Key presses commit through the native KickKey module.
//   - Space-bar swipe cycles the language (en-US ⇄ banglish ⇄ bn-BD).
//   - Backspace gained long-press repeat (invisible UI change).
// ============================================================

import React, { useState } from 'react';
import { View, Text } from 'react-native';
import styles from './styles';
import { Key } from './Key';
import type { AppLanguage } from './QykeyKeyboard';

type MainKeysProps = {
  onKeyPress?: (key: string) => void;
  onBackspace?: () => void;
  onBackspaceRepeatStart?: () => void;
  onBackspaceRepeatEnd?: () => void;
  onSpace?: () => void;
  onEnter?: () => void;
  language?: AppLanguage;
  onLanguageChange?: (lang: AppLanguage) => void;
};

const MainKeysComponent = ({
  onKeyPress,
  onBackspace,
  onBackspaceRepeatStart,
  onBackspaceRepeatEnd,
  onSpace,
  onEnter,
  language = 'en-US',
  onLanguageChange,
}: MainKeysProps) => {
  const [isCapsOn, setIsCapsOn] = useState(false);
  const cycleLeft: Record<AppLanguage, AppLanguage> = {
    'en-US': 'banglish',
    banglish: 'bn-BD',
    'bn-BD': 'en-US',
  };
  const cycleRight: Record<AppLanguage, AppLanguage> = {
    'en-US': 'bn-BD',
    'bn-BD': 'banglish',
    banglish: 'en-US',
  };

  const spaceLabel =
    language === 'en-US' ? 'English' : language === 'banglish' ? 'Bangla' : 'বাংলা';
  return (
    <>
      {/* Alpha-Numeric Rows */}
      {[
        language === 'bn-BD' ? ['১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯', '০'] : ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        language === 'bn-BD'
          ? isCapsOn
            ? ['অ', 'আ', 'ই', 'ঈ', 'উ', 'ঊ', 'ঋ', 'এ', 'ঐ', 'ও', 'ঔ', 'হ']
            : ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ঞ', 'ট', 'ঠ']
          : isCapsOn
            ? ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P']
            : ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
        language === 'bn-BD'
          ? isCapsOn
            ? ['া', 'ি', 'ী', 'ু', 'ূ', 'ৃ', 'ে', 'ৈ', 'ো', 'ৌ']
            : ['ড', 'ঢ', 'ণ', 'ত', 'থ', 'দ', 'ধ', 'ন', 'প', 'ফ']
          : isCapsOn
            ? ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L']
            : ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
      ].map((row, i) => (
        <View key={i} style={styles.line}>
          {row.map((k) => (
            <Key
              key={k}
              onPressHandler={() => onKeyPress?.(k)}
              language={i === 0 ? undefined : language} // ← only pass language to the number row for now
            >
              {k}
            </Key>
          ))}
        </View>
      ))}

      {/* Z Row */}
      <View style={styles.line}>
        <Key
          special
          style={styles.wider}
          isIcon
          hasActiveState
          onPressHandler={() => setIsCapsOn(!isCapsOn)}
        >
          <Text style={styles.keyIconText}>▲</Text>
        </Key>
        {(language === 'bn-BD'
          ? isCapsOn
            ? ['্', 'ং', 'ঃ', 'ঁ', 'ড়', 'ঢ়', 'য়', 'ৎ', 'র্']
            : ['ব', 'ভ', 'ম', 'য', 'র', 'ল', 'শ', 'ষ', 'স']
          : isCapsOn
            ? ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
            : ['z', 'x', 'c', 'v', 'b', 'n', 'm']
        ).map((k) => (
          <Key
            key={k}
            onPressHandler={() => onKeyPress?.(k)} // ← wire up
            language={language} // ← pass language to Z row keys
          >
            {k}
          </Key>
        ))}
        <Key
          special
          style={styles.wider}
          isIcon
          onPressHandler={onBackspace}
          onRepeatStart={onBackspaceRepeatStart}
          onRepeatEnd={onBackspaceRepeatEnd}
        >
          <Text style={styles.keyIconText}>⌫</Text>
        </Key>
      </View>

      {/* Bottom Row */}
      <View style={styles.line}>
        <Key special style={styles.wider} hasActiveState>
          Ctrl
        </Key>
        <Key special style={styles.wider} hasActiveState>
          ⊞
        </Key>
        <Key special style={styles.wider} hasActiveState>
          Alt
        </Key>

        <Key
          functionKey
          flex={1}
          onPressHandler={onSpace}
          onSwipeLeft={() => onLanguageChange?.(cycleLeft[language ?? 'en-US'])}
          onSwipeRight={() => onLanguageChange?.(cycleRight[language ?? 'en-US'])}
        >
          <Text style={styles.spaceText}>◀ {spaceLabel} ▶</Text>
        </Key>

        <Key special style={styles.wider}>
          Tab
        </Key>
        <Key special style={styles.wider}>
          Esc
        </Key>
        <Key
          special
          style={styles.wider}
          isIcon
          onPressHandler={onEnter}
        >
          <Text style={styles.keyIconText}>↵</Text>
        </Key>
      </View>
    </>
  );
};

export const MainKeys = React.memo(MainKeysComponent);

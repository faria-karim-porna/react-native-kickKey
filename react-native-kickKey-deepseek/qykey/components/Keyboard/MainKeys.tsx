import React, { useState } from "react";
import { View, Text } from "react-native";
import styles from "../../assets/styles/styles";
import { Key } from "./Key";
import { AppLanguage } from "./Keyboard";

type MainKeysProps = {
  onKeyPress?: (key: string) => void;
  onBackspace?: () => void;
  language?: AppLanguage;
  setLanguage?: (lang: AppLanguage) => void;
};

const MainKeysComponent = ({ onKeyPress, onBackspace, language = "en-US", setLanguage }: MainKeysProps) => {
  const [isCapsOn, setIsCapsOn] = useState(false);
  const cycleLeft: Record<AppLanguage, AppLanguage> = {
    "en-US": "banglish",
    banglish: "bn-BD",
    "bn-BD": "en-US",
  };
  const cycleRight: Record<AppLanguage, AppLanguage> = {
    "en-US": "bn-BD",
    "bn-BD": "banglish",
    banglish: "en-US",
  };

  const spaceLabel = language === "en-US" ? "English" : language === "banglish" ? "Bangla" : "বাংলা";
  return (
    <>
      {/* Alpha-Numeric Rows */}
      {[
        language === "bn-BD" ? ["১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯", "০"] : ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
        language === "bn-BD"
          ? isCapsOn
            ? ["অ", "আ", "ই", "ঈ", "উ", "ঊ", "ঋ", "এ", "ঐ", "ও", "ঔ", "হ"]
            : ["ক", "খ", "গ", "ঘ", "ঙ", "চ", "ছ", "জ", "ঝ", "ঞ", "ট", "ঠ"]
          : isCapsOn
            ? ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"]
            : ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
        language === "bn-BD"
          ? isCapsOn
            ? ["া", "ি", "ী", "ু", "ূ", "ৃ", "ে", "ৈ", "ো", "ৌ"]
            : ["ড", "ঢ", "ণ", "ত", "থ", "দ", "ধ", "ন", "প", "ফ"]
          : isCapsOn
            ? ["A", "S", "D", "F", "G", "H", "J", "K", "L"]
            : ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
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
          iconType="material"
          iconName="arrow-up-bold-outline"
          onPressHandler={() => setIsCapsOn(!isCapsOn)}
        />
        {(language === "bn-BD"
          ? isCapsOn
            ? ["্", "ং", "ঃ", "ঁ", "ড়", "ঢ়", "য়", "ৎ", "র্"]
            : ["ব", "ভ", "ম", "য", "র", "ল", "শ", "ষ", "স"]
          : isCapsOn
            ? ["Z", "X", "C", "V", "B", "N", "M"]
            : ["z", "x", "c", "v", "b", "n", "m"]
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
          iconType="material"
          iconName="backspace-outline"
          onPressHandler={onBackspace} // ← wire up
        />
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
          onPressHandler={() => onKeyPress?.(" ")}
          onSwipeLeft={() => setLanguage?.(cycleLeft[language ?? "en-US"])}
          onSwipeRight={() => setLanguage?.(cycleRight[language ?? "en-US"])}
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
          iconType="material"
          iconName="keyboard-return"
          iconColor="#444"
          onPressHandler={() => onKeyPress?.("\n")} // ← enter
        />
      </View>
    </>
  );
};

export const MainKeys = React.memo(MainKeysComponent);

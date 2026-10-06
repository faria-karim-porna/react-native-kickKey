// ============================================================
// EmojiBoard.tsx — ported from qykey.
// Now accepts themeColors for dynamic styling.
// ============================================================

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
} from 'react-native';
import { Key } from '../Key';
import { emojis, emojiCategories } from '../../../data/emojiData';
import { FA5Icon, MDIIcon } from './KeyIcons';
import {
  createKeyboardStyles,
  ROW_GAP_V,
} from '../../../../assets/styles/dynamicStyles';
import type { KeyboardThemeColors } from '../../../hooks/useKeyboardTheme';

type EmojiBoardProps = {
  onEmojiSelect?: (emoji: string) => void;
  /** Backspace — same handler as the other keyboard pages. */
  onBackspace?: () => void;
  themeColors: KeyboardThemeColors;
};

const COLUMNS = 8;
// Actual rendered row height = emoji key height + vertical row gap.
// Must match the `row` style (marginBottom: ROW_GAP_V) in dynamicStyles.ts
// so FlatList `getItemLayout` scroll estimates stay accurate.
const rowHeightFor = (keyHeight: number) => keyHeight + ROW_GAP_V;

const EmojiBoardComponent = ({ onEmojiSelect, onBackspace, themeColors }: EmojiBoardProps) => {
  const styles = useMemo(() => createKeyboardStyles(themeColors), [themeColors]);
  const ROW_HEIGHT = useMemo(() => rowHeightFor(themeColors.keyHeight), [themeColors.keyHeight]);
  const [activeTab, setActiveTab] = useState('people');

  const currentEmojis = useMemo(() => emojis()[activeTab] || [], [activeTab]);

  const handleEmojiPress = useCallback(
    (emoji: string) => () => onEmojiSelect?.(emoji),
    [onEmojiSelect],
  );

  const renderEmojiItem = useCallback(
    ({ item }: { item: string }) => (
      <Key style={styles.emojiKey} onPressHandler={handleEmojiPress(item)} themeColors={themeColors}>
        <Text style={styles.emojiText}>{item}</Text>
      </Key>
    ),
    [handleEmojiPress, styles, themeColors],
  );

  const [showTooltipId, setShowTooltipId] = useState<string | null>(null);
  const tooltipTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    setShowTooltipId(tabId);
    if (tooltipTimer.current) {
      clearTimeout(tooltipTimer.current);
    }
    tooltipTimer.current = setTimeout(() => {
      setShowTooltipId(null);
    }, 500);
  };

  const renderTabItem = (tab: ReturnType<typeof emojiCategories>[0]) => {
    const isActive = activeTab === tab.id;
    const isTooltipVisible = showTooltipId === tab.id;
    return (
      <View key={tab.id} style={styles.tabContainer}>
        {isTooltipVisible && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>{tab.title}</Text>
            <View style={styles.tooltipArrow} />
          </View>
        )}

        <Pressable
          onPress={() => handleTabPress(tab.id)}
          style={[styles.tabButton, isActive && styles.activeTabButton]}
        >
          {tab.lib === 'FontAwesome5' ? (
            <FA5Icon
              name={tab.icon}
              size={isActive ? 14 : 16}
              color={isActive ? '#fff' : themeColors.keyText}
            />
          ) : (
            <MDIIcon
              name={tab.icon}
              size={isActive ? 16 : 18}
              color={isActive ? '#fff' : themeColors.keyText}
            />
          )}
          {isActive && (
            <View
              style={[styles.tabActiveIndicator, { borderColor: '#fff' }]}
            />
          )}
        </Pressable>
      </View>
    );
  };

  return (
    <>
      <View style={[styles.emojiBoardInset, styles.container]}>
        <View style={styles.tabBar}>{emojiCategories().map(renderTabItem)}</View>

        <View style={styles.emojiGridContainer}>
          <FlatList
            data={currentEmojis}
            renderItem={renderEmojiItem}
            keyExtractor={(item, index) => `${index}-${item}`}
            numColumns={COLUMNS}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            getItemLayout={(_, index) => ({
              length: ROW_HEIGHT,
              offset: ROW_HEIGHT * Math.floor(index / COLUMNS),
              index,
            })}
            initialNumToRender={COLUMNS * 3}
            maxToRenderPerBatch={COLUMNS * 3}
            windowSize={5}
            updateCellsBatchingPeriod={50}
          />
        </View>

        {/* Fixed backspace row — the key sits at the same x range as the
            backspace on the letter/symbol/system pages. */}
        <View style={styles.line}>
          <View style={styles.emojiBackspaceRow}>
            <Key
              special
              style={styles.wider}
              isIcon
              onPressHandler={onBackspace}
              themeColors={themeColors}
            >
              <MDIIcon name="backspace-outline" size={16} color={themeColors.keyText} />
            </Key>
          </View>
        </View>
      </View>
    </>
  );
};

export const EmojiBoard = React.memo(EmojiBoardComponent);

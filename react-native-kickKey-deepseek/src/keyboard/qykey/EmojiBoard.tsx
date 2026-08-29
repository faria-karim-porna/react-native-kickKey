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
import { Key } from './Key';
import { emojis, emojiCategories } from './emojiData';
import { FA5Icon, MDIIcon } from './icons';
import { createKeyboardStyles } from './dynamicStyles';
import type { KeyboardThemeColors } from '../hooks/useKeyboardTheme';

type EmojiBoardProps = {
  onEmojiSelect?: (emoji: string) => void;
  themeColors: KeyboardThemeColors;
};

const COLUMNS = 8;
const ROW_HEIGHT = 35;

const EmojiBoardComponent = ({ onEmojiSelect, themeColors }: EmojiBoardProps) => {
  const styles = useMemo(() => createKeyboardStyles(themeColors), [themeColors]);
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
    </>
  );
};

export const EmojiBoard = React.memo(EmojiBoardComponent);

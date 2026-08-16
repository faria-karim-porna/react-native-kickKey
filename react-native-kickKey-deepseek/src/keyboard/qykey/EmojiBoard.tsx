// ============================================================
// EmojiBoard.tsx — ported from qykey.
//   - Emoji selection commits through the native KickKey module
//     and records usage for the recent tray.
//   - Category tab icons (FontAwesome5 / MaterialCommunityIcons
//     in qykey) replaced with unicode emoji glyphs.
//
// Fixes over the qykey original:
//   - index-based keyExtractor: the raw data contains duplicate
//     entries; keying by the emoji string alone made FlatList
//     drop the duplicates ("missing" emojis).
//   - memoized per-item press handlers so Key's React.memo
//     actually skips re-renders while scrolling / switching tabs.
//   - getItemLayout + windowSize/batch tuning for smooth
//     scrolling in the IME process.
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
import styles from './styles';

type EmojiBoardProps = {
  onEmojiSelect?: (emoji: string) => void;
};

// Tab glyphs replacing qykey's FontAwesome5 / MaterialCommunityIcons icons
const TAB_GLYPHS: Record<string, string> = {
  recent: '🕐',
  people: '😊',
  nature: '🌿',
  food: '🍔',
  activity: '🏀',
  travel: '✈️',
  objects: '💡',
  signs: '📍',
  flags: '🚩',
};

const COLUMNS = 8;
// emojiKey height (32) + row marginBottom (3)
const ROW_HEIGHT = 35;

const EmojiBoardComponent = ({ onEmojiSelect }: EmojiBoardProps) => {
  const [activeTab, setActiveTab] = useState('people');

  const currentEmojis = useMemo(() => emojis()[activeTab] || [], [activeTab]);

  // Stable per-item handler: returns a fresh function per emoji, but the
  // same function for that emoji across re-renders, so Key's React.memo
  // can skip re-rendering mounted keys.
  const handleEmojiPress = useCallback(
    (emoji: string) => () => onEmojiSelect?.(emoji),
    [onEmojiSelect],
  );

  const renderEmojiItem = useCallback(
    ({ item }: { item: string }) => (
      <Key style={styles.emojiKey} onPressHandler={handleEmojiPress(item)}>
        <Text style={styles.emojiText}>{item}</Text>
      </Key>
    ),
    [handleEmojiPress],
  );

  const [showTooltipId, setShowTooltipId] = useState<string | null>(null);
  const tooltipTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTabPress = (tabId: string) => {
    // Update the actual category
    setActiveTab(tabId);

    // Show the tooltip
    setShowTooltipId(tabId);

    // Clear any existing timer to prevent early vanishing
    if (tooltipTimer.current) {
      clearTimeout(tooltipTimer.current);
    }

    // Set timer to hide tooltip after 1.5 seconds
    tooltipTimer.current = setTimeout(() => {
      setShowTooltipId(null);
    }, 500);
  };

  const renderTabItem = (tab: ReturnType<typeof emojiCategories>[0]) => {
    const isActive = activeTab === tab.id;
    const isTooltipVisible = showTooltipId === tab.id; // Only show if timer is active
    return (
      <View key={tab.id} style={styles.tabContainer}>
        {/* Immediate Tooltip Above Button */}
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
          <Text style={isActive ? styles.emojiTabIconActive : styles.emojiTabIcon}>
            {TAB_GLYPHS[tab.id] || '•'}
          </Text>
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
      {/* Chocolate-Style Tab Bar */}
      <View style={styles.tabBar}>{emojiCategories().map(renderTabItem)}</View>

      {/* Emoji Grid Section */}
      <View style={styles.emojiGridContainer}>
        <FlatList
          data={currentEmojis}
          renderItem={renderEmojiItem}
          keyExtractor={(item, index) => `${index}-${item}`}
          numColumns={COLUMNS} // Mimics the Ridmik/Gboard grid layout
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

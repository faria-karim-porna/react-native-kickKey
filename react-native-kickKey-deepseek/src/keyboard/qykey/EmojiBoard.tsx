// ============================================================
// EmojiBoard.tsx — ported from qykey.
//   - Emoji selection commits through the native KickKey module
//     and records usage for the recent tray.
//   - Category tab icons (FontAwesome5 / MaterialCommunityIcons
//     in qykey) replaced with unicode emoji glyphs.
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

const EmojiBoardComponent = ({ onEmojiSelect }: EmojiBoardProps) => {
  const [activeTab, setActiveTab] = useState('people');

  const currentEmojis = useMemo(() => emojis()[activeTab] || [], [activeTab]);

  const renderEmojiItem = useCallback(
    ({ item }: { item: string }) => (
      <Key style={styles.emojiKey} onPressHandler={() => onEmojiSelect?.(item)}>
        <Text style={styles.emojiText}>{item}</Text>
      </Key>
    ),
    [onEmojiSelect],
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
          keyExtractor={(item) => item}
          numColumns={8} // Mimics the Ridmik/Gboard grid layout
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        />
      </View>
    </>
  );
};

export const EmojiBoard = React.memo(EmojiBoardComponent);

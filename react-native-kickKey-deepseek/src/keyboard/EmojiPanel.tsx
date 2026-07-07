import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  NativeModules,
} from 'react-native';
import { EMOJI_CATEGORIES, DEFAULT_CATEGORY_ID } from './data/emojiData';
import type { Theme } from './types';

const { KickKey } = NativeModules;
const RECENT_TAB_ID = 'recent';
const COLUMNS = 8;

interface EmojiPanelProps {
  theme: Theme;
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

export default function EmojiPanel({ theme, onEmojiSelect, onClose }: EmojiPanelProps) {
  const [activeTab, setActiveTab] = useState<string>(RECENT_TAB_ID);
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);

  // Load recent emojis from native history on mount.
  // If the list is empty (first ever use), default to the Smileys tab
  // instead of showing an empty Recent screen.
  useEffect(() => {
    KickKey.getRecentEmojis()
      .then((emojis: string[]) => {
        setRecentEmojis(emojis);
        if (emojis.length === 0) setActiveTab(DEFAULT_CATEGORY_ID);
      })
      .catch(() => {
        setActiveTab(DEFAULT_CATEGORY_ID);
      });
  }, []);

  const handleSelect = useCallback((emoji: string) => {
    onEmojiSelect(emoji);
    // Optimistically update the local recent list so the UI feels instant,
    // without waiting for a round-trip read from native.
    setRecentEmojis((prev) => [emoji, ...prev.filter((e) => e !== emoji)].slice(0, 30));
    KickKey.recordEmojiUsed(emoji).catch(() => {});
  }, [onEmojiSelect]);

  const currentEmojis: string[] =
    activeTab === RECENT_TAB_ID
      ? recentEmojis
      : EMOJI_CATEGORIES.find((c) => c.id === activeTab)?.emojis ?? [];

  const renderEmoji = useCallback(
    ({ item }: { item: string }) => (
      <TouchableOpacity
        style={styles.emojiCell}
        onPress={() => handleSelect(item)}
        activeOpacity={0.6}
      >
        <Text style={styles.emojiChar}>{item}</Text>
      </TouchableOpacity>
    ),
    [handleSelect]
  );

  return (
    <View style={[styles.panel, { backgroundColor: theme.keyboardBg }]}>
      {/* Category tab strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabs}
        contentContainerStyle={styles.tabsContent}
      >
        <TouchableOpacity
          style={[styles.tab, activeTab === RECENT_TAB_ID && styles.tabActive]}
          onPress={() => setActiveTab(RECENT_TAB_ID)}
        >
          <Text style={styles.tabIcon}>🕓</Text>
        </TouchableOpacity>
        {EMOJI_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.tab, activeTab === cat.id && styles.tabActive]}
            onPress={() => setActiveTab(cat.id)}
          >
            <Text style={styles.tabIcon}>{cat.icon}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Emoji grid */}
      {currentEmojis.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.altText }]}>
            {activeTab === RECENT_TAB_ID
              ? 'No recent emoji yet — tap any emoji to add it here'
              : 'No emoji in this category'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentEmojis}
          renderItem={renderEmoji}
          keyExtractor={(item, index) => `${item}-${index}`}
          numColumns={COLUMNS}
          showsVerticalScrollIndicator={false}
          style={styles.grid}
          contentContainerStyle={styles.gridContent}
          initialNumToRender={32}
          maxToRenderPerBatch={32}
          windowSize={5}
        />
      )}

      {/* Close button — returns to QWERTY layout */}
      <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.6}>
        <Text style={[styles.closeText, { color: theme.suggestionText }]}>ABC</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { width: '100%', height: 260 },
  tabs: { height: 40, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2a2a3e' },
  tabsContent: { alignItems: 'center', paddingHorizontal: 4 },
  tab: {
    paddingHorizontal: 10,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#00BCD4' },
  tabIcon: { fontSize: 18 },
  grid: { flex: 1 },
  gridContent: { paddingHorizontal: 4, paddingTop: 4 },
  emojiCell: {
    flex: 1 / 8,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiChar: { fontSize: 22 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 12, textAlign: 'center', fontStyle: 'italic' },
  closeBtn: {
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#2a2a3e',
  },
  closeText: { fontSize: 13, fontWeight: '700' },
});

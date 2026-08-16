import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Platform,
  ViewToken,
} from "react-native";
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { emojis, emojiCategories } from "../../helper/data";
import styles from "../../assets/styles/styles";

type EmojiBoardProps = {
  onEmojiSelect?: (emoji: string) => void;
  onBackspace?: () => void;
  onClose?: () => void;
};

type HeaderItem = {
  type: "header";
  id: string;
  categoryId: string;
  title: string;
};

type RowItem = {
  type: "row";
  id: string;
  categoryId: string;
  emojis: string[];
};

type EmojiListItem = HeaderItem | RowItem;

const EMOJIS_PER_ROW = 8;
const HEADER_HEIGHT = 32;
const ROW_HEIGHT = 40;

const EmojiKeyItem = React.memo(
  ({ emoji, onSelect }: { emoji: string; onSelect: (emoji: string) => void }) => (
    <Pressable
      onPress={() => onSelect(emoji)}
      style={styles.emojiKey}
      android_ripple={{ color: "rgba(0,0,0,0.12)", borderless: true, radius: 18 }}
    >
      <Text style={styles.emojiText}>{emoji}</Text>
    </Pressable>
  )
);

EmojiKeyItem.displayName = "EmojiKeyItem";

const EmojiBoardComponent = ({
  onEmojiSelect,
  onBackspace,
  onClose,
}: EmojiBoardProps) => {
  const [activeTab, setActiveTab] = useState("recent");
  const [recentEmojis, setRecentEmojis] = useState<string[]>(() => emojis().recent || []);
  const [showTooltipId, setShowTooltipId] = useState<string | null>(null);

  const flatListRef = useRef<FlatList<EmojiListItem>>(null);
  const tooltipTimer = useRef<NodeJS.Timeout | null>(null);

  // Handle emoji press & update recent emojis
  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      setRecentEmojis((prev) => {
        const filtered = prev.filter((e) => e !== emoji);
        return [emoji, ...filtered].slice(0, 24);
      });
      onEmojiSelect?.(emoji);
    },
    [onEmojiSelect]
  );

  // Build contiguous list items (headers and 8-emoji rows)
  const { flatListData, categoryIndexMap, itemHeights, itemOffsets } = useMemo(() => {
    const allCategories = emojiCategories();
    const categoriesEmojiData = emojis();

    const data: EmojiListItem[] = [];
    const indexMap: Record<string, number> = {};
    const heights: number[] = [];
    const offsets: number[] = [];

    let currentOffset = 0;

    allCategories.forEach((category) => {
      indexMap[category.id] = data.length;

      // 1. Add Header item
      data.push({
        type: "header",
        id: `header-${category.id}`,
        categoryId: category.id,
        title: category.title,
      });
      heights.push(HEADER_HEIGHT);
      offsets.push(currentOffset);
      currentOffset += HEADER_HEIGHT;

      // 2. Add Emoji Rows
      const categoryEmojiList =
        category.id === "recent" ? recentEmojis : categoriesEmojiData[category.id] || [];

      for (let i = 0; i < categoryEmojiList.length; i += EMOJIS_PER_ROW) {
        const rowChunk = categoryEmojiList.slice(i, i + EMOJIS_PER_ROW);
        data.push({
          type: "row",
          id: `row-${category.id}-${i}`,
          categoryId: category.id,
          emojis: rowChunk,
        });
        heights.push(ROW_HEIGHT);
        offsets.push(currentOffset);
        currentOffset += ROW_HEIGHT;
      }
    });

    return {
      flatListData: data,
      categoryIndexMap: indexMap,
      itemHeights: heights,
      itemOffsets: offsets,
    };
  }, [recentEmojis]);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: itemHeights[index] ?? ROW_HEIGHT,
      offset: itemOffsets[index] ?? index * ROW_HEIGHT,
      index,
    }),
    [itemHeights, itemOffsets]
  );

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    setShowTooltipId(tabId);

    if (tooltipTimer.current) {
      clearTimeout(tooltipTimer.current);
    }

    tooltipTimer.current = setTimeout(() => {
      setShowTooltipId(null);
    }, 500);

    const targetIndex = categoryIndexMap[tabId];
    if (targetIndex !== undefined && flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index: targetIndex,
        animated: true,
      });
    }
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems && viewableItems.length > 0) {
        const topItem = viewableItems[0].item as EmojiListItem;
        if (topItem && topItem.categoryId) {
          setActiveTab(topItem.categoryId);
        }
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 20,
  }).current;

  const renderItem = useCallback(
    ({ item }: { item: EmojiListItem }) => {
      if (item.type === "header") {
        return (
          <View style={styles.sectionHeader}>
            <Text style={styles.categoryTitle}>{item.title}</Text>
          </View>
        );
      }

      return (
        <View style={styles.emojiRow}>
          {item.emojis.map((emoji, idx) => (
            <EmojiKeyItem
              key={`${item.id}-${emoji}-${idx}`}
              emoji={emoji}
              onSelect={handleEmojiSelect}
            />
          ))}
        </View>
      );
    },
    [handleEmojiSelect]
  );

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
          {tab.lib === "FontAwesome5" ? (
            <FontAwesome5
              name={tab.icon as any}
              size={isActive ? 14 : 16}
              color={isActive ? "#fff" : "#2c2b2b"}
            />
          ) : (
            <MaterialCommunityIcons
              name={tab.icon as any}
              size={isActive ? 16 : 18}
              color={isActive ? "#fff" : "#2c2b2b"}
            />
          )}
          {isActive && (
            <View style={[styles.tabActiveIndicator, { borderColor: "#fff" }]} />
          )}
        </Pressable>
      </View>
    );
  };

  return (
    <>
      {/* 1. Category & Control Navigation Bar */}
      <View style={[styles.tabBar, { paddingHorizontal: 4 }]}>
        {onClose && (
          <Pressable
            onPress={onClose}
            style={[styles.tabButton, { backgroundColor: "#a6a6a6", width: 34 }]}
          >
            <Text style={{ fontSize: 10, fontWeight: "bold", color: "#fff" }}>
              ABC
            </Text>
          </Pressable>
        )}

        {emojiCategories().map(renderTabItem)}

        {onBackspace && (
          <Pressable
            onPress={onBackspace}
            style={[styles.tabButton, { backgroundColor: "#a6a6a6", width: 34 }]}
          >
            <MaterialCommunityIcons
              name="backspace-outline"
              size={16}
              color="#fff"
            />
          </Pressable>
        )}
      </View>

      {/* 2. Continuous Emoji Grid Section */}
      <View style={styles.emojiGridContainer}>
        <FlatList
          ref={flatListRef}
          data={flatListData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          getItemLayout={getItemLayout}
          initialNumToRender={15}
          maxToRenderPerBatch={15}
          windowSize={7}
          removeClippedSubviews={Platform.OS === "android"}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onScrollToIndexFailed={(info) => {
            flatListRef.current?.scrollToOffset({
              offset: info.averageItemLength * info.index,
              animated: true,
            });
          }}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.scrollContent}
        />
      </View>
    </>
  );
};

export const EmojiBoard = React.memo(EmojiBoardComponent);

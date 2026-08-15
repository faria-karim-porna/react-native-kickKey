import React, { useState, useMemo, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Dimensions,
  Pressable,
} from "react-native";
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { Key } from "./Key";
import { emojis, emojiCategories } from "../../helper/data";
import styles from "../../assets/styles/styles";

const { width } = Dimensions.get("window");

type EmojiBoardProps = {
  onEmojiSelect?: (emoji: string) => void;
};

const EmojiBoardComponent = ({ onEmojiSelect }: EmojiBoardProps) => {
  const [activeTab, setActiveTab] = useState("people");

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
  const tooltipTimer = React.useRef<NodeJS.Timeout | null>(null);

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
            <View
              style={[styles.tabActiveIndicator, { borderColor: "#fff" }]}
            />
          )}
        </Pressable>
      </View>
    );
  };

  return (
    <>
      {/* 3. Chocolate-Style Tab Bar */}
      <View style={styles.tabBar}>{emojiCategories().map(renderTabItem)}</View>

      {/* 4. Emoji Grid Section */}
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

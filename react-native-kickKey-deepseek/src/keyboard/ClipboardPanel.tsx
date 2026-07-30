import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  NativeModules,
} from 'react-native';
import type { Theme } from './types';

// Lazy-init — avoids crash at module scope if KickKey is not yet available
function getKickKey() {
  return NativeModules.KickKey;
}

interface ClipboardPanelProps {
  theme: Theme;
  onPaste: (text: string) => void;
  onClose: () => void;
}

export default function ClipboardPanel({ theme, onPaste, onClose }: ClipboardPanelProps) {
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(() => {
    setLoading(true);
    getKickKey()?.getClipboardHistory()
      .then((history: string[]) => setItems(history))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handlePaste = useCallback((text: string) => {
    onPaste(text);
  }, [onPaste]);

  const handleRemove = useCallback((text: string) => {
    setItems((prev) => prev.filter((i) => i !== text));
    getKickKey()?.removeClipboardItem(text).catch(() => {});
  }, []);

  const handleClearAll = useCallback(() => {
    setItems([]);
    getKickKey()?.clearClipboardHistory().catch(() => {});
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: string }) => (
      <TouchableOpacity
        style={[styles.item, { backgroundColor: theme.keyBg }]}
        onPress={() => handlePaste(item)}
        onLongPress={() => handleRemove(item)}
        activeOpacity={0.65}
        delayLongPress={400}
      >
        <Text
          style={[styles.itemText, { color: theme.keyText }]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {item}
        </Text>
      </TouchableOpacity>
    ),
    [theme, handlePaste, handleRemove]
  );

  return (
    <View style={[styles.panel, { backgroundColor: theme.keyboardBg }]}>
      {/* Header with Clear All */}
      <View style={[styles.header, { borderBottomColor: theme.suggestionDivider }]}>
        <Text style={[styles.headerTitle, { color: theme.altText }]}>Clipboard</Text>
        {items.length > 0 && (
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={[styles.clearText, { color: theme.suggestionText }]}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List or empty state */}
      {!loading && items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.altText }]}>
            Clipboard is empty.{'\n'}Copy something to see it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${index}-${item.slice(0, 20)}`}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 36,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  clearText: { fontSize: 12, fontWeight: '700' },
  list: { paddingHorizontal: 8, paddingTop: 6, paddingBottom: 6 },
  item: { borderRadius: 8, padding: 12, marginBottom: 6 },
  itemText: { fontSize: 13, lineHeight: 18 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 12, textAlign: 'center', fontStyle: 'italic', lineHeight: 18 },
  closeBtn: {
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#2a2a3e',
  },
  closeText: { fontSize: 13, fontWeight: '700' },
});

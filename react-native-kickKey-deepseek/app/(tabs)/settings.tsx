import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, AppState, Pressable, TouchableOpacity } from 'react-native';
import Svg, { Path, Rect, Line, Circle } from 'react-native-svg';
import Slider from '@react-native-community/slider';
import { useSettingsStore } from '../../store/settingsStore';
import type { CursorType } from '../../store/settingsStore';
import ToggleRow from '../../components/ToggleRow';
import KickKey from '../../modules/kickkey-module';

// ─── Cursor type definitions ────────────────────────────────────────────────

const CURSOR_TYPES: { type: CursorType; label: string }[] = [
  { type: 'line',      label: 'Line' },
  { type: 'block',     label: 'Block' },
  { type: 'underline', label: 'Underline' },
  { type: 'arrow',     label: 'Arrow' },
  { type: 'pointer',   label: 'Pointer' },
  { type: 'crosshair', label: 'Cross' },
  { type: 'grab',      label: 'Grab' },
];

const CURSOR_COLORS = [
  '#00BCD4', '#ffffff', '#333333', '#f44336',
  '#4CAF50', '#FFC107', '#FF9800', '#9C27B0',
];

function CursorPreview({ type, color, size }: { type: CursorType; color: string; size: number }) {
  const s = Math.round(size * 0.6);
  switch (type) {
    case 'line':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Line x1="12" y1="2" x2="12" y2="22" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        </Svg>
      );
    case 'block':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Rect x="6" y="3" width="12" height="18" rx="1" fill={color} />
        </Svg>
      );
    case 'underline':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Line x1="4" y1="19" x2="20" y2="19" stroke={color} strokeWidth="3" strokeLinecap="round" />
        </Svg>
      );
    case 'arrow':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path
            d="M4 2l14 10.5-5.5 1.5 3.5 7-2.5 1.2-3.5-7L4 22V2z"
            fill={color}
          />
        </Svg>
      );
    case 'pointer':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path
            d="M8 2v13.5l3-2.5 2.5 5 2-1-2.5-5H18L8 2z"
            fill={color}
          />
        </Svg>
      );
    case 'crosshair':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="8" stroke={color} strokeWidth="2" fill="none" />
          <Line x1="12" y1="2" x2="12" y2="7" stroke={color} strokeWidth="2" />
          <Line x1="12" y1="17" x2="12" y2="22" stroke={color} strokeWidth="2" />
          <Line x1="2" y1="12" x2="7" y2="12" stroke={color} strokeWidth="2" />
          <Line x1="17" y1="12" x2="22" y2="12" stroke={color} strokeWidth="2" />
        </Svg>
      );
    case 'grab':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path
            d="M18 11V6a1 1 0 00-2 0V4a1 1 0 00-2 0v1a1 1 0 00-2 0v1a1 1 0 00-2 0v5l-2.3-2.3a1.41 1.41 0 00-2 0 1.41 1.41 0 000 2L9 17a5 5 0 005 0h1a4 4 0 004-4v-2z"
            fill={color}
          />
        </Svg>
      );
  }
}

// ─── SliderRow (reusable) ──────────────────────────────────────────────────

function SliderRow({
  label, value, min, max, onChange, unit,
}: {
  label: string; value: number; min: number; max: number;
  onChange: (v: number) => void; unit: string;
}) {
  return (
    <View style={styles.sliderRow}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={styles.sliderValue}>{Math.round(value)}{unit}</Text>
      </View>
      <Slider
        style={{ width: '100%', height: 32 }}
        minimumValue={min}
        maximumValue={max}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor="#00BCD4"
        maximumTrackTintColor="#c8ccd0"
        thumbTintColor="#00BCD4"
      />
    </View>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const [a11yEnabled, setA11yEnabled] = useState<boolean | null>(null);

  const checkA11yStatus = () => {
    KickKey.isAccessibilityEnabled()
      .then((ok) => setA11yEnabled(ok))
      .catch(() => {});
  };

  useEffect(() => {
    checkA11yStatus();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkA11yStatus();
    });
    return () => sub.remove();
  }, []);

  // Feedback
  const hapticEnabled    = useSettingsStore((s) => s.hapticEnabled);
  const soundEnabled      = useSettingsStore((s) => s.soundEnabled);
  const toggleHaptic        = useSettingsStore((s) => s.toggleHaptic);
  const toggleSound          = useSettingsStore((s) => s.toggleSound);

  // Typing
  const autoCorrect        = useSettingsStore((s) => s.autoCorrect);
  const showSuggestions    = useSettingsStore((s) => s.showSuggestions);
  const toggleAutoCorrect     = useSettingsStore((s) => s.toggleAutoCorrect);
  const toggleShowSuggestions  = useSettingsStore((s) => s.toggleShowSuggestions);

  // Key Size
  const keyHeight             = useSettingsStore((s) => s.keyHeight);
  const setKeyHeight           = useSettingsStore((s) => s.setKeyHeight);
  const keyBorderRadius         = useSettingsStore((s) => s.keyBorderRadius);
  const setKeyBorderRadius       = useSettingsStore((s) => s.setKeyBorderRadius);
  const fontSize                   = useSettingsStore((s) => s.fontSize);
  const setFontSize                 = useSettingsStore((s) => s.setFontSize);

  // Cursor
  const cursorType            = useSettingsStore((s) => s.cursorType);
  const cursorColor           = useSettingsStore((s) => s.cursorColor);
  const cursorSize            = useSettingsStore((s) => s.cursorSize);
  const setCursorType           = useSettingsStore((s) => s.setCursorType);
  const setCursorColor          = useSettingsStore((s) => s.setCursorColor);
  const setCursorSize            = useSettingsStore((s) => s.setCursorSize);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Settings</Text>

        {/* ── Feedback ──────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Feedback</Text>
        <View style={styles.card}>
          <ToggleRow
            label="Haptic Feedback"
            description="Vibrate on every key press"
            value={hapticEnabled}
            onValueChange={toggleHaptic}
          />
          <ToggleRow
            label="Key Sounds"
            description="Play a click sound on key press"
            value={soundEnabled}
            onValueChange={toggleSound}
          />
        </View>

        {/* ── Typing ───────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Typing</Text>
        <View style={styles.card}>
          <ToggleRow
            label="Auto-correct"
            description="Automatically fix typos when you press space"
            value={autoCorrect}
            onValueChange={toggleAutoCorrect}
          />
          <ToggleRow
            label="Show Suggestions"
            description="Display word suggestions above the keyboard"
            value={showSuggestions}
            onValueChange={toggleShowSuggestions}
          />
        </View>

        {/* ── Key Size ─────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Key Size</Text>
        <View style={styles.card}>
          <SliderRow
            label="Key Height"
            value={keyHeight}
            min={40}
            max={60}
            onChange={setKeyHeight}
            unit="dp"
          />
          <SliderRow
            label="Corner Radius"
            value={keyBorderRadius}
            min={0}
            max={16}
            onChange={setKeyBorderRadius}
            unit="dp"
          />
          <SliderRow
            label="Font Size"
            value={fontSize}
            min={12}
            max={22}
            onChange={setFontSize}
            unit="sp"
          />
        </View>

        {/* ── Cursor ───────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Cursor Type</Text>
        <View style={styles.cursorTypeGrid}>
          {CURSOR_TYPES.map(({ type, label }) => (
            <TouchableOpacity
              key={type}
              style={[styles.cursorTypeCard, cursorType === type && styles.cursorTypeCardActive]}
              onPress={() => setCursorType(type)}
              activeOpacity={0.8}
            >
              <CursorPreview type={type} color={cursorType === type ? '#00BCD4' : '#555'} size={cursorSize} />
              <Text style={[styles.cursorTypeLabel, cursorType === type && styles.cursorTypeLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Cursor Color</Text>
        <View style={styles.colorPalette}>
          {CURSOR_COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.colorSwatch,
                { backgroundColor: c },
                cursorColor === c && styles.colorSwatchActive,
              ]}
              onPress={() => setCursorColor(c)}
              activeOpacity={0.8}
            />
          ))}
        </View>

        <Text style={styles.sectionLabel}>Cursor Size</Text>
        <View style={styles.card}>
          <View style={styles.cursorSizePreview}>
            <CursorPreview type={cursorType} color={cursorColor} size={cursorSize} />
          </View>
          <SliderRow
            label="Size"
            value={cursorSize}
            min={12}
            max={48}
            onChange={setCursorSize}
            unit="px"
          />
        </View>

        {/* ── Accessibility ────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Accessibility</Text>
        <View style={styles.card}>
          <View style={styles.a11yRow}>
            <Text style={styles.a11yLabel}>Accessibility Service</Text>
            <Text style={[styles.a11yValue, { color: a11yEnabled ? '#4CAF50' : '#f44336' }]}>
              {a11yEnabled === null ? 'Checking…' : a11yEnabled ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.a11yButton, pressed && styles.a11yButtonPressed]}
            onPress={() => KickKey.openAccessibilitySettings()}
          >
            <Text style={styles.a11yButtonText}>Open Accessibility Settings</Text>
          </Pressable>
          {a11yEnabled === false && (
            <Text style={styles.a11yHint}>
              Enable "KickKey Accessibility", then assign it to the Accessibility
              button or shortcut to open the floating panel anywhere — no input
              field needed.
            </Text>
          )}
        </View>

        <Text style={styles.footnote}>
          Changes apply automatically the next time you open the keyboard.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const card = {
  backgroundColor: 'rgba(224,229,236,0.92)' as const,
  borderRadius: 12,
  // Neumorphic raised effect
  borderTopWidth: 1.5,
  borderLeftWidth: 1.5,
  borderTopColor: 'rgba(0,0,0,0.15)',
  borderLeftColor: 'rgba(0,0,0,0.15)',
  borderBottomWidth: 2,
  borderRightWidth: 2,
  borderBottomColor: 'rgba(255,255,255,0.8)',
  borderRightColor: 'rgba(255,255,255,0.8)',
  shadowColor: '#000',
  shadowOffset: { width: -3, height: -3 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 6,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e0e5ec' },
  scroll: { padding: 20, paddingTop: 12 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  sectionLabel: {
    color: '#777', fontSize: 12, textTransform: 'uppercase',
    marginBottom: 8, marginTop: 16, letterSpacing: 0.5,
  },

  // ── Cards ──
  card: {
    ...card,
    paddingHorizontal: 16,
  },

  // ── Slider ──
  sliderRow: { marginBottom: 16 },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  sliderLabel: { color: '#444', fontSize: 13 },
  sliderValue: { color: '#00BCD4', fontSize: 13, fontWeight: '600' },

  // ── Cursor type grid ──
  cursorTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 4,
  },
  cursorTypeCard: {
    width: '30%',
    backgroundColor: 'rgba(224,229,236,0.92)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 6,
    // Neumorphic raised
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: 'rgba(0,0,0,0.12)',
    borderLeftColor: 'rgba(0,0,0,0.12)',
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomColor: 'rgba(255,255,255,0.7)',
    borderRightColor: 'rgba(255,255,255,0.7)',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  cursorTypeCardActive: {
    borderColor: '#00BCD4',
    borderWidth: 2,
  },
  cursorTypeLabel: { color: '#666', fontSize: 11, fontWeight: '600' },
  cursorTypeLabelActive: { color: '#00BCD4' },

  // ── Color palette ──
  colorPalette: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    // Neumorphic raised
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: 'rgba(0,0,0,0.12)',
    borderLeftColor: 'rgba(0,0,0,0.12)',
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomColor: 'rgba(255,255,255,0.6)',
    borderRightColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  colorSwatchActive: {
    borderWidth: 2,
    borderColor: '#00BCD4',
  },

  // ── Cursor size preview ──
  cursorSizePreview: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    marginBottom: 4,
    backgroundColor: '#d1d9e6',
    borderRadius: 8,
    // Inset neumorphic
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopColor: 'rgba(0,0,0,0.12)',
    borderLeftColor: 'rgba(0,0,0,0.12)',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.6)',
    borderRightColor: 'rgba(255,255,255,0.6)',
  },

  // ── Accessibility ──
  a11yRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  a11yLabel: { color: '#333', fontSize: 15 },
  a11yValue: { fontSize: 13, fontWeight: '600' },
  a11yButton: {
    backgroundColor: '#8594aa',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
    // Neumorphic raised effect
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: 'rgba(0,0,0,0.1)',
    borderLeftColor: 'rgba(0,0,0,0.1)',
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomColor: 'rgba(255,255,255,0.6)',
    borderRightColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  a11yButtonPressed: {
    backgroundColor: '#707f9a',
    transform: [{ translateY: 1 }],
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopColor: 'rgba(0,0,0,0.25)',
    borderLeftColor: 'rgba(0,0,0,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  a11yButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  a11yHint: { color: '#777', fontSize: 12, lineHeight: 17, paddingBottom: 12 },
  footnote: { color: '#999', fontSize: 12, textAlign: 'center', marginTop: 24 },
});

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, AppState, Pressable, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Line, Circle } from 'react-native-svg';
import Slider from '@react-native-community/slider';
import { useSettingsStore } from '../../store/settingsStore';
import type { CursorType } from '../../store/settingsStore';
import ToggleRow from '../../components/ToggleRow';
import KickKey from '../../modules/kickkey-module';
import { useAppColors } from '../../hooks/useAppColors';

// ─── Cursor type definitions ────────────────────────────────────────────────

const CURSOR_TYPES: { type: CursorType; label: string }[] = [
  { type: 'classic',     label: 'Classic' },
  { type: 'bubble',      label: 'Bubble' },
  { type: 'sharp',       label: 'Sharp' },
  { type: 'motion',      label: 'Motion' },
  { type: 'solid',       label: 'Solid' },
  { type: 'dot',         label: 'Dot' },
  { type: 'crosshair',   label: 'Crosshair' },
  { type: 'target',      label: 'Target' },
  { type: 'dashed',      label: 'Dashed' },
  { type: 'loading',     label: 'Loading' },
  { type: 'sparkle',     label: 'Sparkle' },
  { type: 'pointer',     label: 'Pointer' },
  { type: 'hand',        label: 'Hand' },
  { type: 'click',       label: 'Click' },
  { type: 'fast',        label: 'Fast' },
  { type: 'energy',      label: 'Energy' },
  { type: 'refresh',     label: 'Refresh' },
  { type: 'filled',      label: 'Filled' },
  { type: 'play',        label: 'Play' },
  { type: 'bold',        label: 'Bold' },
  { type: 'underline',   label: 'Underline' },
  { type: 'outline',     label: 'Outline' },
  { type: 'thick',       label: 'Thick' },
  { type: 'thin',        label: 'Thin' },
  { type: 'small',       label: 'Small' },
];

const CURSOR_COLORS = [
  // Neutrals
  '#2c2b2b', '#444', '#8a8a8a', '#ffffff',
  // Vibrant
  '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71',
  '#3498db', '#9b59b6', '#e91e63', '#00bcd4',
];

function CursorPreview({ type, color, size }: { type: CursorType; color: string; size: number }) {
  const s = Math.round(size * 0.6);
  switch (type) {
    case 'classic':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path
            d="M5 3l12 9.5-5 1.5 3 6-2.5 1.2-3-6L5 21V3z"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
          />
        </Svg>
      );
    case 'bubble':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path
            d="M6 4c0 0 2-1 6-1s6 2 6 2l-4 8 3 6-2.5 1.2-3-6L6 18V4z"
            stroke={color}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'sharp':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path
            d="M5 2l14 11-6 1 3.5 7-2.5 1.2-3.5-7L5 22V2z"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
          />
        </Svg>
      );
    case 'motion':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path
            d="M4 2l12 9.5-5 1.5 3 6-2.5 1.2-3-6L4 20V2z"
            fill={color}
          />
          <Path
            d="M9 12l-3 6-2 1"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
          />
        </Svg>
      );
    case 'solid':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path
            d="M4 2l16 12-6 1 4 7-2.5 1.2-4-7L4 22V2z"
            fill={color}
          />
        </Svg>
      );
    case 'dot':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path
            d="M5 3l12 9-5 1.5 3 6-2.5 1.2-3-6L5 21V3z"
            fill={color}
          />
          <Circle cx="16" cy="18" r="2.5" fill={color} />
        </Svg>
      );
    case 'crosshair':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.5" fill="none" />
          <Line x1="12" y1="4" x2="12" y2="20" stroke={color} strokeWidth="1.5" />
          <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="1.5" />
          <Circle cx="12" cy="12" r="2" fill={color} />
        </Svg>
      );
    case 'target':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path
            d="M5 3l12 9.5-5 1.5 3 6-2.5 1.2-3-6L5 21V3z"
            fill={color}
          />
          <Circle cx="8" cy="8" r="4" stroke={color} strokeWidth="1.5" fill="none" />
          <Circle cx="8" cy="8" r="1" fill={color} />
        </Svg>
      );
    case 'dashed':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path
            d="M5 3l12 9.5-5 1.5 3 6-2.5 1.2-3-6L5 21V3z"
            fill={color}
          />
          <Circle cx="8" cy="8" r="4" stroke={color} strokeWidth="1.5" fill="none" strokeDasharray="2 2" />
        </Svg>
      );
    case 'loading':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path
            d="M5 3l12 9.5-5 1.5 3 6-2.5 1.2-3-6L5 21V3z"
            fill={color}
          />
          <Path
            d="M12 4a8 8 0 0 1 8 8"
            stroke={color}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'sparkle':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path
            d="M6 4c0 0 2-1 6-1s6 2 6 2l-4 8 3 6-2.5 1.2-3-6L6 18V4z"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx="4" cy="6" r="1" fill={color} />
          <Circle cx="3" cy="10" r="0.7" fill={color} />
          <Circle cx="6" cy="3" r="0.7" fill={color} />
        </Svg>
      );
    case 'pointer':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path
            d="M7 2l2 16 3-3 4 5-1.5 1-4-5-3 3V2z"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'hand':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path
            d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-5.5a1.5 1.5 0 0 1 3 0V11m0-3.5a1.5 1.5 0 0 1 3 0V11m0-4.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6V9.5a1.5 1.5 0 0 1 3 0V11"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'click':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path
            d="M7 2l2 16 3-3 4 5-1.5 1-4-5-3 3V2z"
            fill={color}
          />
          <Circle cx="6" cy="8" r="3" stroke={color} strokeWidth="1.5" fill="none" />
        </Svg>
      );
    case 'fast':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path
            d="M7 2l2 16 3-3 4 5-1.5 1-4-5-3 3V2z"
            fill={color}
          />
          <Path d="M4 10l3 2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <Path d="M4 14l3 2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </Svg>
      );
    case 'energy':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path
            d="M7 2l2 16 3-3 4 5-1.5 1-4-5-3 3V2z"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
          />
          <Path d="M5 6l1-2M3 9l-1.5-1M3 12l-1.5 1" stroke={color} strokeWidth="1" strokeLinecap="round" />
        </Svg>
      );
    case 'refresh':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path
            d="M7 2l2 16 3-3 4 5-1.5 1-4-5-3 3V2z"
            fill={color}
          />
          <Path
            d="M12 4a8 8 0 0 1 8 8"
            stroke={color}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <Path d="M18 6l2 2-2 2" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'filled':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path
            d="M4 2l16 12-6 1 4 7-2.5 1.2-4-7L4 22V2z"
            fill={color}
          />
          <Path
            d="M4 2l16 12-6 1 4 7-2.5 1.2-4-7L4 22V2z"
            stroke={color}
            strokeWidth="0.5"
            fill="none"
          />
        </Svg>
      );
    case 'play':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path
            d="M8 4l12 8-12 8V4z"
            fill={color}
          />
          <Path d="M6 20v-1" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );
    case 'bold':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path
            d="M5 3l12 9.5-5 1.5 3 6-2.5 1.2-3-6L5 21V3z"
            fill={color}
          />
        </Svg>
      );
    case 'underline':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path
            d="M8 4l12 8-12 8V4z"
            fill={color}
          />
          <Line x1="6" y1="20" x2="20" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );
    case 'outline':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path
            d="M5 3l12 9.5-5 1.5 3 6-2.5 1.2-3-6L5 21V3z"
            stroke={color}
            strokeWidth="2"
            fill="none"
          />
        </Svg>
      );
    case 'thick':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path
            d="M5 3l12 9.5-5 1.5 3 6-2.5 1.2-3-6L5 21V3z"
            stroke={color}
            strokeWidth="3"
            fill="none"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'thin':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path
            d="M5 3l12 9.5-5 1.5 3 6-2.5 1.2-3-6L5 21V3z"
            stroke={color}
            strokeWidth="1"
            fill="none"
          />
        </Svg>
      );
    case 'small':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path
            d="M8 4l8 6-3 1 2 4-1.5 0.7-2-4-3 2V4z"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
          />
        </Svg>
      );
  }
}


// ─── SliderRow (reusable) ──────────────────────────────────────────────────

function SliderRow({
  label, value, min, max, onChange, unit, colors,
}: {
  label: string; value: number; min: number; max: number;
  onChange: (v: number) => void; unit: string;
  colors: ReturnType<typeof useAppColors>;
}) {
  return (
    <View style={styles.sliderRow}>
      <View style={styles.sliderHeader}>
        <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.sliderValue, { color: colors.accent }]}>{Math.round(value)}{unit}</Text>
      </View>
      <Slider
        style={{ width: '100%', height: 32 }}
        minimumValue={min}
        maximumValue={max}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={colors.accent}
        maximumTrackTintColor={colors.inputBg}
        thumbTintColor={colors.accent}
      />
    </View>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const colors = useAppColors();
  const [a11yEnabled, setA11yEnabled] = useState<boolean | null>(null);
  const [overlayGranted, setOverlayGranted] = useState<boolean | null>(null);

  const checkA11yStatus = () => {
    KickKey.isAccessibilityEnabled()
      .then((ok) => setA11yEnabled(ok))
      .catch(() => {});
  };

  const checkOverlayStatus = () => {
    KickKey.isOverlayGranted()
      .then((ok) => setOverlayGranted(ok))
      .catch(() => {});
  };

  useEffect(() => {
    checkA11yStatus();
    checkOverlayStatus();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkA11yStatus();
        checkOverlayStatus();
      }
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

  const cardStyle = {
    backgroundColor: colors.card,
    borderTopColor: colors.cardBorderTL,
    borderLeftColor: colors.cardBorderTL,
    borderBottomColor: colors.cardBorderBR,
    borderRightColor: colors.cardBorderBR,
    shadowColor: colors.cardShadow,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>

        {/* ── Feedback ──────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.sectionLabel }]}>Feedback</Text>
        <View style={[styles.card, cardStyle]}>
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
        <Text style={[styles.sectionLabel, { color: colors.sectionLabel }]}>Typing</Text>
        <View style={[styles.card, cardStyle]}>
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
        <Text style={[styles.sectionLabel, { color: colors.sectionLabel }]}>Key Size</Text>
        <View style={[styles.card, cardStyle]}>
          <SliderRow
            label="Key Height"
            value={keyHeight}
            min={40}
            max={60}
            onChange={setKeyHeight}
            unit="dp"
            colors={colors}
          />
          <SliderRow
            label="Corner Radius"
            value={keyBorderRadius}
            min={0}
            max={16}
            onChange={setKeyBorderRadius}
            unit="dp"
            colors={colors}
          />
          <SliderRow
            label="Font Size"
            value={fontSize}
            min={12}
            max={22}
            onChange={setFontSize}
            unit="sp"
            colors={colors}
          />
        </View>

        {/* ── Cursor ───────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.sectionLabel }]}>Cursor Type</Text>
        <View style={styles.cursorTypeGrid}>
          {CURSOR_TYPES.map(({ type, label }) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.cursorTypeCard,
                {
                  backgroundColor: colors.card,
                  borderTopColor: colors.cardBorderTL,
                  borderLeftColor: colors.cardBorderTL,
                  borderBottomColor: colors.cardBorderBR,
                  borderRightColor: colors.cardBorderBR,
                  shadowColor: colors.cardShadow,
                },
                cursorType === type && { borderColor: colors.accent, borderWidth: 2 },
              ]}
              onPress={() => setCursorType(type)}
              activeOpacity={0.8}
            >
              <CursorPreview type={type} color={cursorType === type ? colors.accent : colors.textMuted} size={cursorSize} />
              <Text style={[styles.cursorTypeLabel, { color: colors.textSecondary }, cursorType === type && { color: colors.accent }]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.sectionLabel }]}>Cursor Color</Text>
        <View style={styles.colorPalette}>
          {CURSOR_COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.colorSwatch,
                { backgroundColor: c },
                cursorColor === c && { borderWidth: 2, borderColor: colors.accent },
              ]}
              onPress={() => setCursorColor(c)}
              activeOpacity={0.8}
            />
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.sectionLabel }]}>Cursor Size</Text>
        <View style={[styles.card, cardStyle]}>
          <View style={[styles.cursorSizePreview, {
            backgroundColor: colors.inputBg,
            borderTopColor: colors.cardBorderTL,
            borderLeftColor: colors.cardBorderTL,
            borderBottomColor: colors.cardBorderBR,
            borderRightColor: colors.cardBorderBR,
          }]}>
            <CursorPreview type={cursorType} color={cursorColor} size={cursorSize} />
          </View>
          <SliderRow
            label="Size"
            value={cursorSize}
            min={12}
            max={48}
            onChange={setCursorSize}
            unit="px"
            colors={colors}
          />
        </View>

        {/* ── Display over other apps ─────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.sectionLabel }]}>Display Over Other Apps</Text>
        <View style={[styles.card, cardStyle]}>
          <View style={[styles.a11yRow, { borderBottomColor: colors.separator }]}>
            <Text style={[styles.a11yLabel, { color: colors.textSecondary }]}>Overlay Permission</Text>
            <Text style={[styles.a11yValue, { color: overlayGranted ? colors.accent : colors.textMuted }]}>
              {overlayGranted === null ? 'Checking…' : overlayGranted ? 'Granted' : 'Not Granted'}
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.a11yButton, {
              backgroundColor: colors.accent,
              borderTopColor: colors.cardBorderTL,
              borderLeftColor: colors.cardBorderTL,
              borderBottomColor: colors.cardBorderBR,
              borderRightColor: colors.cardBorderBR,
              shadowColor: colors.cardShadow,
            }, pressed && styles.a11yButtonPressed]}
            onPress={() => KickKey.openOverlaySettings()}
          >
            <Text style={[styles.a11yButtonText, { color: colors.buttonText }]}>Open Overlay Settings</Text>
          </Pressable>
          {overlayGranted === false && (
            <Text style={[styles.a11yHint, { color: colors.textMuted }]}>
              Grant "Display over other apps" permission to enable the
              on-screen mouse pointer when using the touchpad.
            </Text>
          )}
        </View>

        {/* ── Accessibility ────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.sectionLabel }]}>Accessibility</Text>
        <View style={[styles.card, cardStyle]}>
          <View style={[styles.a11yRow, { borderBottomColor: colors.separator }]}>
            <Text style={[styles.a11yLabel, { color: colors.textSecondary }]}>Accessibility Service</Text>
            <Text style={[styles.a11yValue, { color: a11yEnabled ? colors.accent : colors.textMuted }]}>
              {a11yEnabled === null ? 'Checking…' : a11yEnabled ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.a11yButton, {
              backgroundColor: colors.accent,
              borderTopColor: colors.cardBorderTL,
              borderLeftColor: colors.cardBorderTL,
              borderBottomColor: colors.cardBorderBR,
              borderRightColor: colors.cardBorderBR,
              shadowColor: colors.cardShadow,
            }, pressed && styles.a11yButtonPressed]}
            onPress={() => KickKey.openAccessibilitySettings()}
          >
            <Text style={[styles.a11yButtonText, { color: colors.buttonText }]}>Open Accessibility Settings</Text>
          </Pressable>
          {a11yEnabled === false && (
            <Text style={[styles.a11yHint, { color: colors.textMuted }]}>
              Enable "KickKey Accessibility", then assign it to the Accessibility
              button or shortcut to open the floating panel anywhere — no input
              field needed.
            </Text>
          )}
        </View>

        <Text style={[styles.footnote, { color: colors.textMuted }]}>
          Changes apply automatically the next time you open the keyboard.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scroll: { padding: 20, paddingTop: 12 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20 },
  sectionLabel: {
    fontSize: 12, textTransform: 'uppercase',
    marginBottom: 8, marginTop: 16, letterSpacing: 0.5,
  },

  // ── Cards ──
  card: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    // Neumorphic raised effect
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    shadowOffset: { width: -3, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },

  // ── Slider ──
  sliderRow: { marginBottom: 16 },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  sliderLabel: { fontSize: 13 },
  sliderValue: { fontSize: 13, fontWeight: '600' },

  // ── Cursor type grid ──
  cursorTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 4,
  },
  cursorTypeCard: {
    width: '30%',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 6,
    // Neumorphic raised
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    shadowOffset: { width: -2, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  cursorTypeLabel: { fontSize: 11, fontWeight: '600' },

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

  // ── Cursor size preview ──
  cursorSizePreview: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    marginBottom: 4,
    borderRadius: 8,
    // Inset neumorphic
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 1,
    borderRightWidth: 1,
  },

  // ── Accessibility ──
  a11yRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  a11yLabel: { fontSize: 15 },
  a11yValue: { fontSize: 13, fontWeight: '600' },
  a11yButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
    // Neumorphic raised effect
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    shadowOffset: { width: -2, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  a11yButtonPressed: {
    transform: [{ translateY: 1 }],
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  a11yButtonText: { fontSize: 14, fontWeight: '700' },
  a11yHint: { fontSize: 12, lineHeight: 17, paddingBottom: 12 },
  footnote: { fontSize: 12, textAlign: 'center', marginTop: 24 },
});

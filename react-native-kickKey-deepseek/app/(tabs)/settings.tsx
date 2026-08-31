import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, AppState, Pressable, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgUri } from 'react-native-svg';
import Slider from '@react-native-community/slider';
import { useSettingsStore } from '../../store/settingsStore';
import type { CursorType } from '../../store/settingsStore';
import ToggleRow from '../../components/ToggleRow';
import KickKey from '../../modules/kickkey-module';
import { useAppColors } from '../../hooks/useAppColors';
import { useTranslation } from '../../hooks/useTranslation';

// ─── SVG asset map ────────────────────────────────────────────────────────

const CURSOR_SVG_ASSETS: Record<CursorType, ReturnType<typeof require>> = {
  'cursor-alt-thick-pointer':         require('../../assets/svg/cursor-alt-thick-pointer.svg'),
  'cursor-pointer-classic':           require('../../assets/svg/cursor-pointer-classic.svg'),
  'cursor-pointer-nested':            require('../../assets/svg/cursor-pointer-nested.svg'),
  'cursor-pointer-small':             require('../../assets/svg/cursor-pointer-small.svg'),
  'cursor-pointer-standard':          require('../../assets/svg/cursor-pointer-standard.svg'),
  'cursor-simple-triangle':           require('../../assets/svg/cursor-simple-triangle.svg'),
  'pointer-cursor-detailed':          require('../../assets/svg/pointer-cursor-detailed.svg'),
  'pointer-cursor-settings':          require('../../assets/svg/pointer-cursor-settings.svg'),
  'pointer-hand-cursor':              require('../../assets/svg/pointer-hand-cursor.svg'),
  'hand-click-cursor':                require('../../assets/svg/hand-click-cursor.svg'),
  'hand-grab-closed':                 require('../../assets/svg/hand-grab-closed.svg'),
  'hand-grab-cursor':                 require('../../assets/svg/hand-grab-cursor.svg'),
  'hand-open-fingers':                require('../../assets/svg/hand-open-fingers.svg'),
  'hand-open-palm':                   require('../../assets/svg/hand-open-palm.svg'),
  'hand-pointing-index':              require('../../assets/svg/hand-pointing-index.svg'),
  'cursor-click-burst-fill':          require('../../assets/svg/cursor-click-burst-fill.svg'),
  'cursor-click-crosshair':           require('../../assets/svg/cursor-click-crosshair.svg'),
  'cursor-click-lines':               require('../../assets/svg/cursor-click-lines.svg'),
  'cursor-click-sparkle-crosshair':   require('../../assets/svg/cursor-click-sparkle-crosshair.svg'),
  'cursor-click-sparkle-dots':        require('../../assets/svg/cursor-click-sparkle-dots.svg'),
  'cursor-click-target-corners':      require('../../assets/svg/cursor-click-target-corners.svg'),
  'cursor-edit-pencil':               require('../../assets/svg/cursor-edit-pencil.svg'),
  'edit-pen-cursor-filled':           require('../../assets/svg/edit-pen-cursor-filled.svg'),
  'edit-pen-cursor-outline':          require('../../assets/svg/edit-pen-cursor-outline.svg'),
  'pencil-edit-cursor':               require('../../assets/svg/pencil-edit-cursor.svg'),
  'text-cursor-i-beam-round':         require('../../assets/svg/text-cursor-i-beam-round.svg'),
  'text-cursor-i-beam-serif':         require('../../assets/svg/text-cursor-i-beam-serif.svg'),
  'cursor-move-diagonal-down':        require('../../assets/svg/cursor-move-diagonal-down.svg'),
  'drag-drop-arrows':                 require('../../assets/svg/drag-drop-arrows.svg'),
  'move-arrows-4way':                 require('../../assets/svg/move-arrows-4way.svg'),
  'move-arrows-cross':                require('../../assets/svg/move-arrows-cross.svg'),
  'move-arrows-cross-circle':         require('../../assets/svg/move-arrows-cross-circle.svg'),
  'move-arrows-horizontal':           require('../../assets/svg/move-arrows-horizontal.svg'),
  'move-arrows-large':                require('../../assets/svg/move-arrows-large.svg'),
  'cursor-arrow-scroll-wheel':        require('../../assets/svg/cursor-arrow-scroll-wheel.svg'),
  'cursor-arrow-scroll-wheel-gray':   require('../../assets/svg/cursor-arrow-scroll-wheel-gray.svg'),
  'scroll-arrows-4way':               require('../../assets/svg/scroll-arrows-4way.svg'),
  'scroll-arrows-down':               require('../../assets/svg/scroll-arrows-down.svg'),
  'scroll-arrows-horizontal':         require('../../assets/svg/scroll-arrows-horizontal.svg'),
  'scroll-arrows-vertical':           require('../../assets/svg/scroll-arrows-vertical.svg'),
  'scroll-arrows-vertical-outline':   require('../../assets/svg/scroll-arrows-vertical-outline.svg'),
  'cursor-diagonal-line':             require('../../assets/svg/cursor-diagonal-line.svg'),
  'cursor-gps-location':              require('../../assets/svg/cursor-gps-location.svg'),
  'cursor-pixel-block':               require('../../assets/svg/cursor-pixel-block.svg'),
  'cursor-plus-add':                  require('../../assets/svg/cursor-plus-add.svg'),
  'cursor-plus-cross':                require('../../assets/svg/cursor-plus-cross.svg'),
  'cursor-rays-light':                require('../../assets/svg/cursor-rays-light.svg'),
  'keyboard-arrows-icon':             require('../../assets/svg/keyboard-arrows-icon.svg'),
  'magic-wand-sparkle':               require('../../assets/svg/magic-wand-sparkle.svg'),
};

function getCursorSvgUri(type: CursorType): string {
  return Image.resolveAssetSource(CURSOR_SVG_ASSETS[type]).uri;
}

// ─── Cursor categories ──────────────────────────────────────────────────────

interface CursorEntry {
  type: CursorType;
  label: string;
}

interface CursorCategory {
  name: string;
  entries: CursorEntry[];
}

const CURSOR_CATEGORIES: CursorCategory[] = [
  {
    name: 'Pointers',
    entries: [
      { type: 'cursor-pointer-classic',     label: 'Classic' },
      { type: 'cursor-pointer-standard',    label: 'Standard' },
      { type: 'cursor-pointer-nested',      label: 'Nested' },
      { type: 'cursor-pointer-small',       label: 'Small' },
      { type: 'cursor-alt-thick-pointer',   label: 'Alt Thick' },
      { type: 'cursor-simple-triangle',     label: 'Triangle' },
      { type: 'pointer-cursor-detailed',    label: 'Detailed' },
      { type: 'pointer-cursor-settings',    label: 'Settings' },
      { type: 'pointer-hand-cursor',        label: 'Hand Cursor' },
    ],
  },
  {
    name: 'Hands',
    entries: [
      { type: 'hand-pointing-index',  label: 'Pointing' },
      { type: 'hand-open-palm',       label: 'Open Palm' },
      { type: 'hand-open-fingers',    label: 'Open Fingers' },
      { type: 'hand-grab-cursor',     label: 'Grab' },
      { type: 'hand-grab-closed',     label: 'Grab Closed' },
      { type: 'hand-click-cursor',    label: 'Click' },
    ],
  },
  {
    name: 'Click Effects',
    entries: [
      { type: 'cursor-click-crosshair',         label: 'Crosshair' },
      { type: 'cursor-click-target-corners',    label: 'Target' },
      { type: 'cursor-click-burst-fill',        label: 'Burst' },
      { type: 'cursor-click-lines',             label: 'Lines' },
      { type: 'cursor-click-sparkle-crosshair', label: 'Sparkle Cross' },
      { type: 'cursor-click-sparkle-dots',      label: 'Sparkle Dots' },
    ],
  },
  {
    name: 'Text & Edit',
    entries: [
      { type: 'text-cursor-i-beam-round',  label: 'I-Beam Round' },
      { type: 'text-cursor-i-beam-serif',  label: 'I-Beam Serif' },
      { type: 'pencil-edit-cursor',         label: 'Pencil' },
      { type: 'cursor-edit-pencil',         label: 'Edit Pencil' },
      { type: 'edit-pen-cursor-filled',     label: 'Pen Filled' },
      { type: 'edit-pen-cursor-outline',    label: 'Pen Outline' },
    ],
  },
  {
    name: 'Movement',
    entries: [
      { type: 'move-arrows-4way',           label: '4-Way' },
      { type: 'move-arrows-cross',          label: 'Cross' },
      { type: 'move-arrows-cross-circle',   label: 'Cross Circle' },
      { type: 'move-arrows-horizontal',     label: 'Horizontal' },
      { type: 'move-arrows-large',          label: 'Large' },
      { type: 'cursor-move-diagonal-down',  label: 'Diagonal' },
      { type: 'drag-drop-arrows',           label: 'Drag Drop' },
    ],
  },
  {
    name: 'Scroll',
    entries: [
      { type: 'scroll-arrows-vertical',         label: 'Vertical' },
      { type: 'scroll-arrows-vertical-outline', label: 'Vertical Outline' },
      { type: 'scroll-arrows-horizontal',       label: 'Horizontal' },
      { type: 'scroll-arrows-down',             label: 'Down' },
      { type: 'scroll-arrows-4way',             label: '4-Way' },
      { type: 'cursor-arrow-scroll-wheel',      label: 'Scroll Wheel' },
      { type: 'cursor-arrow-scroll-wheel-gray', label: 'Scroll Gray' },
    ],
  },
  {
    name: 'Special',
    entries: [
      { type: 'magic-wand-sparkle',      label: 'Magic Wand' },
      { type: 'cursor-rays-light',       label: 'Rays' },
      { type: 'cursor-gps-location',     label: 'GPS' },
      { type: 'cursor-pixel-block',      label: 'Pixel' },
      { type: 'cursor-plus-add',         label: 'Plus Add' },
      { type: 'cursor-plus-cross',       label: 'Plus Cross' },
      { type: 'cursor-diagonal-line',    label: 'Diagonal Line' },
      { type: 'keyboard-arrows-icon',    label: 'Keyboard' },
    ],
  },
];

const CURSOR_COLORS = [
  '#2c2b2b', '#444', '#8a8a8a', '#ffffff',
  '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71',
  '#3498db', '#9b59b6', '#e91e63', '#00bcd4',
];




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
  const t = useTranslation();
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

  const hapticEnabled    = useSettingsStore((s) => s.hapticEnabled);
  const soundEnabled      = useSettingsStore((s) => s.soundEnabled);
  const toggleHaptic        = useSettingsStore((s) => s.toggleHaptic);
  const toggleSound          = useSettingsStore((s) => s.toggleSound);

  const autoCorrect        = useSettingsStore((s) => s.autoCorrect);
  const showSuggestions    = useSettingsStore((s) => s.showSuggestions);
  const toggleAutoCorrect     = useSettingsStore((s) => s.toggleAutoCorrect);
  const toggleShowSuggestions  = useSettingsStore((s) => s.toggleShowSuggestions);

  const keyHeight             = useSettingsStore((s) => s.keyHeight);
  const setKeyHeight           = useSettingsStore((s) => s.setKeyHeight);
  const keyBorderRadius         = useSettingsStore((s) => s.keyBorderRadius);
  const setKeyBorderRadius       = useSettingsStore((s) => s.setKeyBorderRadius);
  const fontSize                   = useSettingsStore((s) => s.fontSize);
  const setFontSize                 = useSettingsStore((s) => s.setFontSize);

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
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t.settingsTitle}</Text>

        {/* ── Feedback ──────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.sectionLabel }]}>{t.feedback}</Text>
        <View style={[styles.card, cardStyle]}>
          <ToggleRow label={t.hapticFeedback} description={t.hapticDescription} value={hapticEnabled} onValueChange={toggleHaptic} />
          <ToggleRow label={t.keySounds} description={t.keySoundsDescription} value={soundEnabled} onValueChange={toggleSound} />
        </View>

        {/* ── Typing ───────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.sectionLabel }]}>{t.typing}</Text>
        <View style={[styles.card, cardStyle]}>
          <ToggleRow label={t.autoCorrect} description={t.autoCorrectDescription} value={autoCorrect} onValueChange={toggleAutoCorrect} />
          <ToggleRow label={t.showSuggestions} description={t.showSuggestionsDescription} value={showSuggestions} onValueChange={toggleShowSuggestions} />
        </View>

        {/* ── Key Size ─────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.sectionLabel }]}>{t.keySize}</Text>
        <View style={[styles.card, cardStyle]}>
          <SliderRow label={t.keyHeight} value={keyHeight} min={40} max={60} onChange={setKeyHeight} unit="dp" colors={colors} />
          <SliderRow label={t.cornerRadius} value={keyBorderRadius} min={0} max={16} onChange={setKeyBorderRadius} unit="dp" colors={colors} />
          <SliderRow label={t.fontSize} value={fontSize} min={12} max={22} onChange={setFontSize} unit="sp" colors={colors} />
        </View>

        {/* ── Cursor ───────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.sectionLabel }]}>{t.cursorType}</Text>
        {CURSOR_CATEGORIES.map((category) => (
          <View key={category.name} style={{ marginBottom: 12 }}>
            <Text style={[styles.categoryLabel, { color: colors.textMuted }]}>{category.name}</Text>
            <View style={styles.cursorTypeGrid}>
              {category.entries.map(({ type, label }) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.cursorTypeCard, { backgroundColor: colors.card, borderTopColor: colors.cardBorderTL, borderLeftColor: colors.cardBorderTL, borderBottomColor: colors.cardBorderBR, borderRightColor: colors.cardBorderBR, shadowColor: colors.cardShadow }, cursorType === type && { borderColor: colors.accent, borderWidth: 2 }]}
                  onPress={() => setCursorType(type)}
                  activeOpacity={0.8}
                >
                  <SvgUri uri={getCursorSvgUri(type)} width={Math.round(cursorSize * 0.6)} height={Math.round(cursorSize * 0.6)} />
                  <Text style={[styles.cursorTypeLabel, { color: colors.textSecondary }, cursorType === type && { color: colors.accent }]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <Text style={[styles.sectionLabel, { color: colors.sectionLabel }]}>{t.cursorColor}</Text>
        <View style={styles.colorPalette}>
          {CURSOR_COLORS.map((c) => (
            <TouchableOpacity key={c} style={[styles.colorSwatch, { backgroundColor: c }, cursorColor === c && { borderWidth: 2, borderColor: colors.accent }]} onPress={() => setCursorColor(c)} activeOpacity={0.8} />
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.sectionLabel }]}>{t.cursorSize}</Text>
        <View style={[styles.card, cardStyle]}>
          <View style={[styles.cursorSizePreview, { backgroundColor: colors.inputBg, borderTopColor: colors.cardBorderTL, borderLeftColor: colors.cardBorderTL, borderBottomColor: colors.cardBorderBR, borderRightColor: colors.cardBorderBR }]}>
            <SvgUri uri={getCursorSvgUri(cursorType)} width={cursorSize} height={cursorSize} />
          </View>
          <SliderRow label={t.size} value={cursorSize} min={12} max={48} onChange={setCursorSize} unit="px" colors={colors} />
        </View>

        {/* ── Display over other apps ─────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.sectionLabel }]}>{t.displayOverOtherApps}</Text>
        <View style={[styles.card, cardStyle]}>
          <View style={[styles.a11yRow, { borderBottomColor: colors.separator }]}>
            <Text style={[styles.a11yLabel, { color: colors.textSecondary }]}>{t.overlayPermission}</Text>
            <Text style={[styles.a11yValue, { color: overlayGranted ? colors.accent : colors.textMuted }]}>
              {overlayGranted === null ? t.checking : overlayGranted ? t.granted : t.notGranted}
            </Text>
          </View>
          <Pressable style={({ pressed }) => [styles.a11yButton, { backgroundColor: colors.accent, borderTopColor: colors.cardBorderTL, borderLeftColor: colors.cardBorderTL, borderBottomColor: colors.cardBorderBR, borderRightColor: colors.cardBorderBR, shadowColor: colors.cardShadow }, pressed && styles.a11yButtonPressed]} onPress={() => KickKey.openOverlaySettings()}>
            <Text style={[styles.a11yButtonText, { color: colors.buttonText }]}>{t.openOverlaySettings}</Text>
          </Pressable>
          {overlayGranted === false && <Text style={[styles.a11yHint, { color: colors.textMuted }]}>{t.overlayHint}</Text>}
        </View>

        {/* ── Accessibility ────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.sectionLabel }]}>{t.accessibility}</Text>
        <View style={[styles.card, cardStyle]}>
          <View style={[styles.a11yRow, { borderBottomColor: colors.separator }]}>
            <Text style={[styles.a11yLabel, { color: colors.textSecondary }]}>{t.accessibilityService}</Text>
            <Text style={[styles.a11yValue, { color: a11yEnabled ? colors.accent : colors.textMuted }]}>
              {a11yEnabled === null ? t.checking : a11yEnabled ? t.enabled : t.disabled}
            </Text>
          </View>
          <Pressable style={({ pressed }) => [styles.a11yButton, { backgroundColor: colors.accent, borderTopColor: colors.cardBorderTL, borderLeftColor: colors.cardBorderTL, borderBottomColor: colors.cardBorderBR, borderRightColor: colors.cardBorderBR, shadowColor: colors.cardShadow }, pressed && styles.a11yButtonPressed]} onPress={() => KickKey.openAccessibilitySettings()}>
            <Text style={[styles.a11yButtonText, { color: colors.buttonText }]}>{t.openAccessibilitySettings}</Text>
          </Pressable>
          {a11yEnabled === false && <Text style={[styles.a11yHint, { color: colors.textMuted }]}>{t.accessibilityHint}</Text>}
        </View>

        <Text style={[styles.footnote, { color: colors.textMuted }]}>{t.settingsFootnote}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scroll: { padding: 20, paddingTop: 12 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20 },
  sectionLabel: { fontSize: 12, textTransform: 'uppercase', marginBottom: 8, marginTop: 16, letterSpacing: 0.5 },
  card: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderBottomWidth: 2, borderRightWidth: 2, shadowOffset: { width: -3, height: -3 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 6 },
  sliderRow: { marginBottom: 16 },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  sliderLabel: { fontSize: 13 },
  sliderValue: { fontSize: 13, fontWeight: '600' },
  categoryLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 4 },
  cursorTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  cursorTypeCard: { width: '30%', borderRadius: 10, paddingVertical: 12, alignItems: 'center', gap: 6, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderBottomWidth: 2, borderRightWidth: 2, shadowOffset: { width: -2, height: -2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 4 },
  cursorTypeLabel: { fontSize: 11, fontWeight: '600' },
  colorPalette: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 4 },
  colorSwatch: { width: 36, height: 36, borderRadius: 18, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderTopColor: 'rgba(0,0,0,0.12)', borderLeftColor: 'rgba(0,0,0,0.12)', borderBottomWidth: 2, borderRightWidth: 2, borderBottomColor: 'rgba(255,255,255,0.6)', borderRightColor: 'rgba(255,255,255,0.6)', shadowColor: '#000', shadowOffset: { width: -2, height: -2 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 3 },
  cursorSizePreview: { alignItems: 'center', justifyContent: 'center', height: 56, marginBottom: 4, borderRadius: 8, borderTopWidth: 2, borderLeftWidth: 2, borderBottomWidth: 1, borderRightWidth: 1 },
  a11yRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  a11yLabel: { fontSize: 15 },
  a11yValue: { fontSize: 13, fontWeight: '600' },
  a11yButton: { borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 12, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderBottomWidth: 2, borderRightWidth: 2, shadowOffset: { width: -2, height: -2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 5 },
  a11yButtonPressed: { transform: [{ translateY: 1 }], borderTopWidth: 2, borderLeftWidth: 2, borderBottomWidth: 0, borderRightWidth: 0, shadowOffset: { width: 1, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1, elevation: 2 },
  a11yButtonText: { fontSize: 14, fontWeight: '700' },
  a11yHint: { fontSize: 12, lineHeight: 17, paddingBottom: 12 },
  footnote: { fontSize: 12, textAlign: 'center', marginTop: 24 },
});

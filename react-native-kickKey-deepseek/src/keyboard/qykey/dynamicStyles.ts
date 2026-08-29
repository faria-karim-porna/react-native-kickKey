// ============================================================
// dynamicStyles.ts — theme-aware keyboard styles.
// Replaces the static styles.ts with a function that generates
// a StyleSheet based on the current keyboard theme colors.
// ============================================================

import { Dimensions, StyleSheet } from 'react-native';
import type { KeyboardThemeColors } from '../hooks/useKeyboardTheme';

const { width } = Dimensions.get('window');

export function createKeyboardStyles(colors: KeyboardThemeColors) {
  // Derive secondary colors from the theme
  const isDark = colors.keyText === '#eceff4';
  const keyShadowTL = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.2)';
  const keyShadowBR = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)';
  const keyBorderColorTL = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.2)';
  const keyBorderColorBR = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)';
  const pressedBg = isDark ? '#4c566a' : '#dcdde1';
  const functionKeyBg = isDark ? '#4c566a' : '#8a8a8a';
  const borderColor = isDark ? '#434c5e' : '#abb2b9';
  const insetTL = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.15)';
  const insetBR = isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.6)';
  const suggestionSep = isDark ? '#434c5e' : '#bbb';
  const navBtnBg = colors.specialKeyBg;
  const scrollBtnBg = functionKeyBg;
  const mouseBtnBg = isDark ? '#3b4252' : '#c8ccd0';
  const tooltipBg = isDark ? '#2e3440' : '#2c2b2b';
  const tabBtnBg = isDark ? '#3b4252' : '#d1d1d1';
  const activeTabBg = functionKeyBg;
  const emojiKeyBg = colors.keyBg;
  const knobBg = colors.keyBg;

  return StyleSheet.create({
    // Wrapper that layers the circuit board BEHIND the keyboard shell.
    keyboardContainer: {
      flex: 1,
      position: 'relative',
      alignSelf: 'center',
      width: '100%',
      backgroundColor: 'transparent',
    },
    circuitContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 12,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
    base: {
      flex: 1,
      zIndex: 1,
      width: '100%',
      paddingTop: 6,
      paddingRight: 4,
      paddingBottom: 16,
      paddingLeft: 4,
      backgroundColor: colors.keyboardBg + 'cc',
      borderRadius: 12,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      borderWidth: 1,
      borderColor,
      shadowColor: '#000',
      shadowOffset: { width: -5, height: -5 },
      shadowOpacity: 0.6,
      shadowRadius: 10,
      elevation: 10,
    },
    mainKeysContainer: {},
    line: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 7,
      gap: 6,
      width: '100%',
    },
    key: {
      height: 38,
      backgroundColor: colors.keyBg,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      borderTopWidth: 1.5,
      borderLeftWidth: 1.5,
      borderTopColor: keyBorderColorTL,
      borderLeftColor: keyBorderColorTL,
      borderBottomWidth: 2,
      borderRightWidth: 2,
      borderBottomColor: keyBorderColorBR,
      borderRightColor: keyBorderColorBR,
      shadowColor: '#000',
      shadowOffset: { width: -3, height: -3 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 6,
    },
    keyPressed: {
      backgroundColor: pressedBg,
      transform: [{ translateY: 1 }],
      borderTopWidth: 2,
      borderLeftWidth: 2,
      borderBottomWidth: 0,
      borderRightWidth: 0,
      borderTopColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.25)',
      borderLeftColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.25)',
    },
    keyActive: {
      fontSize: 10,
    },
    keyText: {
      fontSize: 14,
      color: colors.keyText,
      fontWeight: '700',
      includeFontPadding: false,
    },
    specialKey: { backgroundColor: colors.specialKeyBg },
    functionKey: { backgroundColor: functionKeyBg },
    wider: {
      width: 44,
    },
    spaceInner: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    spaceText: {
      color: colors.keyText,
      fontSize: 13,
      fontWeight: '700',
      textAlign: 'center',
      includeFontPadding: false,
    },
    toggleContainer: {
      backgroundColor: colors.specialKeyBg,
      borderRadius: 9,
      marginRight: 2,
      borderTopWidth: 2,
      borderLeftWidth: 2,
      borderTopColor: insetTL,
      borderLeftColor: insetTL,
      borderBottomWidth: 1,
      borderRightWidth: 1,
      borderBottomColor: insetBR,
      borderRightColor: insetBR,
    },
    slider: {
      width: 78,
      height: 38,
      position: 'relative',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    knob: {
      position: 'absolute',
      height: 22,
      width: 36,
      top: 0,
      backgroundColor: knobBg,
      borderRadius: 6,
      zIndex: 1,
      borderTopWidth: 1.5,
      borderLeftWidth: 1.5,
      borderTopColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)',
      borderLeftColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)',
      borderBottomWidth: 2,
      borderRightWidth: 2,
      borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)',
      borderRightColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)',
      shadowColor: '#000',
      shadowOffset: { width: -2, height: -2 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 4,
    },
    iconLayer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      width: '100%',
      zIndex: 2,
    },
    suggestionsContainer: {
      flex: 1,
      height: 38,
      backgroundColor: colors.keyBg,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-evenly',
      overflow: 'hidden',
    },
    suggestionText: {
      fontSize: 13,
      color: colors.keyText,
      fontWeight: '600',
      flexShrink: 1,
      textAlign: 'center' as const,
    },
    suggestionSeparator: {
      width: 1,
      height: 18,
      backgroundColor: suggestionSep,
    },
    touchpadArea: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      width: '100%',
      height: 220,
    },
    activeIndicator: {
      borderWidth: 0.5,
      borderRadius: 10,
      height: 2,
      width: '70%',
    },

    container: {
      width: '100%',
    },

    symNextLine: {
      justifyContent: 'space-between',
      paddingLeft: 44,
      paddingRight: 3.75,
    },
    symNextLineInner: {
      display: 'flex',
      flexDirection: 'row',
      gap: 6,
    },
    lastLine: { justifyContent: 'space-between' },
    lastLineInner: {
      display: 'flex',
      flexDirection: 'row',
      gap: 6,
    },

    moreWider: {
      width: 60,
    },

    largeKeyLine: {
      justifyContent: 'flex-start',
    },
    utilityLine: {
      justifyContent: 'space-between',
      paddingHorizontal: 20.25,
    },
    utilityLineInner: {
      display: 'flex',
      flexDirection: 'row',
      gap: 6,
    },
    extraWider: {
      width: 100,
    },
    pageBtn: {
      width: 60,
      backgroundColor: functionKeyBg,
    },

    touchpadContainer: {
      width: width * 0.92,
      height: '100%',
      maxWidth: 440,
      padding: 8,
      borderRadius: 16,
      backgroundColor: colors.keyboardBg,
      borderWidth: 1,
      borderColor,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: -5, height: -5 },
      shadowOpacity: 0.6,
      shadowRadius: 10,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    },
    touchpadSurface: {
      width: '100%',
      height: '56%',
      backgroundColor: isDark ? '#3b4252' : '#d1d9e6',
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      borderTopWidth: 2,
      borderLeftWidth: 2,
      borderTopColor: insetTL,
      borderLeftColor: insetTL,
      borderBottomWidth: 1,
      borderRightWidth: 1,
      borderBottomColor: insetBR,
      borderRightColor: insetBR,
    },
    touchpadButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      height: '40%',
      width: '100%',
    },
    touchpadButtonArea: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      width: '43%',
    },
    navBtn: {
      width: '100%',
      height: '32%',
      backgroundColor: navBtnBg,
      borderRadius: 7,
    },
    scrollStack: {
      width: '8%',
      gap: 4,
      height: '100%',
    },
    scrollBtn: {
      flex: 1,
      backgroundColor: scrollBtnBg,
      borderRadius: 7,
    },
    mouseBtn: {
      height: '62%',
      marginTop: 6,
      borderRadius: 9,
      width: '100%',
    },
    btnText: {
      color: isDark ? '#d8dee9' : '#888',
      fontWeight: 'bold',
      fontSize: 13,
    },
    tabContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      width: 42,
      height: 38,
    },
    tooltip: {
      position: 'absolute',
      top: -35,
      left: '50%',
      transform: [{ translateX: -35 }],
      width: 70,
      backgroundColor: tooltipBg,
      paddingVertical: 4,
      borderRadius: 6,
      zIndex: 100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tooltipText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: 'bold',
      textAlign: 'center',
      width: '100%',
    },
    tooltipArrow: {
      position: 'absolute',
      bottom: -6,
      left: '50%',
      marginLeft: -6,
      width: 0,
      height: 0,
      borderLeftWidth: 6,
      borderRightWidth: 6,
      borderTopWidth: 6,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: tooltipBg,
    },
    tabBar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 10,
      backgroundColor: colors.specialKeyBg,
      borderRadius: 10,
      paddingVertical: 2,
      borderTopWidth: 2,
      borderLeftWidth: 2,
      borderTopColor: insetTL,
      borderLeftColor: insetTL,
      borderBottomWidth: 1,
      borderRightWidth: 1,
      borderBottomColor: insetBR,
      borderRightColor: insetBR,
    },
    tabButton: {
      width: 42,
      height: 38,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 7,
      backgroundColor: tabBtnBg,
      borderTopWidth: 1.5,
      borderLeftWidth: 1.5,
      borderTopColor: keyBorderColorTL,
      borderLeftColor: keyBorderColorTL,
      borderBottomWidth: 2,
      borderRightWidth: 2,
      borderBottomColor: keyBorderColorBR,
      borderRightColor: keyBorderColorBR,
    },
    activeTabButton: {
      backgroundColor: activeTabBg,
      borderTopWidth: 2,
      borderLeftWidth: 2,
      borderBottomWidth: 0,
      borderRightWidth: 0,
      borderTopColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.25)',
      borderLeftColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.25)',
      transform: [{ translateY: 1 }],
    },
    tabActiveIndicator: {
      borderWidth: 1,
      borderRadius: 10,
      height: 2,
      width: '70%',
      position: 'absolute',
      bottom: 2,
    },
    emojiGridContainer: {
      height: 220,
      paddingHorizontal: 10,
    },
    scrollContent: {
      paddingBottom: 5,
    },
    row: {
      justifyContent: 'center',
      gap: 6,
      marginBottom: 7,
    },
    emojiKey: {
      width: 34,
      height: 36,
      backgroundColor: emojiKeyBg,
    },
    emojiText: {
      fontSize: 20,
      includeFontPadding: false,
      fontFamily: 'NotoColorEmoji',
    },
  });
}

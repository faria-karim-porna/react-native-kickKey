// ============================================================
// styles.ts — "Chocolate bar" neumorphic keyboard styles
// Ported from qykey/assets/styles/styles.ts (exact qykey look).
// Adaptations for the IME window:
//   - `base` fills the IME window (flex: 1, width: '100%')
//   - `mainKeysContainer` sizes to its content (no fixed height)
//   - emoji grid / touchpad get fixed heights that match the
//     standard 5-line key area so nothing clips or collapses.
// ============================================================

import { Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  base: {
    flex: 1,
    zIndex: 1,
    width: '100%',
    padding: 5,
    backgroundColor: '#e0e5ecac',
    borderRadius: 12,
    // Inset border simulation
    borderWidth: 1,
    borderColor: '#abb2b9',
    // Shadow simulation
    shadowColor: '#000',
    shadowOffset: { width: -5, height: -5 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
  },
  mainKeysContainer: {
    // Sizes to content — the 5 key lines (numbers, Q, A, Z, bottom)
    // total ~160dp. Emoji grid and touchpad use MAIN_KEYS_HEIGHT below.
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
    gap: 3,
    width: '100%',
  },
  key: {
    height: 22,
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',

    // --- CHOCOLATE BAR "RAISED" EFFECT ---

    // 1. Dark borders on top/left simulate the "cut" of the chocolate block
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: 'rgba(0,0,0,0.2)',
    borderLeftColor: 'rgba(0,0,0,0.2)',

    // 2. Light borders on bottom/right simulate light hitting the edges
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomColor: 'rgba(255,255,255,0.8)',
    borderRightColor: 'rgba(255,255,255,0.8)',

    // 3. Deep shadow cast to the top-left
    shadowColor: '#000',
    shadowOffset: { width: -3, height: -3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,

    // 4. Android Elevation
    elevation: 6,
  },
  keyPressed: {
    backgroundColor: '#dcdde1',
    transform: [{ translateY: 1 }],
    // Invert borders for pressed look
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopColor: 'rgba(0,0,0,0.25)',
    borderLeftColor: 'rgba(0,0,0,0.25)',
  },
  keyActive: {
    fontSize: 7,
  },
  keyText: {
    fontSize: 9, // Reduced font size to fit smaller height
    color: '#444',
    fontWeight: '700',
    includeFontPadding: false,
  },
  // Icon glyphs drawn with Text (vector-icon fonts are unavailable in the IME process)
  keyIconText: {
    fontSize: 12,
    color: '#444',
    fontWeight: '700',
    includeFontPadding: false,
    textAlign: 'center',
  },
  specialKey: { backgroundColor: '#c8ccd0' },
  functionKey: { backgroundColor: '#8a8a8a' },
  wider: {
    width: 42,
  },
  spaceInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spaceText: {
    color: '#f2f2f2',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false,
  },
  toggleContainer: {
    backgroundColor: '#c8ccd0',
    borderRadius: 10,
    marginRight: 2,
    // Simulate the track being carved into the keyboard (Inset effect)
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopColor: 'rgba(0,0,0,0.15)',
    borderLeftColor: 'rgba(0,0,0,0.15)',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.6)',
    borderRightColor: 'rgba(255,255,255,0.6)',
  },
  slider: {
    width: 60,
    height: 22,
    position: 'relative',
    justifyContent: 'center',
    overflow: 'hidden', // Keeps the "inner" look clean
  },
  knob: {
    position: 'absolute',
    height: 18,
    width: 26,
    top: 0,
    backgroundColor: '#f2f2f2',
    borderRadius: 4,
    zIndex: 1,

    // --- CHOCOLATE BLOCK EFFECT (Raised) ---
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: 'rgba(0,0,0,0.1)',
    borderLeftColor: 'rgba(0,0,0,0.1)',
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomColor: 'rgba(255,255,255,0.9)',
    borderRightColor: 'rgba(255,255,255,0.9)',

    // Shadow for depth
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
  sliderIcon: {
    fontSize: 10,
    includeFontPadding: false,
  },
  suggestionsContainer: {
    flex: 1,
    height: 22,
    backgroundColor: '#f2f2f2',
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly', // equal spacing always
    overflow: 'hidden',
  },
  suggestionText: {
    fontSize: 9,
    color: '#444',
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'center' as const,
  },
  suggestionSeparator: {
    width: 1,
    height: 12,
    backgroundColor: '#bbb',
  },
  touchpadArea: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    height: 160,
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
    paddingLeft: 45,
    paddingRight: 3.75,
  },
  symNextLineInner: {
    display: 'flex',
    flexDirection: 'row',
    gap: 3,
  },
  lastLine: { justifyContent: 'space-between' },
  lastLineInner: {
    display: 'flex',
    flexDirection: 'row',
    gap: 3,
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
    gap: 3,
  },
  extraWider: {
    width: 100,
  },
  pageBtn: {
    width: 60,
    backgroundColor: '#8a8a8a',
  },

  touchpadContainer: {
    width: width * 0.85,
    height: '100%',
    maxWidth: 400,
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#e0e5ec', // Keyboard base color
    borderWidth: 1,
    borderColor: '#abb2b9',
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
    height: '58%',
    backgroundColor: '#d1d9e6', // Recessed color (same as slider track)
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    // Inset border simulation
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopColor: 'rgba(0,0,0,0.15)',
    borderLeftColor: 'rgba(0,0,0,0.15)',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.7)',
    borderRightColor: 'rgba(255,255,255,0.7)',
  },
  touchpadButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    height: '38%',
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
    height: '28%',
    backgroundColor: '#c8ccd0', // Special key color
    borderRadius: 6,
  },
  scrollStack: {
    width: '7%',
    gap: 4,
    height: '100%',
  },
  scrollBtn: {
    flex: 1,
    backgroundColor: '#8a8a8a', // Function key color
    borderRadius: 6,
  },
  mouseBtn: {
    height: '58%',
    marginTop: 10,
    borderRadius: 10,
    width: '100%',
  },
  btnText: {
    color: '#888',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 35, // Matches your tabButton width exactly
    height: 30, // Matches your tabButton height exactly
  },
  tooltip: {
    position: 'absolute',
    top: -35, // Slightly higher for better clearance
    left: '50%', // Move to horizontal center of the parent
    transform: [{ translateX: -35 }], // Half of the tooltip's approximate width
    width: 70, // Fixed width ensures the math always works
    backgroundColor: '#2c2b2b',
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
    marginLeft: -6, // Half of the border width (6) to center it
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#2c2b2b',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    backgroundColor: '#c8ccd0', // .special-key color from your Keyboard.tsx
    borderRadius: 10,
    paddingVertical: 3,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopColor: 'rgba(0,0,0,0.15)',
    borderLeftColor: 'rgba(0,0,0,0.15)',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.6)',
    borderRightColor: 'rgba(255,255,255,0.6)',
  },
  tabButton: {
    width: 35,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: '#d1d1d1', // per your .special-key CSS request
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: 'rgba(0,0,0,0.2)',
    borderLeftColor: 'rgba(0,0,0,0.2)',
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomColor: 'rgba(255,255,255,0.8)',
    borderRightColor: 'rgba(255,255,255,0.8)',
  },
  activeTabButton: {
    backgroundColor: '#8a8a8a', // .function-key color to show active selection
    // Invert borders for "pressed" look
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopColor: 'rgba(0,0,0,0.25)',
    borderLeftColor: 'rgba(0,0,0,0.25)',
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
  emojiTabIcon: {
    fontSize: 14,
    includeFontPadding: false,
  },
  emojiTabIconActive: {
    fontSize: 12,
    includeFontPadding: false,
  },
  emojiGridContainer: {
    height: 160, // Matches the 5-line key area height
    paddingHorizontal: 2,
  },
  scrollContent: {
    paddingBottom: 5,
  },
  row: {
    justifyContent: 'center',
    gap: 3,
    marginBottom: 3,
  },
  emojiKey: {
    width: 32, // Matches standard key width
    height: 32,
    backgroundColor: '#f2f2f2',
  },
  emojiText: {
    fontSize: 16, // Emojis need larger text to be visible
    includeFontPadding: false,
  },
});

export default styles;

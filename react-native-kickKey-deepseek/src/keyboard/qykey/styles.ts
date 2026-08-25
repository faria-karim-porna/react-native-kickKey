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
  // Wrapper that layers the circuit board BEHIND the keyboard shell.
  // The `base` shell is translucent (#e0e5ecac) so the animated wires
  // show through behind the keys (qykey's design).
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
    backgroundColor: '#ffffff',
  },
  base: {
    flex: 1,
    zIndex: 1,
    width: '100%',
    paddingTop: 6,
    paddingRight: 4,
    paddingBottom: 22,
    paddingLeft: 4,
    backgroundColor: '#e0e5ecac',
    borderRadius: 12,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
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
    // Sizes to content — the 5 key lines total ~250dp.
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 4.5,
    gap: 3.5,
    width: '100%',
  },
  key: {
    // Shorter than wide on most devices (letter keys ~33.75w / special 45w),
    // while Key.tsx's vertical hitSlop keeps the tap target comfortable.
    height: 38,
    backgroundColor: '#f2f2f2',
    borderRadius: 9,
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
    fontSize: 10,
  },
  keyText: {
    fontSize: 16,
    color: '#444',
    fontWeight: '700',
    includeFontPadding: false,
  },
  specialKey: { backgroundColor: '#c8ccd0' },
  functionKey: { backgroundColor: '#8a8a8a' },
  wider: {
    width: 45,
  },
  spaceInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spaceText: {
    color: '#f2f2f2',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false,
  },
  toggleContainer: {
    backgroundColor: '#c8ccd0',
    borderRadius: 9,
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
    width: 78,
    height: 34,
    position: 'relative',
    justifyContent: 'center',
    overflow: 'hidden', // Keeps the "inner" look clean
  },
  knob: {
    position: 'absolute',
    height: 30,
    width: 36,
    top: 0,
    backgroundColor: '#f2f2f2',
    borderRadius: 6,
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
  suggestionsContainer: {
    flex: 1,
    height: 34,
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly', // equal spacing always
    overflow: 'hidden',
  },
  suggestionText: {
    fontSize: 14,
    color: '#444',
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'center' as const,
  },
  suggestionSeparator: {
    width: 1,
    height: 20,
    backgroundColor: '#bbb',
  },
  touchpadArea: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    height: 215,
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
    width: width * 0.92,
    height: '100%',
    maxWidth: 440,
    padding: 10,
    borderRadius: 16,
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
    height: '56%',
    backgroundColor: '#d1d9e6', // Recessed color (same as slider track)
    borderRadius: 10,
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
    backgroundColor: '#c8ccd0', // Special key color
    borderRadius: 7,
  },
  scrollStack: {
    width: '8%',
    gap: 4,
    height: '100%',
  },
  scrollBtn: {
    flex: 1,
    backgroundColor: '#8a8a8a', // Function key color
    borderRadius: 7,
  },
  mouseBtn: {
    height: '62%',
    marginTop: 6,
    borderRadius: 9,
    width: '100%',
  },
  btnText: {
    color: '#888',
    fontWeight: 'bold',
    fontSize: 15,
  },
  tabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 42,
    height: 34,
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
    width: 42,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 7,
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
  emojiGridContainer: {
    height: 215, // Matches the shortened 5-line key area height
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
    width: 42,
    height: 42,
    backgroundColor: '#f2f2f2',
  },
  emojiText: {
    fontSize: 24, // Emojis need larger text to be visible
    includeFontPadding: false,
    // Bundled NotoColorEmoji (assets/fonts) — full-color emoji on all devices.
    fontFamily: 'NotoColorEmoji',
  },
});

export default styles;

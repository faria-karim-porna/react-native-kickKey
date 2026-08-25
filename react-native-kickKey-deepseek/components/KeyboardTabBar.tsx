import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import type { Tabs } from 'expo-router';

export type KeyboardTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

interface TabMeta {
  label: string;
  keycapCode: string;
  iconPath: string;
}

const TAB_META: Record<string, TabMeta> = {
  index: {
    label: 'Home',
    keycapCode: 'HOME',
    iconPath: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  },
  settings: {
    label: 'Settings',
    keycapCode: 'SET',
    iconPath:
      'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
  },
  themes: {
    label: 'Themes',
    keycapCode: 'RGB',
    iconPath:
      'M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10c1.38 0 2.5-1.12 2.5-2.5 0-.61-.23-1.2-.64-1.67-.08-.1-.13-.21-.13-.33 0-.29.24-.5.53-.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 8 6.5 8 8 8.67 8 9.5 7.33 11 6.5 11zm3-4C8.67 7 8 6.33 8 5.5S8.67 4 9.5 4s1.5.67 1.5 1.5S10.33 7 9.5 7zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 4 14.5 4s1.5.67 1.5 1.5S15.33 7 14.5 7zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 8 17.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
  },
  language: {
    label: 'Lang',
    keycapCode: 'LNG',
    iconPath:
      'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56A8.03 8.03 0 0118.92 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.987 7.987 0 015.08 16zm2.95-8H5.08a7.987 7.987 0 014.33-3.56A15.65 15.65 0 008.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 01-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z',
  },
  dictionary: {
    label: 'Dict',
    keycapCode: 'DIC',
    iconPath:
      'M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z',
  },
};

export function KeyboardTabBar({ state, descriptors, navigation }: KeyboardTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.outerContainer,
        {
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      {/* Keyboard Switch Plate / Chassis Dock */}
      <View style={styles.dockTray}>
        {state.routes.map((route, index: number) => {
          const isFocused = state.index === index;
          const meta = TAB_META[route.name] || {
            label: route.name,
            keycapCode: route.name.slice(0, 3).toUpperCase(),
            iconPath: TAB_META.index.iconPath,
          };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={({ pressed }) => [
                styles.keycap,
                isFocused ? styles.keycapActive : styles.keycapInactive,
                pressed && !isFocused && styles.keycapPressed,
              ]}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={meta.label}
            >
              {/* Keycap Corner Code */}
              <Text
                style={[
                  styles.keycapCode,
                  isFocused ? styles.keycapCodeActive : styles.keycapCodeInactive,
                ]}
              >
                {meta.keycapCode}
              </Text>

              {/* Icon */}
              <View style={styles.iconContainer}>
                <Svg width={18} height={18} viewBox="0 0 24 24">
                  <Path
                    d={meta.iconPath}
                    fill={isFocused ? '#5e7a9c' : '#7c8899'}
                  />
                </Svg>
              </View>

              {/* Keycap Label */}
              <Text
                style={[
                  styles.keycapLabel,
                  isFocused ? styles.keycapLabelActive : styles.keycapLabelInactive,
                ]}
                numberOfLines={1}
              >
                {meta.label}
              </Text>

              {/* Glowing Backlight LED Indicator when active */}
              {isFocused ? (
                <View style={styles.ledActiveGlow}>
                  <View style={styles.ledCore} />
                </View>
              ) : (
                <View style={styles.ledInactiveDot} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Normal flow child: react-navigation lays it out BELOW the screen area,
  // so tab content scrolls only above the bar instead of underneath it.
  outerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  // Recessed keyboard chassis tray holding the mechanical key switches
  dockTray: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 460,
    backgroundColor: 'rgba(215, 222, 232, 0.94)',
    borderRadius: 18,
    padding: 6,
    gap: 6,

    // Inset carved track effect matching KickKey keyboard base
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopColor: 'rgba(0, 0, 0, 0.18)',
    borderLeftColor: 'rgba(0, 0, 0, 0.18)',
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.85)',
    borderRightColor: 'rgba(255, 255, 255, 0.85)',

    // Soft chassis drop shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
  },

  // Base Keycap styling
  keycap: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },

  // 3D Raised tactile keycap (unselected)
  keycapInactive: {
    backgroundColor: '#ebf0f7',
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.95)',
    borderLeftColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 2.5,
    borderRightWidth: 2,
    borderBottomColor: 'rgba(0, 0, 0, 0.22)',
    borderRightColor: 'rgba(0, 0, 0, 0.18)',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 3,
  },

  // Momentary press feedback
  keycapPressed: {
    transform: [{ translateY: 1 }],
    backgroundColor: '#dde3ed',
  },

  // Depressed / Engaged key switch (selected)
  keycapActive: {
    backgroundColor: '#d8e1ed',
    transform: [{ translateY: 1.5 }],

    // Inverted borders for tactile mechanical recessed look
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopColor: 'rgba(0, 0, 0, 0.25)',
    borderLeftColor: 'rgba(0, 0, 0, 0.25)',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.75)',
    borderRightColor: 'rgba(255, 255, 255, 0.75)',

    elevation: 1,
  },

  // Monospace keycap sub-legend in the upper corner
  keycapCode: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 9,
  },
  keycapCodeInactive: {
    color: '#9aa5b5',
  },
  keycapCodeActive: {
    color: '#5e7a9c',
  },

  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 1,
  },

  // Label underneath icon
  keycapLabel: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  keycapLabelInactive: {
    color: '#657182',
  },
  keycapLabelActive: {
    color: '#34495e',
    fontWeight: '800',
  },

  // Mechanical backlit LED strip
  ledActiveGlow: {
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#5e7a9c',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4b7bec',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
    marginTop: 1,
  },
  ledCore: {
    width: 10,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: '#ffffff',
  },
  ledInactiveDot: {
    width: 4,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    marginTop: 2,
  },
});

import { useEffect, useRef } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { useKickKeyBridge } from './useKickKeyBridge';

/**
 * Call this once near the root of the app (in app/_layout.tsx).
 * Subscribes to every setting the keyboard cares about and pushes
 * changes to SharedPreferences whenever they change.
 *
 * Debounced by 300ms to avoid hammering SharedPreferences when the
 * user is dragging a slider (e.g. font size).
 */
export function useSettingsSync() {
  const { savePreferences } = useKickKeyBridge();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const language        = useSettingsStore((s) => s.language);
  const theme            = useSettingsStore((s) => s.theme);
  const themeColors      = useSettingsStore((s) => s.themeColors);
  const keyHeight         = useSettingsStore((s) => s.keyHeight);
  const keyBorderRadius   = useSettingsStore((s) => s.keyBorderRadius);
  const fontSize           = useSettingsStore((s) => s.fontSize);
  const keyMargin          = useSettingsStore((s) => s.keyMargin);
  const hapticEnabled      = useSettingsStore((s) => s.hapticEnabled);
  const soundEnabled       = useSettingsStore((s) => s.soundEnabled);
  const autoCorrect        = useSettingsStore((s) => s.autoCorrect);
  const showSuggestions    = useSettingsStore((s) => s.showSuggestions);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      savePreferences({
        language,
        theme,
        keyboardBg:      themeColors.keyboardBg,
        themeKeyBg:      themeColors.keyBg,
        themeKeyText:    themeColors.keyText,
        specialKeyBg:    themeColors.specialKeyBg,
        themePrimary:    themeColors.themePrimary,
        keyHeight,
        keyBorderRadius,
        fontSize,
        keyMargin,
        hapticEnabled,
        soundEnabled,
        autoCorrect,
        showSuggestions,
      }).catch(() => {
        // Silently ignore
      });
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [
    language, theme, themeColors,
    keyHeight, keyBorderRadius, fontSize, keyMargin,
    hapticEnabled, soundEnabled, autoCorrect, showSuggestions,
  ]);
}

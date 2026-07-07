import { useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useKickKeyBridge } from './useKickKeyBridge';

interface SetupStatus {
  isEnabled: boolean;
  isDefault: boolean;
  isFullySetUp: boolean;
  refresh: () => Promise<void>;
}

const POLL_INTERVAL_MS = 2000;

export function useSetupStatus(): SetupStatus {
  const { isKeyboardEnabled, isDefaultKeyboard } = useKickKeyBridge();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = async () => {
    const [enabled, def] = await Promise.all([
      isKeyboardEnabled(),
      isDefaultKeyboard(),
    ]);
    setIsEnabled(enabled);
    setIsDefault(def);
  };

  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, POLL_INTERVAL_MS);

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') refresh();
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      sub.remove();
    };
  }, []);

  return {
    isEnabled,
    isDefault,
    isFullySetUp: isEnabled && isDefault,
    refresh,
  };
}

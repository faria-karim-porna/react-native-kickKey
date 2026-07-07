import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSettingsStore } from '../store/settingsStore';
import { useSetupStatus } from '../hooks/useSetupStatus';
import { useSettingsSync } from '../hooks/useSettingsSync';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const hasCompletedOnboarding = useSettingsStore((s) => s.hasCompletedOnboarding);
  const { isFullySetUp } = useSetupStatus();

  // Sync settings to SharedPreferences on every change, app-wide
  useSettingsSync();

  useEffect(() => {
    const inOnboarding = segments[0] === 'onboarding';
    const shouldShowOnboarding = !hasCompletedOnboarding || !isFullySetUp;

    if (shouldShowOnboarding && !inOnboarding) {
      router.replace('/onboarding/step1-enable');
    } else if (!shouldShowOnboarding && inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [hasCompletedOnboarding, isFullySetUp, segments]);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

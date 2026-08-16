import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { useSettingsStore } from '../store/settingsStore';
import { useSetupStatus } from '../hooks/useSetupStatus';
import { useSettingsSync } from '../hooks/useSettingsSync';

// Android permissions are granted app-wide, but the keyboard runs in a separate
// `:ime_process` that has no Activity — so the RECORD_AUDIO prompt can only be
// shown from here. Ask exactly once (when the status is still undetermined).
let micPermissionAsked = false;
async function ensureMicrophonePermission() {
  if (micPermissionAsked || !ExpoSpeechRecognitionModule) return;
  micPermissionAsked = true;
  try {
    const current = await ExpoSpeechRecognitionModule.getPermissionsAsync();
    if (current?.status === 'undetermined') {
      await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    }
  } catch (e) {
    console.warn('Microphone permission request failed:', e);
  }
}

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const hasCompletedOnboarding = useSettingsStore((s) => s.hasCompletedOnboarding);
  const { isFullySetUp } = useSetupStatus();

  // Sync settings to SharedPreferences on every change, app-wide
  useSettingsSync();

  // Ask for the microphone permission once (first app open) so voice typing
  // works inside the keyboard — the IME process cannot show the dialog itself.
  useEffect(() => {
    const t = setTimeout(ensureMicrophonePermission, 1200);
    return () => clearTimeout(t);
  }, []);

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

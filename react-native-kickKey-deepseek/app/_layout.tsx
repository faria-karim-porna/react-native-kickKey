import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { useSettingsStore } from '../store/settingsStore';
import { useSetupStatus } from '../hooks/useSetupStatus';
import { useSettingsSync } from '../hooks/useSettingsSync';
import { Circuit } from '../src/keyboard/qykey/circuit/Circuit';

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
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Global persistent circuit-board background for smooth screen transitions */}
      <Circuit animated />
      <View style={styles.overlay} />

      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#e0e5ecdd',
  },
});

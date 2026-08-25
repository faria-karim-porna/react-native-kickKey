import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
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

    // Only ever PUSH the user into onboarding when setup is incomplete.
    // We deliberately do NOT eject them out of an in-progress flow here:
    // during re-setup (keyboard was disabled after a prior completed
    // onboarding), isFullySetUp flips true the moment step 2 finishes,
    // and the old ejection sent users straight to the main app —
    // skipping steps 3 & 4. Step 4 itself routes to /(tabs) on finish.
    if (shouldShowOnboarding && !inOnboarding) {
      router.replace('/onboarding/step1-enable');
    }
  }, [hasCompletedOnboarding, isFullySetUp, segments]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Global persistent circuit-board background for smooth screen transitions.
          The Circuit positions itself absolutely (fills its parent), which ignores
          SafeAreaView's padding — so we pin the wrapper below the real status-bar
          inset ourselves, keeping it out of the battery/notification strip while
          staying purely decorative (no layout impact on the Stack). */}
      <View
        style={[StyleSheet.absoluteFill, styles.backgroundOffset, { top: insets.top }]}
        pointerEvents="none"
      >
        <Circuit animated />
      </View>

      {/* Translucent tint drawn OVER the circuit so the animated wires are
          seen through it (muted qykey look). Full-bleed, incl. status strip,
          so screen transitions never flash raw wire colors anywhere. */}
      <View style={[StyleSheet.absoluteFill, styles.overlay]} pointerEvents="none" />

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
  // Root carries a plain base color; the visible tint comes from the overlay
  // layer that sits on top of the circuit.
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  // Absolutely positioned, but offset below the status bar via insets.top.
  // The Circuit inside fills only this clipped region.
  backgroundOffset: {
    top: 0,
    overflow: 'hidden',
  },
  overlay: {
    top: 0,
    // ~80% opaque: animated wires glow through visibly, yet screen text
    // keeps a solid tint behind it for comfortable readability.
    backgroundColor: '#e0e5eccc',
  },
});

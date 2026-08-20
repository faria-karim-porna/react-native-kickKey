import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import SetupProgress from '../../components/SetupProgress';
import { useSetupStatus } from '../../hooks/useSetupStatus';
import { useKickKeyBridge } from '../../hooks/useKickKeyBridge';
import { OverlayIcon, StepCircle } from '../../components/OnboardingIcons';

export default function Step3Overlay() {
  const router = useRouter();
  const { isOverlayGranted } = useSetupStatus();
  const { openOverlaySettings } = useKickKeyBridge();

  useEffect(() => {
    if (isOverlayGranted) {
      router.push('/onboarding/step4-done');
    }
  }, [isOverlayGranted]);

  return (
    <SafeAreaView style={styles.container}>
      <SetupProgress currentStep={3} />

      <View style={styles.iconContainer}>
        <OverlayIcon size={56} />
      </View>
      <Text style={styles.title}>Display Over Other Apps</Text>
      <Text style={styles.description}>
        Allow KickKey to draw over other apps so the touchpad cursor
        can appear anywhere on screen. This is optional but recommended
        for the full touchpad experience.
      </Text>

      <View style={styles.card}>
        <StepCircle number={1} text="Tap the button below" />
        <StepCircle number={2} text='Find "KickKey" in the list' />
        <StepCircle number={3} text="Toggle the permission on" />
        <StepCircle number={4} text="Come back to this app" />
      </View>

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={() => openOverlaySettings()}
      >
        <Text style={styles.buttonText}>Open Overlay Settings</Text>
      </Pressable>

      <Pressable style={styles.skipButton} onPress={() => router.push('/onboarding/step4-done')}>
        <Text style={styles.skipText}>Skip for now</Text>
      </Pressable>

      <Text style={styles.hint}>
        You can always enable this later in Settings.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent', padding: 24, paddingTop: 60 },
  iconContainer: { alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 12 },
  description: { fontSize: 14, color: '#777', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  card: {
    backgroundColor: 'rgba(224,229,236,0.92)',
    borderRadius: 12,
    padding: 18,
    marginBottom: 24,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: 'rgba(0,0,0,0.15)',
    borderLeftColor: 'rgba(0,0,0,0.15)',
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomColor: 'rgba(255,255,255,0.8)',
    borderRightColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#000',
    shadowOffset: { width: -3, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  button: {
    backgroundColor: '#8594aa',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: 'rgba(0,0,0,0.1)',
    borderLeftColor: 'rgba(0,0,0,0.1)',
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomColor: 'rgba(255,255,255,0.6)',
    borderRightColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  buttonPressed: {
    backgroundColor: '#707f9a',
    transform: [{ translateY: 1 }],
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopColor: 'rgba(0,0,0,0.25)',
    borderLeftColor: 'rgba(0,0,0,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skipButton: { paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  skipText: { color: '#999', fontSize: 14, textDecorationLine: 'underline' },
  hint: { color: '#999', fontSize: 12, textAlign: 'center', marginTop: 8 },
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import SetupProgress from '../../components/SetupProgress';
import { useSettingsStore } from '../../store/settingsStore';

export default function Step3Done() {
  const router = useRouter();
  const setOnboardingComplete = useSettingsStore((s) => s.setOnboardingComplete);

  const handleFinish = () => {
    setOnboardingComplete(true);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <SetupProgress currentStep={3} />

      <Text style={styles.emoji}>🎉</Text>
      <Text style={styles.title}>You're All Set!</Text>
      <Text style={styles.description}>
        KickKey is ready to use. Tap any text field in any app and your
        new keyboard will appear. You can switch languages anytime with
        the globe button, and customize your experience in the Settings tab.
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleFinish}>
        <Text style={styles.buttonText}>Start Using KickKey</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', padding: 24, paddingTop: 60, justifyContent: 'center' },
  emoji: { fontSize: 64, textAlign: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 12 },
  description: { fontSize: 14, color: '#777', textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  button: {
    backgroundColor: '#00BCD4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    // Neumorphic raised effect
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
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

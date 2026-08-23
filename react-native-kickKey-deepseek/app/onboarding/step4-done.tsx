import React from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import SetupProgress from '../../components/SetupProgress';
import { useSettingsStore } from '../../store/settingsStore';
import { CelebrateIcon } from '../../components/OnboardingIcons';

export default function Step4Done() {
  const router = useRouter();
  const setOnboardingComplete = useSettingsStore((s) => s.setOnboardingComplete);

  const handleFinish = () => {
    setOnboardingComplete(true);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <SetupProgress currentStep={4} />

      <View style={styles.iconContainer}>
        <CelebrateIcon size={64} />
      </View>
      <Text style={styles.title}>You're All Set!</Text>
      <Text style={styles.description}>
        KickKey is ready to use. Tap any text field in any app and your
        new keyboard will appear. You can switch languages anytime with
        the globe button, and customize your experience in the Settings tab.
      </Text>

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={handleFinish}
      >
        <Text style={styles.buttonText}>Start Using KickKey</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent', padding: 24, paddingTop: 60, justifyContent: 'center' },
  iconContainer: { alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2c2b2b', textAlign: 'center', marginBottom: 12 },
  description: { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  button: {
    backgroundColor: '#8594aa',
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
});

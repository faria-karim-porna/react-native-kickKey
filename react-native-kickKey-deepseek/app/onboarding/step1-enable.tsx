import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import SetupProgress from '../../components/SetupProgress';
import { useSetupStatus } from '../../hooks/useSetupStatus';
import { useKickKeyBridge } from '../../hooks/useKickKeyBridge';

export default function Step1Enable() {
  const router = useRouter();
  const { isEnabled } = useSetupStatus();
  const { openKeyboardSettings } = useKickKeyBridge();

  useEffect(() => {
    if (isEnabled) {
      router.push('/onboarding/step2-default');
    }
  }, [isEnabled]);

  return (
    <SafeAreaView style={styles.container}>
      <SetupProgress currentStep={1} />

      <Text style={styles.emoji}>⌨️</Text>
      <Text style={styles.title}>Enable KickKey</Text>
      <Text style={styles.description}>
        First, you need to turn on KickKey in your phone's keyboard settings.
        Android will show a security notice — this is normal for every
        keyboard app. Tap "OK" to continue.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardStep}>1. Tap the button below</Text>
        <Text style={styles.cardStep}>2. Find "KickKey Keyboard" in the list</Text>
        <Text style={styles.cardStep}>3. Toggle it on</Text>
        <Text style={styles.cardStep}>4. Tap "OK" on the security notice</Text>
        <Text style={styles.cardStep}>5. Come back to this app</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => openKeyboardSettings()}>
        <Text style={styles.buttonText}>Open Keyboard Settings</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        This screen will automatically advance once KickKey is enabled.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', padding: 24, paddingTop: 60 },
  emoji: { fontSize: 56, textAlign: 'center', marginBottom: 16 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 12 },
  description: { fontSize: 14, color: '#777', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  card: {
    backgroundColor: '#e0e5ec',
    borderRadius: 12,
    padding: 18,
    marginBottom: 24,
    // Neumorphic raised effect (chocolate bar style)
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
  cardStep: { color: '#444', fontSize: 13, marginBottom: 8, lineHeight: 18, fontWeight: '500' },
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
  hint: { color: '#999', fontSize: 12, textAlign: 'center', marginTop: 16 },
});

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import SetupProgress from '../../components/SetupProgress';
import { useSetupStatus } from '../../hooks/useSetupStatus';
import { useKickKeyBridge } from '../../hooks/useKickKeyBridge';

export default function Step2Default() {
  const router = useRouter();
  const { isDefault } = useSetupStatus();
  const { showInputMethodPicker } = useKickKeyBridge();

  useEffect(() => {
    if (isDefault) {
      router.push('/onboarding/step3-done');
    }
  }, [isDefault]);

  return (
    <SafeAreaView style={styles.container}>
      <SetupProgress currentStep={2} />

      <Text style={styles.emoji}>✅</Text>
      <Text style={styles.title}>Set as Default</Text>
      <Text style={styles.description}>
        Almost there! Now set KickKey as your default keyboard so it opens
        automatically whenever you tap a text field.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardStep}>1. Tap the button below</Text>
        <Text style={styles.cardStep}>2. Select "KickKey Keyboard" as default</Text>
        <Text style={styles.cardStep}>3. Come back to this app</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => showInputMethodPicker()}>
        <Text style={styles.buttonText}>Set Default Keyboard</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        This screen will automatically advance once KickKey is your default keyboard.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a', padding: 24, paddingTop: 60 },
  emoji: { fontSize: 56, textAlign: 'center', marginBottom: 16 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 12 },
  description: { fontSize: 14, color: '#aaa', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  card: { backgroundColor: '#13132a', borderRadius: 12, padding: 18, marginBottom: 24 },
  cardStep: { color: '#ccc', fontSize: 13, marginBottom: 8, lineHeight: 18 },
  button: { backgroundColor: '#00BCD4', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#000', fontSize: 16, fontWeight: '700' },
  hint: { color: '#666', fontSize: 12, textAlign: 'center', marginTop: 16 },
});

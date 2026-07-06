import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import KickKeyModule from './modules/kickkey-module';

export default function App() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isDefault, setIsDefault] = useState(false);

  const checkStatus = async () => {
    try {
      const enabled = await KickKeyModule.isKeyboardEnabled();
      const defaultKeyboard = await KickKeyModule.isDefaultKeyboard();
      setIsEnabled(enabled);
      setIsDefault(defaultKeyboard);
    } catch (error) {
      console.error('Failed to check keyboard status:', error);
    }
  };

  useEffect(() => {
    checkStatus();
    // Poll every 2 seconds while user is in settings
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>KickKey</Text>
      <Text style={styles.subtitle}>Custom Keyboard</Text>

      <View style={styles.statusCard}>
        <StatusRow
          label="Keyboard Enabled"
          value={isEnabled}
        />
        <StatusRow
          label="Set as Default"
          value={isDefault}
        />
      </View>

      {!isEnabled && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => KickKeyModule.openKeyboardSettings()}
        >
          <Text style={styles.buttonText}>Step 1: Enable KickKey</Text>
        </TouchableOpacity>
      )}

      {isEnabled && !isDefault && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => KickKeyModule.openKeyboardSettings()}
        >
          <Text style={styles.buttonText}>Step 2: Set as Default</Text>
        </TouchableOpacity>
      )}

      {isEnabled && isDefault && (
        <View style={styles.successCard}>
          <Text style={styles.successText}>✅ KickKey is active!</Text>
          <Text style={styles.successSub}>
            Tap any text field to use the keyboard.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function StatusRow({ label, value }: { label: string; value: boolean }) {
  return (
    <View style={styles.statusRow}>
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={[styles.statusValue, { color: value ? '#4CAF50' : '#f44336' }]}>
        {value ? '✅ Yes' : '❌ No'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#00BCD4',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 40,
  },
  statusCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    marginBottom: 32,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  statusLabel: {
    color: '#ccc',
    fontSize: 15,
  },
  statusValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#00BCD4',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    marginBottom: 16,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  successCard: {
    backgroundColor: '#1a2e1a',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    width: '100%',
  },
  successText: {
    color: '#4CAF50',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  successSub: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
});

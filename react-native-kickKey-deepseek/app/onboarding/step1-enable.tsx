import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import SetupProgress from '../../components/SetupProgress';
import { useSetupStatus } from '../../hooks/useSetupStatus';
import { useKickKeyBridge } from '../../hooks/useKickKeyBridge';
import { KeyboardIcon, StepCircle } from '../../components/OnboardingIcons';
import { useAppColors } from '../../hooks/useAppColors';

export default function Step1Enable() {
  const router = useRouter();
  const { isEnabled } = useSetupStatus();
  const { openKeyboardSettings } = useKickKeyBridge();
  const colors = useAppColors();

  useEffect(() => {
    if (isEnabled) {
      router.push('/onboarding/step2-default');
    }
  }, [isEnabled]);

  return (
    <SafeAreaView style={styles.container}>
      <SetupProgress currentStep={1} />

      <View style={styles.iconContainer}>
        <KeyboardIcon size={56} />
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Enable KickKey</Text>
      <Text style={[styles.description, { color: colors.textMuted }]}>
        First, you need to turn on KickKey in your phone's keyboard settings.
        Android will show a security notice — this is normal for every
        keyboard app. Tap "OK" to continue.
      </Text>

      <View style={[styles.card, {
        backgroundColor: colors.card,
        borderTopColor: colors.cardBorderTL,
        borderLeftColor: colors.cardBorderTL,
        borderBottomColor: colors.cardBorderBR,
        borderRightColor: colors.cardBorderBR,
        shadowColor: colors.cardShadow,
      }]}>
        <StepCircle number={1} text="Tap the button below" colors={colors} />
        <StepCircle number={2} text='Find "KickKey Keyboard" in the list' colors={colors} />
        <StepCircle number={3} text="Toggle it on" colors={colors} />
        <StepCircle number={4} text='Tap "OK" on the security notice' colors={colors} />
        <StepCircle number={5} text="Come back to this app" colors={colors} />
      </View>

      <Pressable
        style={({ pressed }) => [styles.button, {
          backgroundColor: colors.accent,
          borderTopColor: colors.cardBorderTL,
          borderLeftColor: colors.cardBorderTL,
          borderBottomColor: colors.cardBorderBR,
          borderRightColor: colors.cardBorderBR,
          shadowColor: colors.cardShadow,
        }, pressed && styles.buttonPressed]}
        onPress={() => openKeyboardSettings()}
      >
        <Text style={[styles.buttonText, { color: colors.buttonText }]}>Open Keyboard Settings</Text>
      </Pressable>

      <Text style={[styles.hint, { color: colors.textMuted }]}>
        This screen will automatically advance once KickKey is enabled.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent', padding: 24 },
  iconContainer: { alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  description: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  card: {
    borderRadius: 12,
    padding: 18,
    marginBottom: 24,
    // Neumorphic raised effect (chocolate bar style)
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    shadowOffset: { width: -3, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },

  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    // Neumorphic raised effect
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    shadowOffset: { width: -2, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  buttonPressed: {
    transform: [{ translateY: 1 }],
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  buttonText: { fontSize: 16, fontWeight: '700' },
  hint: { fontSize: 12, textAlign: 'center', marginTop: 16 },
});

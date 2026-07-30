import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Theme } from './types';

interface ErrorBoundaryProps {
  children: ReactNode;
  theme: Theme;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary for the keyboard bundle.
 * Catches JS render errors and displays them on-screen so issues
 * are visible instead of showing a blank/transparent keyboard.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console for logcat debugging
    console.error('[KickKey ErrorBoundary]', error.message, error.stack, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      const { theme } = this.props;
      return (
        <View style={[styles.container, { backgroundColor: theme.keyboardBg }]}>
          <Text style={[styles.title, { color: '#FF5252' }]}>
            ⚠ Keyboard Error
          </Text>
          <Text style={[styles.message, { color: theme.keyText }]}>
            {this.state.error?.message ?? 'Unknown error'}
          </Text>
          <Text style={[styles.hint, { color: theme.altText }]}>
            Check logcat for details: adb logcat | grep KickKey
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    minHeight: 200,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 16,
  },
  hint: {
    fontSize: 9,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/auth-context';

type LoginStep = 'email' | 'code';

export default function LoginScreen() {
  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { sendCode, verifyCode } = useAuth();

  const primaryColor = useThemeColor({}, 'primary');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const surfaceColor = useThemeColor({}, 'surface');
  const dangerColor = useThemeColor({}, 'danger');
  const successColor = useThemeColor({}, 'success');

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsSendingCode(true);

    const result = await sendCode(email.trim());

    if (result.success) {
      setSuccessMessage('Code sent! Check your email.');
      setStep('code');
    } else {
      setError(result.error || 'Failed to send code. Please try again.');
    }

    setIsSendingCode(false);
  };

  const handleVerifyCode = async () => {
    if (!code.trim() || code.trim().length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsVerifyingCode(true);

    const result = await verifyCode(email.trim(), code.trim());

    if (!result.success) {
      setError(result.error || 'Invalid or expired code. Please try again.');
      setIsVerifyingCode(false);
    }
    // If successful, auth context will update and user will be redirected automatically
  };

  const handleResendCode = async () => {
    setCode('');
    setError(null);
    setSuccessMessage(null);
    await handleSendCode();
  };

  const handleBackToEmail = () => {
    setStep('email');
    setCode('');
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <IconSymbol name="lock.shield.fill" size={64} color={primaryColor} />
            <ThemedText style={styles.title}>Welcome</ThemedText>
            <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
              Sign in with your email
            </ThemedText>
          </View>

          <Card variant="elevated" style={styles.card}>
            {step === 'email' ? (
              <>
                <View style={styles.formField}>
                  <ThemedText style={styles.label}>Email Address</ThemedText>
                  <TextInput
                    value={email}
                    onChangeText={(value) => {
                      setEmail(value);
                      setError(null);
                    }}
                    placeholder="you@example.com"
                    placeholderTextColor={textSecondary}
                    style={[styles.input, { backgroundColor: surfaceColor }]}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    returnKeyType="send"
                    onSubmitEditing={handleSendCode}
                    editable={!isSendingCode}
                  />
                </View>

                {error && (
                  <View style={styles.messageContainer}>
                    <ThemedText style={[styles.errorText, { color: dangerColor }]}>
                      {error}
                    </ThemedText>
                  </View>
                )}

                <Button
                  title={isSendingCode ? 'Sending...' : 'Send Code'}
                  variant="primary"
                  size="lg"
                  loading={isSendingCode}
                  onPress={handleSendCode}
                  disabled={isSendingCode}
                />
              </>
            ) : (
              <>
                <View style={styles.formField}>
                  <ThemedText style={styles.label}>Enter Code</ThemedText>
                  <ThemedText style={[styles.hint, { color: textSecondary }]}>
                    We sent a 6-digit code to {email}
                  </ThemedText>
                  <TextInput
                    value={code}
                    onChangeText={(value) => {
                      // Only allow digits, max 6 characters
                      const digitsOnly = value.replace(/[^0-9]/g, '').slice(0, 6);
                      setCode(digitsOnly);
                      setError(null);
                    }}
                    placeholder="000000"
                    placeholderTextColor={textSecondary}
                    style={[styles.input, styles.codeInput, { backgroundColor: surfaceColor }]}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="number-pad"
                    returnKeyType="done"
                    onSubmitEditing={handleVerifyCode}
                    maxLength={6}
                    editable={!isVerifyingCode}
                    autoFocus
                  />
                </View>

                {successMessage && (
                  <View style={styles.messageContainer}>
                    <ThemedText style={[styles.successText, { color: successColor }]}>
                      {successMessage}
                    </ThemedText>
                  </View>
                )}

                {error && (
                  <View style={styles.messageContainer}>
                    <ThemedText style={[styles.errorText, { color: dangerColor }]}>
                      {error}
                    </ThemedText>
                  </View>
                )}

                <Button
                  title={isVerifyingCode ? 'Verifying...' : 'Verify Code'}
                  variant="primary"
                  size="lg"
                  loading={isVerifyingCode}
                  onPress={handleVerifyCode}
                  disabled={isVerifyingCode || code.length !== 6}
                />

                <View style={styles.resendContainer}>
                  <ThemedText style={[styles.resendText, { color: textSecondary }]}>
                    Didn't receive the code?{' '}
                  </ThemedText>
                  <Button
                    title="Resend"
                    variant="outline"
                    size="sm"
                    onPress={handleResendCode}
                    disabled={isSendingCode}
                  />
                </View>

                <Button
                  title="Back to Email"
                  variant="outline"
                  size="sm"
                  onPress={handleBackToEmail}
                  disabled={isVerifyingCode}
                />
              </>
            )}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: Spacing.md,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    marginTop: Spacing.xs,
  },
  card: {
    padding: Spacing.lg,
  },
  formField: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  hint: {
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  input: {
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: 16,
    minHeight: 48,
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: '600',
  },
  messageContainer: {
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: 13,
  },
  successText: {
    fontSize: 13,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  resendText: {
    fontSize: 14,
  },
});

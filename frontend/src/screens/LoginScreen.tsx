/**
 * Écran de connexion sécurisé avec authentification backend
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, SIZES } from '@/constants/theme';
import Button from '@/components/Button';
import { useAppDispatch } from '@/store/hooks';
import { loginSuccess } from '@/store/slices/authSlice';
import { authService } from '@/services/authService';

export default function LoginScreen() {
  const dispatch = useAppDispatch();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePhoneChange = (text: string) => {
    // Garder uniquement les chiffres
    const cleaned = text.replace(/[^0-9]/g, '');
    // Limiter à 10 chiffres
    if (cleaned.length <= 10) {
      setPhone(cleaned);
      setError('');
    }
  };

  const formatPhoneDisplay = (value: string) => {
    // Format: XX XX XX XX XX
    if (value.length === 0) return '';
    const parts = value.match(/.{1,2}/g) || [];
    return parts.join(' ');
  };

  const handleLogin = async () => {
    if (!isValid) return;
    
    setLoading(true);
    setError('');
    
    try {
      const fullPhone = '+225' + phone;
      console.log('🔑 Connexion avec:', fullPhone);
      
      const response = await authService.login({
        phone: fullPhone,
        password: password,
      });

      console.log('✅ Connexion réussie:', response.user.name);
      
      // Connexion réussie - dispatch des données utilisateur
      dispatch(loginSuccess({
        id: response.user.id,
        name: response.user.name,
        phone: response.user.phone,
        role: 'farmer',
        createdAt: new Date(),
      }));
    } catch (err: any) {
      console.error('❌ Erreur de connexion:', err.message);
      setError(err.message || 'Une erreur est survenue');
      Alert.alert('Erreur de connexion', err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const isValid = phone.length === 10 && password.length >= 4;

  return (
    <LinearGradient
      colors={[COLORS.primaryDark, COLORS.primary]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.logo}>🌾</Text>
            <Text style={styles.title}>SIGIR</Text>
            <Text style={styles.subtitle}>Bienvenue</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Numéro de téléphone</Text>
            <View style={styles.phoneInputContainer}>
              <Text style={styles.countryCode}>🇨🇮 +225</Text>
              <TextInput
                style={styles.phoneInput}
                placeholder="XX XX XX XX XX"
                placeholderTextColor={COLORS.textSecondary}
                value={formatPhoneDisplay(phone)}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                autoComplete="tel"
                maxLength={14}
              />
            </View>
            {phone.length > 0 && phone.length < 10 && (
              <Text style={styles.errorText}>
                Le numéro doit contenir 10 chiffres
              </Text>
            )}

            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Entrez votre mot de passe"
                placeholderTextColor={COLORS.textSecondary}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError('');
                }}
                secureTextEntry={!showPassword}
                autoComplete="password"
                autoCapitalize="none"
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={24}
                  color={COLORS.textSecondary}
                />
              </Pressable>
            </View>
            {password.length > 0 && password.length < 4 && (
              <Text style={styles.errorText}>
                Le mot de passe doit contenir au moins 4 caractères
              </Text>
            )}

            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color={COLORS.error} />
                <Text style={styles.errorMessage}>{error}</Text>
              </View>
            ) : null}

            <Button
              title="Se connecter"
              onPress={handleLogin}
              variant="secondary"
              size="large"
              fullWidth
              loading={loading}
              disabled={!isValid}
              icon="log-in"
              style={styles.button}
            />

            <Text style={styles.info}>
              💡 Première connexion ? Contactez votre coordinateur pour créer un compte.
            </Text>
            <Text style={styles.testInfo}>
              🔧 Test: 0707342607 / 1234
            </Text>
          </View>

          <Text style={styles.footer}>
            Version 1.0.0 • Côte d'Ivoire 🇨🇮
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
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
    padding: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
  },
  logo: {
    fontSize: 60,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.textLight,
    opacity: 0.9,
  },
  form: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius.xl,
    padding: SPACING.xl,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: SIZES.borderRadius.md,
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.xs,
  },
  countryCode: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginRight: SPACING.sm,
  },
  phoneInput: {
    flex: 1,
    height: '100%',
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.text,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: SIZES.borderRadius.md,
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.xs,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.text,
  },
  eyeIcon: {
    padding: SPACING.xs,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.error,
    marginBottom: SPACING.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '15',
    padding: SPACING.base,
    borderRadius: SIZES.borderRadius.sm,
    marginBottom: SPACING.base,
  },
  errorMessage: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.error,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  button: {
    marginTop: SPACING.base,
    marginBottom: SPACING.base,
  },
  info: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  testInfo: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  footer: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.xl,
    opacity: 0.7,
  },
});

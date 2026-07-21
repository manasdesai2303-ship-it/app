import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/auth';
import { theme } from '@/src/theme';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('owner@goldsmith.pro');
  const [password, setPassword] = useState('Owner@12345');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null); setLoading(true);
    try { await login(email.trim(), password); }
    catch (e: any) { setError(e.message || 'Login failed'); }
    finally { setLoading(false); }
  };

  return (
    <View style={s.root} testID="login-screen">
      <Image
        source="https://images.unsplash.com/photo-1513346940221-6f673d962e97?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <LinearGradient
        colors={['rgba(10,10,10,0.35)', 'rgba(10,10,10,0.85)', 'rgba(10,10,10,1)']}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.brand}>
            <View style={s.logoCircle}>
              <Ionicons name="diamond" size={28} color={theme.dark.brand} />
            </View>
            <Text style={s.brandTitle}>GoldSmith</Text>
            <Text style={s.brandSubtitle}>Manufacturing ERP</Text>
          </View>

          <View style={s.card} testID="login-card">
            <Text style={s.title}>Welcome back</Text>
            <Text style={s.sub}>Sign in to your workshop</Text>

            <Text style={s.label}>EMAIL</Text>
            <TextInput
              testID="login-email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#666"
              style={s.input}
              placeholder="you@example.com"
            />
            <Text style={s.label}>PASSWORD</Text>
            <TextInput
              testID="login-password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#666"
              style={s.input}
              placeholder="••••••••"
            />

            {error && <Text style={s.error} testID="login-error">{error}</Text>}

            <Pressable
              testID="login-submit-button"
              disabled={loading}
              onPress={onSubmit}
              style={({ pressed }) => [s.btn, pressed && { opacity: 0.85 }]}
            >
              <Text style={s.btnText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
            </Pressable>

            <Text style={s.hint} testID="login-hint">
              Demo: owner@goldsmith.pro / Owner@12345
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.dark.surface },
  scroll: { flexGrow: 1, justifyContent: 'flex-end', padding: theme.spacing.xl, paddingBottom: 48 },
  brand: { alignItems: 'center', marginBottom: 40 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: theme.dark.brandTertiary,
    borderWidth: 1, borderColor: theme.dark.brand,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  brandTitle: { fontFamily: theme.font.display, color: theme.dark.brand, fontSize: 40, letterSpacing: 1 },
  brandSubtitle: { color: theme.dark.onSurfaceSecondary, fontSize: 12, letterSpacing: 3, marginTop: 4 },
  card: {
    backgroundColor: 'rgba(21,21,21,0.85)',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    borderWidth: 1, borderColor: theme.dark.border,
  },
  title: { color: theme.dark.onSurface, fontSize: 22, fontWeight: '600' },
  sub: { color: theme.dark.onSurfaceSecondary, fontSize: 13, marginTop: 4, marginBottom: 20 },
  label: { color: theme.dark.onSurfaceTertiary, fontSize: 11, letterSpacing: 2, marginBottom: 6, marginTop: 8 },
  input: {
    backgroundColor: theme.dark.surfaceTertiary,
    color: theme.dark.onSurface,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 15, borderWidth: 1, borderColor: theme.dark.border,
  },
  btn: {
    backgroundColor: theme.dark.brand,
    borderRadius: theme.radius.md, paddingVertical: 16,
    alignItems: 'center', marginTop: 24,
  },
  btnText: { color: theme.dark.onBrandPrimary, fontWeight: '700', letterSpacing: 1, fontSize: 15 },
  error: { color: theme.dark.error, marginTop: 12, fontSize: 13, textAlign: 'center' },
  hint: { color: theme.dark.onSurfaceTertiary, marginTop: 16, textAlign: 'center', fontSize: 11 },
});

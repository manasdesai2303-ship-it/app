import React from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/src/theme';

export function FormShell({ title, onSubmit, submitting, children, testID }: any) {
  const router = useRouter();
  return (
    <SafeAreaView style={s.container} edges={['top']} testID={testID}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={26} color={theme.dark.onSurface} /></Pressable>
        <Text style={s.title}>{title}</Text>
        <View style={{ width: 26 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
      <Pressable style={s.submit} onPress={onSubmit} disabled={submitting} testID="form-submit">
        <Text style={s.submitTxt}>{submitting ? 'Saving…' : 'Save'}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

export function Field({ label, value, onChangeText, keyboardType, testID, multiline }: any) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        value={value?.toString() ?? ''}
        onChangeText={onChangeText}
        placeholderTextColor={theme.dark.onSurfaceTertiary}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[s.input, multiline && { minHeight: 80, textAlignVertical: 'top' }]}
        testID={testID}
      />
    </View>
  );
}

export function Picker({ label, value, options, onChange, testID }: any) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
        {options.map((o: any) => {
          const val = typeof o === 'string' ? o : o.value;
          const lbl = typeof o === 'string' ? o : o.label;
          const active = value === val;
          return (
            <Pressable key={val} onPress={() => onChange(val)}
              style={[s.chip, active && s.chipActive, { flexShrink: 0 }]}
              testID={`${testID}-${val}`}>
              <Text style={[s.chipTxt, active && s.chipTxtActive]}>{lbl}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.dark.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.dark.border },
  title: { color: theme.dark.onSurface, fontSize: 16, fontWeight: '600' },
  label: { color: theme.dark.onSurfaceTertiary, fontSize: 11, letterSpacing: 2, marginBottom: 6 },
  input: { backgroundColor: theme.dark.surfaceSecondary, color: theme.dark.onSurface, borderRadius: theme.radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, borderWidth: 1, borderColor: theme.dark.border },
  chip: { paddingHorizontal: 14, height: 36, borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.dark.border, backgroundColor: theme.dark.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  chipActive: { backgroundColor: theme.dark.brand, borderColor: theme.dark.brand },
  chipTxt: { color: theme.dark.onSurfaceSecondary, fontSize: 12, fontWeight: '600' },
  chipTxtActive: { color: theme.dark.onBrandPrimary },
  submit: { position: 'absolute', bottom: 16, left: 16, right: 16, backgroundColor: theme.dark.brand, borderRadius: theme.radius.md, paddingVertical: 16, alignItems: 'center' },
  submitTxt: { color: theme.dark.onBrandPrimary, fontWeight: '700', letterSpacing: 0.5 },
});
